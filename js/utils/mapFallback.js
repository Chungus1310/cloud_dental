/**
 * Map fallback utility for Cloud's Dental Hospital website
 * Provides a static map image if Google Maps fails to load
 */

export function initMapFallback() {
    // Get the map iframe
    const mapIframe = document.querySelector('.contact-map iframe');
    
    if (!mapIframe) return;
    
    // Create fallback container
    const fallbackContainer = document.createElement('div');
    fallbackContainer.className = 'map-fallback';
    fallbackContainer.style.display = 'none';
    fallbackContainer.style.width = '100%';
    fallbackContainer.style.height = '100%';
    fallbackContainer.style.backgroundColor = '#f2f2f2';
    fallbackContainer.style.borderRadius = '10px';
    fallbackContainer.style.textAlign = 'center';
    fallbackContainer.style.padding = '20px';
    
    // Add fallback content
    fallbackContainer.innerHTML = `
        <div style="padding: 40px 20px; background-color: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
            <i class="fas fa-map-marker-alt" style="font-size: 40px; color: var(--primary-color); margin-bottom: 15px;"></i>
            <h3 style="margin-bottom: 10px;">Map Loading Error</h3>
            <p style="margin-bottom: 20px;">We're located at Smile Cloud Dental Clinic</p>
            <a href="https://maps.google.com/?q=Smile+Cloud+Dental+Clinic" target="_blank" class="btn btn-primary">
                Open in Google Maps
            </a>
        </div>
        <img src="https://maps.googleapis.com/maps/api/staticmap?center=1.1879103620754274,104.09190417475259&zoom=15&size=600x400&maptype=roadmap&markers=color:blue%7C1.1879103620754274,104.09190417475259&key=YOUR_API_KEY" alt="Static Map" style="width: 100%; margin-top: 20px; border-radius: 10px; display: none;">
    `;
    
    // Insert fallback after the iframe
    mapIframe.parentNode.appendChild(fallbackContainer);
    
    // Check if iframe fails to load
    mapIframe.addEventListener('error', () => {
        mapIframe.style.display = 'none';
        fallbackContainer.style.display = 'block';
    });
    
    // Timeout fallback if iframe takes too long to load
    setTimeout(() => {
        if (isIframeLoaded(mapIframe) === false) {
            mapIframe.style.display = 'none';
            fallbackContainer.style.display = 'block';
        }
    }, 5000);
}

// Function to check if an iframe has loaded content
function isIframeLoaded(iframe) {
    try {
        return iframe.contentDocument !== null;
    } catch (e) {
        // Cross-origin error typically means iframe did load from external source
        return true;
    }
}
