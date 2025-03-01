export function smoothScroll() {
    // Select all links with hashes
    const links = document.querySelectorAll('a[href*="#"]:not([href="#"])');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only prevent default if the link is on the same page
            const href = this.getAttribute('href');
            const isInPageLink = href.startsWith('#') || 
                                (href.includes(window.location.pathname) && href.includes('#'));
                                
            if (!isInPageLink) return;
            
            e.preventDefault();
            
            // Get the target element
            let targetId;
            
            if (href.startsWith('#')) {
                targetId = href;
            } else {
                targetId = '#' + href.split('#')[1];
            }
            
            const targetElement = document.querySelector(targetId);
            
            if (!targetElement) return;
            
            // Close mobile menu if open
            const nav = document.querySelector('nav');
            const hamburger = document.querySelector('.hamburger');
            
            if (nav.classList.contains('active')) {
                nav.classList.remove('active');
                hamburger.innerHTML = '<i class="fas fa-bars"></i>';
            }
            
            // Calculate scroll position
            const headerOffset = 80;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            // Scroll to target
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        });
    });
}
