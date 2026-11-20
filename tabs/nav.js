// Shared Navigation, Contact Modal, CV Viewer Modal & Footer Injector for /tabs/*
(function () {
    const possiblePaths = ['nav.html', './nav.html'];

    function injectContactModal() {
        if (document.getElementById('contactModal')) return;
        const modalHTML = `
        <div class="contact-modal" id="contactModal" role="dialog" aria-modal="true" aria-labelledby="contactModalTitle">
            <div class="contact-modal-content">
                <div class="contact-modal-header">
                    <h3 id="contactModalTitle">Contact Me</h3>
                    <button type="button" class="contact-close-btn" onclick="closeContactModal()" aria-label="Close contact dialog">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="contact-modal-body">
                    <p>Get in touch for research collaborations, academic discussions, or any inquiries.</p>
                    <div class="contact-options">
                        <a href="mailto:shaukataziz@atomicmail.io" class="contact-option">
                            <i class="fas fa-envelope"></i>
                            <span>shaukataziz@atomicmail.io</span>
                        </a>
                        <a href="https://t.me/shaukatazizzz" class="contact-option" target="_blank" rel="noopener noreferrer">
                            <i class="fab fa-telegram"></i>
                            <span>t.me/shaukatazizzz</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>`;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = modalHTML;
        document.body.appendChild(wrapper.firstElementChild);
    }

    function injectCVModal() {
        if (document.getElementById('cvViewModal')) return;
        const modalHTML = `
        <div class="cv-view-modal" id="cvViewModal" role="dialog" aria-modal="true" aria-labelledby="cvModalTitle">
            <div class="cv-view-modal-content">
                <div class="cv-view-modal-header">
                    <h3 id="cvModalTitle">Curriculum Vitae - Shaukat Aziz</h3>
                    <button type="button" class="cv-view-close-btn" onclick="closeCVViewModal()" aria-label="Close CV viewer">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="cv-view-modal-body">
                    <iframe id="cvViewFrame" src="" title="Shaukat Aziz Curriculum Vitae"></iframe>
                </div>
            </div>
        </div>`;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = modalHTML;
        document.body.appendChild(wrapper.firstElementChild);
    }

    function injectFooter() {
        if (document.querySelector('footer.site-footer')) return;
        const footerHTML = `
        <footer class="site-footer">
            <div class="footer-brand">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="26" height="26" aria-hidden="true">
                    <defs>
                        <linearGradient id="tabFootOrbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="var(--accent)" />
                            <stop offset="100%" stop-color="var(--accent-cyan)" />
                        </linearGradient>
                    </defs>
                    <ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="url(#tabFootOrbGrad)" stroke-width="2.5" />
                    <ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="url(#tabFootOrbGrad)" stroke-width="2.5" transform="rotate(60 50 50)" />
                    <ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="url(#tabFootOrbGrad)" stroke-width="2.5" transform="rotate(-60 50 50)" />
                    <circle cx="50" cy="50" r="10" fill="var(--accent-soft)" />
                </svg>
                <span>Shaukat Aziz · shaukataziz.vip</span>
            </div>
            <div class="footer-links">
                <a href="../index.html">Home</a>
                <a href="notes.html">Notes</a>
                <a href="projects.html">Projects</a>
                <a href="blog.html">Blog</a>
                <a href="favorites.html">Favorites</a>
            </div>
            <span>&copy; 2026 Shaukat Aziz · Hosted on Netlify</span>
        </footer>`;
        const wrapper = document.createElement('div');
        wrapper.innerHTML = footerHTML;
        document.body.appendChild(wrapper.firstElementChild);
    }

    function markActiveNavLink() {
        const currentFile = (window.location.pathname.split('/').pop() || '').toLowerCase();
        if (!currentFile) return;
        document.querySelectorAll('#navbar .nav-links a').forEach((link) => {
            const href = (link.getAttribute('href') || '').toLowerCase();
            if (href === currentFile) {
                link.setAttribute('aria-current', 'page');
            }
        });
    }

    function ensureMainScript() {
        if (document.querySelector('script[data-main-script]')) return;
        const s = document.createElement('script');
        s.src = '../js/script.js?v=2.0.0';
        s.setAttribute('data-main-script', '1');
        s.onload = function () {
            try {
                const t = localStorage.getItem('site-theme') || 'default';
                if (window.setTheme) window.setTheme(t);
            } catch (_) {}
        };
        document.body.appendChild(s);
    }

    function tryFetchNav(paths, index) {
        if (index >= paths.length) {
            console.error('Could not load navigation from any path');
            return;
        }
        fetch(paths[index])
            .then((response) => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.text();
            })
            .then((data) => {
                const navbar = document.getElementById('navbar');
                if (navbar) {
                    navbar.innerHTML = data;
                    markActiveNavLink();
                }
                injectContactModal();
                injectCVModal();
                injectFooter();
                ensureMainScript();
            })
            .catch((error) => {
                console.error(`Failed to load nav from ${paths[index]}:`, error);
                tryFetchNav(paths, index + 1);
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => tryFetchNav(possiblePaths, 0));
    } else {
        tryFetchNav(possiblePaths, 0);
    }
})();
