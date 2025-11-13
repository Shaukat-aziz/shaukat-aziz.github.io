// Injects the navigation bar from nav.html (in tabs folder) into the element with id="navbar"
document.addEventListener('DOMContentLoaded', function() {
    // Try multiple possible paths for nav.html
    const possiblePaths = ['nav.html', './nav.html'];
    
    function tryFetchNav(paths, index = 0) {
        if (index >= paths.length) {
            console.error('Could not load navigation from any path');
            return;
        }
        
        fetch(paths[index])
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                const navbar = document.getElementById('navbar');
                if (navbar) {
                    navbar.innerHTML = data;
                            // Ensure the contact modal markup exists on pages that load this nav
                            if (!document.getElementById('contactModal')) {
                                const modalHTML = `
        <div class="contact-modal" id="contactModal">
            <div class="contact-modal-content">
                <div class="contact-modal-header">
                    <h3>Contact Me</h3>
                    <button class="contact-close-btn" onclick="closeContactModal()">
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

                            // Ensure main script (js/script.js) is loaded on tab pages so handlers exist
                            if (!document.querySelector('script[data-main-script]')) {
                                const s = document.createElement('script');
                                s.src = '../js/script.js';
                                s.setAttribute('data-main-script', '1');
                                document.body.appendChild(s);
                            }

                            // Ensure Font Awesome is available so modal/menu icons (e.g. close icon) render
                            if (!document.querySelector('link[data-fa]')) {
                                const faHref = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
                                // Avoid duplicating if some other page already loaded FA via different path
                                const already = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(l => (l.href || '').includes('font-awesome') || (l.href || '') === faHref);
                                if (!already) {
                                    const link = document.createElement('link');
                                    link.rel = 'stylesheet';
                                    link.href = faHref;
                                    link.setAttribute('data-fa', '1');
                                    document.head.appendChild(link);
                                }
                            }

                            // Ensure favicon / tab icon exists (use relative path from tabs pages)
                            if (!document.querySelector('link[data-injected-favicon]')) {
                                const faviconHref = '../content/Logo.png';
                                const rels = [
                                    { rel: 'icon', sizes: '32x32' },
                                    { rel: 'icon', sizes: '16x16' },
                                    { rel: 'apple-touch-icon' }
                                ];
                                rels.forEach(r => {
                                    const l = document.createElement('link');
                                    l.rel = r.rel;
                                    if (r.sizes) l.sizes = r.sizes;
                                    l.href = faviconHref;
                                    l.setAttribute('data-injected-favicon', '1');
                                    document.head.appendChild(l);
                                });
                                // theme-color meta
                                if (!document.querySelector('meta[name="theme-color"][data-injected-theme]')) {
                                    const m = document.createElement('meta');
                                    m.name = 'theme-color';
                                    m.content = '#0a0a1a';
                                    m.setAttribute('data-injected-theme', '1');
                                    document.head.appendChild(m);
                                }
                            }

                            // Ensure a preloader exists on tab pages (so they show the same loading screen as home)
                            if (!document.getElementById('preloader')) {
                                const preloaderHTML = `
        <div id="preloader">
            <div class="preloader-inner">
                <img src="../content/Logo.png" alt="logo" class="preloader-logo">
            </div>
        </div>`;
                                const wrap = document.createElement('div');
                                wrap.innerHTML = preloaderHTML;
                                document.body.appendChild(wrap.firstElementChild);

                                // Safe preloader hide logic (in case main script was appended after DOMContentLoaded)
                                (function() {
                                    const preloader = document.getElementById('preloader');
                                    function hidePreloader() {
                                        if (!preloader) return;
                                        preloader.classList.add('hidden');
                                        setTimeout(() => {
                                            if (preloader && preloader.parentNode) preloader.parentNode.removeChild(preloader);
                                        }, 600);
                                    }

                                    if (document.readyState === 'complete') {
                                        // Window load already fired
                                        hidePreloader();
                                    } else {
                                        window.addEventListener('load', hidePreloader);
                                        // Fallback to hide after 4s
                                        setTimeout(hidePreloader, 4000);
                                    }
                                })();
                            }
                }
            })
            .catch(error => {
                console.error(`Failed to load nav from ${paths[index]}:`, error);
                // Try next path
                tryFetchNav(paths, index + 1);
            });
    }
    
    tryFetchNav(possiblePaths);
});
