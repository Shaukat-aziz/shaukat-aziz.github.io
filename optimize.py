#!/usr/bin/env python3
"""Zero-dependency Netlify static site builder & integrity validator.

Builds the production `dist/` directory using Python 3 standard library only:
- Copies public directories (`css`, `js`, `tabs`, `small_files`, `assets`)
  and root public files (`index.html`, `404.html`, `robots.txt`, `sitemap.xml`, `site.webmanifest`).
- Losslessly minifies CSS (strips comments outside strings & collapses whitespace).
- Safely cleans HTML (removes HTML comments and redundant blank lines while preserving
  inline <script>, <style>, <pre>, and <svg> blocks verbatim).
- Copies JS and binary assets untouched so image/script integrity is guaranteed.
- Audits every HTML page in `dist/` to ensure all local relative `href`/`src`
  targets resolve to real, non-zero-byte files inside `dist/`.
"""

from html.parser import HTMLParser
from pathlib import Path
import re
import shutil
import sys
from urllib.parse import urlparse


PUBLIC_DIRS = ("css", "js", "tabs", "small_files", "assets")
PUBLIC_ROOT_FILES = ("index.html", "404.html", "robots.txt", "sitemap.xml", "site.webmanifest")
SKIP_NAMES = {".gitkeep", ".DS_Store", "Thumbs.db"}


def minify_css(css_text: str) -> str:
    """Losslessly strip CSS comments (outside quoted strings) and excess whitespace."""
    out = []
    i = 0
    n = len(css_text)
    in_quote = None

    while i < n:
        ch = css_text[i]
        if in_quote:
            out.append(ch)
            if ch == "\\" and i + 1 < n:
                out.append(css_text[i + 1])
                i += 2
                continue
            if ch == in_quote:
                in_quote = None
            i += 1
        elif ch in ('"', "'"):
            in_quote = ch
            out.append(ch)
            i += 1
        elif ch == "/" and i + 1 < n and css_text[i + 1] == "*":
            end = css_text.find("*/", i + 2)
            if end == -1:
                break
            i = end + 2
        else:
            out.append(ch)
            i += 1

    stripped = "".join(out)
    # Collapse runs of whitespace/newlines cleanly without breaking CSS calc()/spaces
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in stripped.splitlines()]
    compact = "\n".join(line for line in lines if line)
    return compact + "\n"


def clean_html(html_text: str) -> str:
    """Strip HTML comments and empty lines while keeping <script>/<style>/<pre>/<svg> verbatim."""
    protected_blocks = []
    pattern = re.compile(r"(<(?:script|style|pre|svg)\b[^>]*>.*?</(?:script|style|pre|svg)>)", re.IGNORECASE | re.DOTALL)

    def _stash(match: re.Match) -> str:
        idx = len(protected_blocks)
        protected_blocks.append(match.group(1))
        return f"__PROTECTED_BLOCK_{idx}__"

    working = pattern.sub(_stash, html_text)
    # Remove HTML comments (outside protected blocks)
    working = re.sub(r"<!--(?!\[if).*?-->", "", working, flags=re.DOTALL)
    # Collapse blank lines outside protected blocks
    lines = [line.rstrip() for line in working.splitlines() if line.strip()]
    working = "\n".join(lines) + "\n"

    for idx, block in enumerate(protected_blocks):
        working = working.replace(f"__PROTECTED_BLOCK_{idx}__", block)

    return working


class AssetLinkAuditor(HTMLParser):
    """Collects local href/src references from built HTML documents."""

    def __init__(self) -> None:
        super().__init__()
        self.refs: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for attr_name, attr_val in attrs:
            if attr_name in ("href", "src") and attr_val:
                self.refs.append((attr_name, attr_val.strip()))


def is_external_or_virtual(url: str) -> bool:
    if not url or url.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
        return True
    parsed = urlparse(url)
    return bool(parsed.scheme or parsed.netloc)


def copy_public_tree(root_dir: Path, dist_dir: Path) -> None:
    if dist_dir.exists():
        shutil.rmtree(dist_dir)
    dist_dir.mkdir(parents=True, exist_ok=True)

    for folder in PUBLIC_DIRS:
        src_folder = root_dir / folder
        if not src_folder.exists():
            continue
        dst_folder = dist_dir / folder
        shutil.copytree(
            src_folder,
            dst_folder,
            ignore=lambda _dir, names: [
                name for name in names if name in SKIP_NAMES or name.startswith(".") or name.endswith(".backup")
            ],
        )

    for filename in PUBLIC_ROOT_FILES:
        src_file = root_dir / filename
        if src_file.exists():
            shutil.copy2(src_file, dist_dir / filename)


def process_assets(dist_dir: Path) -> tuple[int, int, list[tuple[str, int, int]]]:
    report: list[tuple[str, int, int]] = []
    total_before = 0
    total_after = 0

    for path in sorted(dist_dir.rglob("*")):
        if not path.is_file():
            continue
        rel = path.relative_to(dist_dir).as_posix()
        raw_bytes = path.read_bytes()
        before = len(raw_bytes)

        if path.suffix.lower() == ".css":
            cleaned = minify_css(raw_bytes.decode("utf-8"))
            path.write_text(cleaned, encoding="utf-8", newline="\n")
        elif path.suffix.lower() == ".html":
            cleaned = clean_html(raw_bytes.decode("utf-8"))
            path.write_text(cleaned, encoding="utf-8", newline="\n")
        elif path.suffix.lower() == ".js":
            # Trim trailing whitespace per line only — never mutate regexes or literals
            text = raw_bytes.decode("utf-8")
            trimmed = "\n".join(line.rstrip() for line in text.splitlines()) + "\n"
            path.write_text(trimmed, encoding="utf-8", newline="\n")

        after = path.stat().st_size
        total_before += before
        total_after += after
        report.append((rel, before, after))

    return total_before, total_after, report


def audit_dist(dist_dir: Path) -> list[str]:
    errors: list[str] = []

    # Check zero-byte files in dist
    for path in sorted(dist_dir.rglob("*")):
        if path.is_file() and path.stat().st_size == 0:
            errors.append(f"Zero-byte file in dist: {path.relative_to(dist_dir).as_posix()}")

    # Verify all relative links/assets in every HTML page
    for html_file in sorted(dist_dir.rglob("*.html")):
        auditor = AssetLinkAuditor()
        auditor.feed(html_file.read_text(encoding="utf-8"))
        rel_html = html_file.relative_to(dist_dir).as_posix()

        for attr, ref in auditor.refs:
            if is_external_or_virtual(ref):
                continue
            clean_ref = ref.split("#", 1)[0].split("?", 1)[0]
            if not clean_ref:
                continue

            if clean_ref.startswith("/"):
                target = dist_dir / clean_ref.lstrip("/")
            else:
                target = (html_file.parent / clean_ref).resolve()

            try:
                target.relative_to(dist_dir.resolve())
            except ValueError:
                errors.append(f"{rel_html}: {attr}='{ref}' resolves outside dist/")
                continue

            if clean_ref == "/":
                target = dist_dir / "index.html"

            if not target.exists():
                errors.append(f"{rel_html}: broken {attr}='{ref}' -> missing {target}")

    return errors


def main() -> int:
    root_dir = Path(__file__).resolve().parent
    dist_dir = root_dir / "dist"

    print(f"Building Netlify distribution in: {dist_dir}")
    copy_public_tree(root_dir, dist_dir)
    before, after, report = process_assets(dist_dir)
    errors = audit_dist(dist_dir)

    print(f"\nProcessed {len(report)} files ({before:,} -> {after:,} bytes):")
    for rel, b, a in report:
        pct = (100.0 * (b - a) / b) if b else 0.0
        print(f"  - {rel:<34} {b:>8,} -> {a:>8,} bytes ({pct:>4.1f}% saved)")

    if errors:
        print("\nBuild audit FAILED:", file=sys.stderr)
        for err in errors:
            print(f"  [ERROR] {err}", file=sys.stderr)
        return 1

    print("\nAudit PASSED: all relative links and assets verified in dist/.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
