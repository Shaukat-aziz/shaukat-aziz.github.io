// Core UI, Theme System, Accordions, Navigation Drawer & Modals

const CV_PDF_FILENAME = 'small_files/Z%20Shaukat%20Aziz%20-%20Curriculum%20Vitae.pdf';

window.setTheme = function (theme) {
    const validThemes = ['default', 'cyan', 'green', 'orange', 'red', 'light'];
    const targetTheme = validThemes.includes(theme) ? theme : 'default';

    if (targetTheme === 'default') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', targetTheme);
    }

    try {
        localStorage.setItem('site-theme', targetTheme);
    } catch (_) {
        /* ignore storage restrictions */
    }

    document.querySelectorAll('.theme-picker-btn').forEach((btn) => {
        const isActive = btn.getAttribute('data-theme-value') === targetTheme;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
    });

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
        themeColorMeta.setAttribute('content', targetTheme === 'light' ? '#fafafa' : '#090a0f');
    }

    window.updateThemeToggleButtons(targetTheme);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: targetTheme } }));
};

window.updateThemeToggleButtons = function (theme) {
    let activeTheme = theme;
    if (!activeTheme) {
        try {
            activeTheme = localStorage.getItem('site-theme') || 'default';
        } catch (_) {
            activeTheme = 'default';
        }
    }
    const isLight = activeTheme === 'light';
    document.querySelectorAll('.theme-toggle-btn').forEach((btn) => {
        btn.textContent = isLight ? 'Dark' : 'Light';
        btn.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
        btn.setAttribute('aria-pressed', String(isLight));
    });
};

window.toggleLightTheme = function () {
    let currentTheme = 'default';
    try {
        currentTheme = localStorage.getItem('site-theme') || 'default';
    } catch (_) {
        currentTheme = 'default';
    }
    window.setTheme(currentTheme === 'light' ? 'default' : 'light');
};

window.toggleAccordion = function (header) {
    const item = header && header.parentElement;
    if (!item) return;
    const isActive = item.classList.toggle('active');
    header.setAttribute('aria-expanded', String(isActive));
};

window.toggleMenu = function () {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('overlay');

    const willOpen = mobileMenu ? !mobileMenu.classList.contains('open') : false;

    if (hamburger) {
        hamburger.classList.toggle('open', willOpen);
        hamburger.setAttribute('aria-expanded', String(willOpen));
    }
    if (mobileMenu) {
        mobileMenu.classList.toggle('open', willOpen);
    }
    if (overlay) {
        overlay.classList.toggle('active', willOpen);
    }

    document.body.style.overflow = willOpen ? 'hidden' : '';
};

window.openContactModal = function () {
    const modal = document.getElementById('contactModal');
    if (!modal) return;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.closeContactModal = function () {
    const modal = document.getElementById('contactModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
};

window.openCVViewModal = function () {
    const modal = document.getElementById('cvViewModal');
    const frame = document.getElementById('cvViewFrame');
    if (!modal || !frame) return;

    const isSubpage = /\/tabs\//.test(window.location.pathname);
    const cvRelativeUrl = (isSubpage ? '../' : '') + CV_PDF_FILENAME;
    const absoluteCvUrl = new URL(cvRelativeUrl, window.location.href).href;
    const isLocalHost =
        window.location.protocol === 'file:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

    const isMobile =
        window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    frame.src =
        isMobile && !isLocalHost
            ? `https://docs.google.com/viewer?url=${encodeURIComponent(absoluteCvUrl)}&embedded=true`
            : cvRelativeUrl;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.closeCVViewModal = function () {
    const modal = document.getElementById('cvViewModal');
    const frame = document.getElementById('cvViewFrame');
    if (!modal) return;
    modal.style.display = 'none';
    if (frame) frame.src = '';
    document.body.style.overflow = '';
};

function initSite() {
    const preloader = document.getElementById('preloader');
    function hidePreloader() {
        if (!preloader || preloader.dataset.dismissed) return;
        preloader.dataset.dismissed = '1';
        preloader.classList.add('hidden');
        setTimeout(() => {
            if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
        }, 280);
    }

    if (preloader) {
        setTimeout(hidePreloader, 150);
        window.addEventListener('load', hidePreloader, { once: true });
        setTimeout(hidePreloader, 1000);
    }

    document.addEventListener('click', (event) => {
        const mobileMenu = document.getElementById('mobileMenu');
        const hamburger = document.querySelector('.hamburger');
        if (
            mobileMenu &&
            mobileMenu.classList.contains('open') &&
            !mobileMenu.contains(event.target) &&
            (!hamburger || !hamburger.contains(event.target))
        ) {
            window.toggleMenu();
        }
    });

    const contactModal = document.getElementById('contactModal');
    if (contactModal) {
        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) window.closeContactModal();
        });
    }

    const cvViewModal = document.getElementById('cvViewModal');
    if (cvViewModal) {
        cvViewModal.addEventListener('click', (e) => {
            if (e.target === cvViewModal) window.closeCVViewModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const cModal = document.getElementById('contactModal');
        const cvModal = document.getElementById('cvViewModal');
        const mMenu = document.getElementById('mobileMenu');
        if (cvModal && cvModal.style.display === 'flex') window.closeCVViewModal();
        else if (cModal && cModal.style.display === 'flex') window.closeContactModal();
        else if (mMenu && mMenu.classList.contains('open')) window.toggleMenu();
    });

    let savedTheme = 'default';
    try {
        savedTheme = localStorage.getItem('site-theme') || 'default';
    } catch (_) {
        savedTheme = 'default';
    }
    window.setTheme(savedTheme);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSite);
} else {
    initSite();
}
