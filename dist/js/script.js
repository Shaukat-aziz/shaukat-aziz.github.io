// JavaScript moved from index.html

// Toggle mobile menu
function toggleMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('overlay');

    if (hamburger) hamburger.classList.toggle('open');
    if (mobileMenu) mobileMenu.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');

    // Toggle body overflow when menu is open
    if (mobileMenu && mobileMenu.classList.contains('open')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

// Contact Modal Functions
function openContactModal() {
    const modal = document.getElementById('contactModal');
    if (!modal) return;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeContactModal() {
    const modal = document.getElementById('contactModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

// CV Viewer Modal Functions
function openCVViewModal() {
    const modal = document.getElementById('cvViewModal');
    const frame = document.getElementById('cvViewFrame');
    if (!modal || !frame) return;

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
        frame.src = './shaukat_cv.pdf';
    } else {
        frame.src = 'https://docs.google.com/gview?url=https://shaukat23.github.io/main/shaukat_cv.pdf&embedded=true';
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeCVViewModal() {
    const modal = document.getElementById('cvViewModal');
    const frame = document.getElementById('cvViewFrame');
    if (!modal) return;
    modal.style.display = 'none';
    if (frame) frame.src = '';
    document.body.style.overflow = '';
}

// XKCD Modal Functions (optional)
let latestXkcd = null;
function openXKCDModal() {
    if (!latestXkcd) return;
    const modal = document.getElementById('xkcdModal');
    const modalImg = document.getElementById('xkcdModalImg');
    const modalTitle = document.getElementById('xkcdModalTitle');
    const modalAlt = document.getElementById('xkcdModalAlt');
    if (!modal || !modalImg) return;

    modalImg.src = latestXkcd.img;
    modalAlt.textContent = latestXkcd.altText || latestXkcd.alt || '';
    modalTitle.textContent = `XKCD #${latestXkcd.num}: ${latestXkcd.title}`;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeXKCDModal() {
    const modal = document.getElementById('xkcdModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', function () {
    // Hide preloader once page is fully loaded (also fallback on DOMContentLoaded)
    const preloader = document.getElementById('preloader');
    function hidePreloader() {
        if (!preloader) return;
        preloader.classList.add('hidden');
        setTimeout(() => {
            if (preloader && preloader.parentNode) preloader.parentNode.removeChild(preloader);
        }, 600);
    }

    // If the full window load already fired, hide immediately
    if (document.readyState === 'complete') {
        hidePreloader();
    } else {
        window.addEventListener('load', hidePreloader);
        // Also hide after a timeout as a safety
        setTimeout(hidePreloader, 4000);
    }

    // Close menu when clicking outside
    document.addEventListener('click', function (event) {
        const mobileMenu = document.getElementById('mobileMenu');
        const hamburger = document.querySelector('.hamburger');
        const overlay = document.getElementById('overlay');

        if (mobileMenu && mobileMenu.classList.contains('open') &&
            !mobileMenu.contains(event.target) &&
            (!hamburger || !hamburger.contains(event.target))) {
            toggleMenu();
        }
    });

    // Close contact modal when clicking outside
    const contactModal = document.getElementById('contactModal');
    if (contactModal) {
        contactModal.addEventListener('click', function(e) {
            if (e.target === this) closeContactModal();
        });
    }

    // Close CV viewer modal when clicking outside
    const cvViewModal = document.getElementById('cvViewModal');
    if (cvViewModal) {
        cvViewModal.addEventListener('click', function(e) {
            if (e.target === this) closeCVViewModal();
        });
    }

    // Ensure XKCD modal closes when clicking outside
    const xkcdModal = document.getElementById('xkcdModal');
    if (xkcdModal) {
        xkcdModal.addEventListener('click', e => {
            if (e.target === xkcdModal) closeXKCDModal();
        });
    }

    // Fade-in animation for elements on scroll
    const fadeInImages = document.querySelectorAll('.js-fade-in-image');
    if (fadeInImages.length) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // Stop observing once it's visible
                }
            });
        }, { threshold: 0.1 });

        fadeInImages.forEach(image => observer.observe(image));
    }

    // Fetch latest XKCD comic (non-blocking)
    fetch('https://aqendo.github.io/xkcd-parser/parsed.json')
        .then(response => response.json())
        .then(jsonData => {
            const comics = Array.isArray(jsonData) ? jsonData : [jsonData];
            latestXkcd = comics[Math.floor(Math.random() * comics.length)];
        })
        .catch(() => {/* ignore fetch errors */});
});