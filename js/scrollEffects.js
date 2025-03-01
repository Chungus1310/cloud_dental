/**
 * Scroll effects for Cloud's Dental Hospital website
 * Includes parallax effects and scroll-triggered animations
 */

// Function to initialize all scroll effects
export function initScrollEffects() {
    // Add decoration elements for parallax effect
    addDecorationElements();
    
    // Initialize scroll-to-top button
    initScrollToTop();
    
    // Initialize reveal animations
    initRevealAnimations();
    
    // Initialize parallax effect
    initParallax();
}

// Add floating decoration elements
function addDecorationElements() {
    const sections = document.querySelectorAll('section');
    
    sections.forEach((section, index) => {
        // Only add shapes to certain sections for visual interest
        if (index % 2 === 0) {
            const shape1 = document.createElement('div');
            shape1.className = 'shape shape-1';
            shape1.style.animationDelay = `${index * 0.2}s`;
            section.appendChild(shape1);
        } else {
            const shape2 = document.createElement('div');
            shape2.className = 'shape shape-2';
            shape2.style.animationDelay = `${index * 0.3}s`;
            section.appendChild(shape2);
        }
    });
}

// Scroll to top button functionality
function initScrollToTop() {
    // Create scroll-to-top button
    const scrollTopBtn = document.createElement('div');
    scrollTopBtn.className = 'scroll-to-top';
    scrollTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    document.body.appendChild(scrollTopBtn);
    
    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollTopBtn.classList.add('active');
        } else {
            scrollTopBtn.classList.remove('active');
        }
    });
    
    // Scroll to top when clicked
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Reveal elements as they enter viewport
function initRevealAnimations() {
    const revealElements = document.querySelectorAll('.reveal');
    
    // If there are no elements with the reveal class, add it to some key elements
    if (revealElements.length === 0) {
        const elementsToReveal = document.querySelectorAll('.service-card, .doctor-card, .about-content p, .stat, .contact-card');
        
        elementsToReveal.forEach(el => {
            el.classList.add('reveal');
            // Add initial opacity of 0
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        });
    }
    
    // Create intersection observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Observe all reveal elements
    document.querySelectorAll('.reveal').forEach(el => {
        observer.observe(el);
    });
}

// Simple parallax effect for background elements
function initParallax() {
    const parallaxSections = document.querySelectorAll('.hero, .appointment');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        parallaxSections.forEach(section => {
            const offset = section.offsetTop;
            const height = section.offsetHeight;
            
            if (scrollY >= offset - window.innerHeight && scrollY <= offset + height) {
                const yValue = (scrollY - offset) * 0.3;
                section.style.backgroundPositionY = `calc(50% + ${yValue}px)`;
            }
        });
    });
}
