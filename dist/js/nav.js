// Injects the navigation bar from nav.html (in root folder) into the element with id="navbar"
document.addEventListener('DOMContentLoaded', function() {
    // Try multiple possible paths for nav.html
    const possiblePaths = ['nav.html', './nav.html'];
    
    function tryFetchNav(paths, index = 0) {
        if (index >= paths.length) {
            console.error('Could not load navigation from any path, using fallback');
            // Fallback navigation is already visible, so do nothing
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
                    // Hide fallback navigation and replace with fetched nav
                    const fallbackNav = document.getElementById('fallback-nav');
                    if (fallbackNav) {
                        fallbackNav.style.display = 'none';
                    }
                    navbar.innerHTML = data;
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
