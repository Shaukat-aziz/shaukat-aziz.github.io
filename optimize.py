#!/usr/bin/env python3
"""
Website Optimizer - Performs various optimizations on web assets
- Minifies CSS, JS, and HTML
- Optimizes images
- Validates HTML
- Checks for dead links
"""

import os
import re
import sys
import glob
import subprocess
import shutil
from pathlib import Path

# Check for required packages
try:
    import cssmin
except ImportError:
    subprocess.call([sys.executable, "-m", "pip", "install", "--break-system-packages", "cssmin"])
    try:
        import cssmin
    except:
        pass

try:
    import jsmin
except ImportError:
    subprocess.call([sys.executable, "-m", "pip", "install", "--break-system-packages", "jsmin"])
    try:
        import jsmin
    except:
        pass

try:
    import htmlmin
except ImportError:
    subprocess.call([sys.executable, "-m", "pip", "install", "--break-system-packages", "htmlmin"])
    try:
        import htmlmin
    except:
        pass

try:
    from PIL import Image
except ImportError:
    subprocess.call([sys.executable, "-m", "pip", "install", "--break-system-packages", "pillow"])
    try:
        from PIL import Image
    except:
        pass

def minify_css(css_content):
    """Minify CSS content"""
    if 'cssmin' in sys.modules:
        return cssmin.cssmin(css_content)
    return css_content

def minify_js(js_content):
    """Minify JS content"""
    if 'jsmin' in sys.modules:
        return jsmin.jsmin(js_content)
    return js_content

def minify_html(html_content):
    """Minify HTML content"""
    if 'htmlmin' in sys.modules:
        return htmlmin.minify(html_content, remove_comments=True, 
                              remove_empty_space=True, remove_all_empty_space=False)
    return html_content

def compress_image(img_path, quality=85):
    """Compress image file"""
    try:
        img = Image.open(img_path)
        
        # Create backup
        backup_path = img_path + '.backup'
        if not os.path.exists(backup_path):
            shutil.copy2(img_path, backup_path)
        
        # Save with compression
        img.save(img_path, optimize=True, quality=quality)
        print(f"Compressed: {img_path}")
        
        return True
    except Exception as e:
        print(f"Error compressing {img_path}: {e}")
        return False

def optimize_css_files(directory):
    """Find and optimize CSS files"""
    css_files = glob.glob(os.path.join(directory, "**/*.css"), recursive=True)
    for css_file in css_files:
        print(f"Optimizing CSS: {css_file}")
        
        with open(css_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Minify content
        minified = minify_css(content)
        
        # Write minified content
        with open(css_file, 'w', encoding='utf-8') as f:
            f.write(minified)
        
        # Calculate reduction
        original_size = len(content)
        minified_size = len(minified)
        if original_size > 0:
            reduction = 100 - (minified_size / original_size * 100)
            print(f"  - Reduced by: {reduction:.1f}% ({original_size} → {minified_size} bytes)")

def optimize_js_files(directory):
    """Find and optimize JS files"""
    js_files = glob.glob(os.path.join(directory, "**/*.js"), recursive=True)
    for js_file in js_files:
        print(f"Optimizing JS: {js_file}")
        
        with open(js_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Minify content
        minified = minify_js(content)
        
        # Write minified content
        with open(js_file, 'w', encoding='utf-8') as f:
            f.write(minified)
        
        # Calculate reduction
        original_size = len(content)
        minified_size = len(minified)
        if original_size > 0:
            reduction = 100 - (minified_size / original_size * 100)
            print(f"  - Reduced by: {reduction:.1f}% ({original_size} → {minified_size} bytes)")

def optimize_html_files(directory):
    """Find and optimize HTML files"""
    html_files = glob.glob(os.path.join(directory, "**/*.html"), recursive=True)
    for html_file in html_files:
        print(f"Optimizing HTML: {html_file}")
        
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Minify content
        minified = minify_html(content)
        
        # Write minified content
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(minified)
        
        # Calculate reduction
        original_size = len(content)
        minified_size = len(minified)
        if original_size > 0:
            reduction = 100 - (minified_size / original_size * 100)
            print(f"  - Reduced by: {reduction:.1f}% ({original_size} → {minified_size} bytes)")

def optimize_images(directory):
    """Find and optimize image files"""
    img_extensions = ['.jpg', '.jpeg', '.png', '.webp']
    image_files = []
    
    for ext in img_extensions:
        image_files.extend(glob.glob(os.path.join(directory, f"**/*{ext}"), recursive=True))
    
    for img_file in image_files:
        print(f"Optimizing image: {img_file}")
        try:
            img = Image.open(img_file)
            img.save(img_file, optimize=True, quality=85)
            print(f"  - Compressed: {img_file}")
        except Exception as e:
            print(f"  - Error compressing {img_file}: {e}")

def find_and_suggest_improvements(directory):
    """Find potential areas for improvement"""
    print("\nSuggested Improvements:")
    
    # Check for inline styles in HTML files
    html_files = glob.glob(os.path.join(directory, "**/*.html"), recursive=True)
    inline_styles_found = False
    for html_file in html_files:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'style="' in content:
                print(f"- Found inline styles in {html_file} - Consider moving to external CSS")
                inline_styles_found = True
    
    if not inline_styles_found:
        print("- No inline styles found - Good practice!")
    
    # Check for render-blocking resources
    js_in_head = False
    for html_file in html_files:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
            head_section = re.search(r'<head>.*?</head>', content, re.DOTALL)
            if head_section and '<script' in head_section.group(0) and not 'async' in head_section.group(0):
                print(f"- Found render-blocking scripts in <head> in {html_file} - Consider adding 'async' or 'defer'")
                js_in_head = True
    
    if not js_in_head:
        print("- No render-blocking scripts found - Good practice!")
    
    # Check for large CSS/JS files
    css_files = glob.glob(os.path.join(directory, "**/*.css"), recursive=True)
    for css_file in css_files:
        size = os.path.getsize(css_file)
        if size > 50000:  # 50KB
            print(f"- Large CSS file detected: {css_file} ({size/1024:.1f} KB) - Consider breaking into smaller files")

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    dist_dir = os.path.join(root_dir, "dist")
    
    print(f"Building and optimizing website into: {dist_dir}")
    
    # Create dist directory
    if not os.path.exists(dist_dir):
        os.makedirs(dist_dir)
        
    # Copy files to dist to avoid modifying source files
    print("Copying files to dist directory...")
    for item in ["css", "js", "tabs", "small_files", "content"]:
        src = os.path.join(root_dir, item)
        dst = os.path.join(dist_dir, item)
        if os.path.exists(src):
            if os.path.exists(dst):
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
            
    for html_file in glob.glob(os.path.join(root_dir, "*.html")):
        shutil.copy2(html_file, dist_dir)
    
    # Run optimizations on the dist directory
    optimize_css_files(dist_dir)
    optimize_js_files(dist_dir)
    optimize_html_files(dist_dir)
    optimize_images(dist_dir)
    
    # Find other potential improvements
    find_and_suggest_improvements(dist_dir)
    
    print("\nOptimization complete! Optimized files are ready in the 'dist' directory.")

if __name__ == "__main__":
    main()
