// Core UI, Theme System, Interactive 3D Probability Lab & Modals

const CV_PDF_URL = 'https://pub-12c622eb3e0d466d90604b9b34319099.r2.dev/content/shaukat_cv.pdf';

// Global Theme Switcher (CSS Custom Properties + CustomEvent)
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
        themeColorMeta.setAttribute('content', targetTheme === 'light' ? '#f8fafc' : '#070714');
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

// Coin Toss Widget Logic
let isTossing = false;
window.tossCoin = function () {
    if (isTossing) return;
    const coin = document.getElementById('shaukatCoin');
    const coinBack = document.getElementById('coinBack');
    const coinResultTitle = document.getElementById('coinResultTitle');
    const announcementText = document.getElementById('announcementText');
    const announcementIcon = document.getElementById('announcementIcon');

    if (!coin || !coinBack || !coinResultTitle) return;
    isTossing = true;

    const isHeads = Math.random() < 0.5;

    coin.classList.remove('tossing-heads', 'tossing-tails');
    void coin.offsetWidth;

    if (isHeads) {
        coinBack.classList.remove('tails');
        coinResultTitle.textContent = 'HEADS';
        coin.classList.add('tossing-heads');
    } else {
        coinBack.classList.add('tails');
        coinResultTitle.textContent = 'TAILS';
        coin.classList.add('tossing-tails');
    }

    if (announcementText) {
        announcementText.textContent = 'Measuring coin superposition...';
        if (announcementIcon) {
            announcementIcon.className = 'fas fa-sync-alt fa-spin announcement-icon';
            announcementIcon.style.color = '#f59e0b';
        }
    }

    setTimeout(() => {
        const resultStr = isHeads ? 'HEADS!' : 'TAILS!';
        if (announcementText) {
            announcementText.innerHTML = `Coin Measured: <strong>${resultStr}</strong>`;
            if (announcementIcon) {
                announcementIcon.className = 'fas fa-coins announcement-icon';
                announcementIcon.style.color = isHeads ? '#f59e0b' : '#94a3b8';
            }
        }
        isTossing = false;
    }, 1200);
};

// Dice Rolling Widget Logic
let isRolling = false;
window.rollDice = function () {
    if (isRolling) return;
    const dice = document.getElementById('physicsDice');
    const announcementText = document.getElementById('announcementText');
    const announcementIcon = document.getElementById('announcementIcon');

    if (!dice) return;
    isRolling = true;

    const result = Math.floor(Math.random() * 6) + 1;
    const faceRotations = {
        1: { x: 0, y: 0 },
        2: { x: 0, y: 180 },
        3: { x: 0, y: -90 },
        4: { x: 0, y: 90 },
        5: { x: -90, y: 0 },
        6: { x: 90, y: 0 }
    };

    window.diceSpins = (window.diceSpins || 0) + 3;
    const targetX = faceRotations[result].x + window.diceSpins * 360;
    const targetY = faceRotations[result].y + window.diceSpins * 360;

    dice.style.transform = `rotateX(${targetX}deg) rotateY(${targetY}deg)`;

    if (announcementText) {
        announcementText.textContent = 'Rolling the 3D quantum die...';
        if (announcementIcon) {
            announcementIcon.className = 'fas fa-dice fa-spin announcement-icon';
            announcementIcon.style.color = 'var(--accent-soft)';
        }
    }

    setTimeout(() => {
        if (announcementText) {
            announcementText.innerHTML = `Die Outcome: <strong>State |${result}⟩</strong>`;
            if (announcementIcon) {
                announcementIcon.className = 'fas fa-dice-d6 announcement-icon';
                announcementIcon.style.color = '#10b981';
            }
        }
        isRolling = false;
    }, 1500);
};

// Accordion Toggle
window.toggleAccordion = function (header) {
    const item = header && header.parentElement;
    if (!item) return;
    const isActive = item.classList.toggle('active');
    header.setAttribute('aria-expanded', String(isActive));
};

// Mobile Menu Toggle
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

// Contact Modal Functions
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

// CV Viewer Modal Functions
window.openCVViewModal = function () {
    const modal = document.getElementById('cvViewModal');
    const frame = document.getElementById('cvViewFrame');
    if (!modal || !frame) return;

    const isMobile =
        window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    frame.src = isMobile
        ? `https://docs.google.com/viewer?url=${encodeURIComponent(CV_PDF_URL)}&embedded=true`
        : CV_PDF_URL;

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
    // Fast preloader dismissal so FCP/LCP stay snappy
    const preloader = document.getElementById('preloader');
    function hidePreloader() {
        if (!preloader || preloader.dataset.dismissed) return;
        preloader.dataset.dismissed = '1';
        preloader.classList.add('hidden');
        setTimeout(() => {
            if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
        }, 320);
    }

    if (preloader) {
        setTimeout(hidePreloader, 180);
        window.addEventListener('load', hidePreloader, { once: true });
        setTimeout(hidePreloader, 1200);
    }

    // Close mobile menu when clicking outside
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

    // Backdrop click closures for modals
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

    // Escape key closes open modal or mobile drawer
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const cModal = document.getElementById('contactModal');
        const cvModal = document.getElementById('cvViewModal');
        const mMenu = document.getElementById('mobileMenu');
        if (cvModal && cvModal.style.display === 'flex') window.closeCVViewModal();
        else if (cModal && cModal.style.display === 'flex') window.closeContactModal();
        else if (mMenu && mMenu.classList.contains('open')) window.toggleMenu();
    });

    // Apply saved theme & sync UI controls
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
