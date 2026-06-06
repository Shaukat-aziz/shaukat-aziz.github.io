// JavaScript moved from index.html

// Global Theme Switcher functions
window.setTheme = function(theme) {
    if (theme === 'default') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem('site-theme', theme);
    
    // Update active state in picker buttons
    document.querySelectorAll('.theme-picker-btn').forEach(btn => {
        if (btn.getAttribute('data-theme-value') === theme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    window.updateThemeToggleButtons(theme);
};

window.updateThemeToggleButtons = function(theme) {
    const activeTheme = theme || localStorage.getItem('site-theme') || 'default';
    const isLight = activeTheme === 'light';
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
        btn.textContent = isLight ? 'Dark' : 'Light';
        btn.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
    });
};

window.toggleLightTheme = function() {
    const currentTheme = localStorage.getItem('site-theme') || 'default';
    window.setTheme(currentTheme === 'light' ? 'default' : 'light');
};

// Coin Toss Widget Logic
let isTossing = false;
window.tossCoin = function() {
    if (isTossing) return;
    isTossing = true;
    
    const coin = document.getElementById('shaukatCoin');
    const coinBack = document.getElementById('coinBack');
    const coinResultTitle = document.getElementById('coinResultTitle');
    const announcementText = document.getElementById('announcementText');
    const announcementIcon = document.getElementById('announcementIcon');
    
    if (!coin) return;
    
    // Determine result
    const isHeads = Math.random() < 0.5;
    
    // Clear previous tossing classes
    coin.classList.remove('tossing-heads', 'tossing-tails');
    void coin.offsetWidth; // Trigger reflow to restart animation
    
    // Configure coin face & class
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
        announcementText.textContent = "Tossing the coin... 🪙";
        if (announcementIcon) {
            announcementIcon.className = "fas fa-sync-alt fa-spin announcement-icon";
            announcementIcon.style.color = "#FFD700";
        }
    }
    
    // Display result after flip finishes (1.2s)
    setTimeout(() => {
        const resultStr = isHeads ? "HEADS! 🪙" : "TAILS! 🪙";
        if (announcementText) {
            announcementText.innerHTML = `Toss Result: <strong>${resultStr}</strong>`;
            if (announcementIcon) {
                announcementIcon.className = "fas fa-coins announcement-icon";
                announcementIcon.style.color = isHeads ? "#FFD700" : "#C0C0C0";
            }
        }
    }, 1200);
    
    // Reset back to shaukat photo after 5 seconds
    setTimeout(() => {
        coin.classList.remove('tossing-heads', 'tossing-tails');
        if (announcementText) {
            announcementText.textContent = "Click the portrait to toss a coin, or the dice to roll!";
            if (announcementIcon) {
                announcementIcon.className = "fas fa-bullhorn announcement-icon";
                announcementIcon.style.color = "#00E676";
            }
        }
        isTossing = false;
    }, 5000);
};

// Dice Rolling Widget Logic
let isRolling = false;
window.rollDice = function() {
    if (isRolling) return;
    isRolling = true;
    
    const dice = document.getElementById('physicsDice');
    const announcementText = document.getElementById('announcementText');
    const announcementIcon = document.getElementById('announcementIcon');
    
    if (!dice) return;
    
    // Roll random face (1 to 6)
    const result = Math.floor(Math.random() * 6) + 1;
    
    // Standard face rotations for landing
    const faceRotations = {
        1: { x: 0, y: 0 },
        2: { x: 0, y: 180 },
        3: { x: 0, y: -90 },
        4: { x: 0, y: 90 },
        5: { x: -90, y: 0 },
        6: { x: 90, y: 0 }
    };
    
    // Add multiple crazy spins
    const spins = 3; // 3 full turns
    const targetX = faceRotations[result].x + (spins * 360);
    const targetY = faceRotations[result].y + (spins * 360);
    
    dice.style.transform = `rotateX(${targetX}deg) rotateY(${targetY}deg)`;
    
    if (announcementText) {
        announcementText.textContent = "Rolling the dice... 🎲";
        if (announcementIcon) {
            announcementIcon.className = "fas fa-dice fa-spin announcement-icon";
            announcementIcon.style.color = "#8B00FF";
        }
    }
    
    // Display result after roll finishes (1.5s)
    setTimeout(() => {
        if (announcementText) {
            announcementText.innerHTML = `Dice Rolled: <strong>${result}! 🎲</strong>`;
            if (announcementIcon) {
                announcementIcon.className = "fas fa-dice-d6 announcement-icon";
                announcementIcon.style.color = "#00E676";
            }
        }
    }, 1500);
    
    // Reset dice rotation after 6 seconds
    setTimeout(() => {
        dice.style.transform = 'rotateX(20deg) rotateY(20deg)';
        if (announcementText) {
            announcementText.textContent = "Click the portrait to toss a coin, or the dice to roll!";
            if (announcementIcon) {
                announcementIcon.className = "fas fa-bullhorn announcement-icon";
                announcementIcon.style.color = "#00E676";
            }
        }
        isRolling = false;
    }, 6000);
};

// Accordion Toggle function
window.toggleAccordion = function(header) {
    const item = header.parentElement;
    item.classList.toggle('active');
};

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

    frame.src = 'https://pub-12c622eb3e0d466d90604b9b34319099.r2.dev/content/shaukat_cv.pdf';

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

    // Initialize Theme Active States
    const savedTheme = localStorage.getItem('site-theme') || 'default';
    window.setTheme(savedTheme);
});