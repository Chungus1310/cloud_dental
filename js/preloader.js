/**
 * Preloader functionality for Cloud's Dental Hospital website
 * Creates a smooth loading transition when the page first loads
 */

// Preloader HTML structure to be inserted into the body
const preloaderHTML = `
    <div class="preloader">
        <div class="preloader-content">
            <div class="tooth-loader"></div>
            <div class="preloader-text">CLOUD'S DENTAL</div>
        </div>
    </div>
`;

// Function to initialize preloader
export function initPreloader() {
    // Insert preloader HTML at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', preloaderHTML);
    
    const preloader = document.querySelector('.preloader');
    
    // Hide preloader after page loads
    window.addEventListener('load', () => {
        // Short delay to ensure animations are smooth
        setTimeout(() => {
            preloader.classList.add('fade-out');
            
            // Remove preloader from DOM after animation completes
            setTimeout(() => {
                preloader.remove();
            }, 500);
        }, 500);
    });
    
    // Fallback: hide preloader after 5 seconds even if page hasn't fully loaded
    setTimeout(() => {
        if (preloader && !preloader.classList.contains('fade-out')) {
            preloader.classList.add('fade-out');
            
            setTimeout(() => {
                preloader.remove();
            }, 500);
        }
    }, 5000);
}
