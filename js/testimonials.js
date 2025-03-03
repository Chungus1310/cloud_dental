// Testimonial data
const testimonials = [
    {
        id: 1,
        content: "Saya tidak bisa mengungkapkan betapa bersyukurnya saya atas perawatan yang saya terima di Cloud's Dental Hospital. Para dokter gigi dan staf tidak hanya profesional tetapi juga penuh kasih sepanjang perawatan saya.",
        name: "Anisa Wijaya",
        title: "Pasien",
        image: "images/testimonial-1.jpg"
    },
    {
        id: 2,
        content: "Pengalaman saya di Cloud's Dental Hospital luar biasa. Fasilitas sangat modern, dan tim medis memberikan informasi yang jelas tentang kondisi dan pilihan perawatan gigi saya.",
        name: "Budi Santoso",
        title: "Pasien",
        image: "images/testimonial-2.jpg"
    },
    {
        id: 3,
        content: "Sebagai seseorang yang cemas tentang kunjungan ke dokter gigi, saya sangat senang dengan suasana yang nyaman di Cloud's Dental Hospital. Staf sangat membantu dan memastikan kenyamanan saya selama perawatan.",
        name: "Dewi Rahman",
        title: "Pasien",
        image: "images/testimonial-3.jpg"
    }
];

// Function to initialize testimonials slider
export async function initTestimonials() {
    const testimonialContainer = document.querySelector('.testimonial-slider');
    
    if (!testimonialContainer) return;
    
    // Clear any existing content
    testimonialContainer.innerHTML = '<div class="loading-spinner">Loading...</div>';
    
    try {
        // Fetch testimonials from the API
        const response = await fetch('/api/testimonials');
        const testimonials = await response.json();
        
        if (testimonials.length === 0) {
            testimonialContainer.innerHTML = '<p class="no-data-message">No testimonials available.</p>';
            return;
        }
        
        // Clear the loading spinner
        testimonialContainer.innerHTML = '';
        
        // Create testimonial slides
        testimonials.forEach(testimonial => {
            const testimonialSlide = createTestimonialSlide(testimonial);
            testimonialContainer.appendChild(testimonialSlide);
        });
        
        // Initialize slider functionality
        let currentSlide = 0;
        const slides = document.querySelectorAll('.testimonial-slide');
        const totalSlides = slides.length;
        
        // Create navigation dots
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'testimonial-dots';
        
        testimonials.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.className = index === 0 ? 'dot active' : 'dot';
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        });
        
        testimonialContainer.appendChild(dotsContainer);
        
        // Auto-slide functionality
        let slideInterval = setInterval(nextSlide, 5000);
        
        testimonialContainer.addEventListener('mouseenter', () => {
            clearInterval(slideInterval);
        });
        
        testimonialContainer.addEventListener('mouseleave', () => {
            slideInterval = setInterval(nextSlide, 5000);
        });
        
        // Show first slide
        updateSlides();
        
        function nextSlide() {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateSlides();
        }
        
        function goToSlide(index) {
            currentSlide = index;
            updateSlides();
        }
        
        function updateSlides() {
            // First remove active class from all slides
            slides.forEach(slide => {
                slide.classList.remove('active');
            });
            
            // Add active class to current slide
            slides[currentSlide].classList.add('active');
            
            // Update dots
            const dots = dotsContainer.querySelectorAll('.dot');
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentSlide);
            });
        }
    } catch (error) {
        console.error('Error loading testimonials:', error);
        testimonialContainer.innerHTML = '<p class="error-message">Failed to load testimonials. Please try again later.</p>';
    }
}

// Helper function to create a testimonial slide
function createTestimonialSlide(testimonial) {
    const slide = document.createElement('div');
    slide.className = 'testimonial-slide';
    
    slide.innerHTML = `
        <div class="testimonial-content">
            <p>${testimonial.content}</p>
            <div class="testimonial-author">
                <img src="${testimonial.image}" alt="${testimonial.name}" loading="lazy">
                <div class="testimonial-author-info">
                    <h4>${testimonial.name}</h4>
                    <p>${testimonial.title}</p>
                </div>
            </div>
        </div>
    `;
    
    return slide;
}
