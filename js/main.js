import { initTestimonials } from './testimonials.js';
import { smoothScroll } from './utils/scroll.js';
import { initAppointmentForm } from './forms.js';
import { lazyLoadImages } from './utils/lazyLoad.js';
import { initPreloader } from './preloader.js';
import { initScrollEffects } from './scrollEffects.js';
import { initMapFallback } from './utils/mapFallback.js';

// Initialize preloader (must be first)
initPreloader();

// Initialize AOS (Animate On Scroll)
AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true,
    mirror: false
});

// Header scroll effect
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Mobile menu toggle
const hamburger = document.querySelector('.hamburger');
const nav = document.querySelector('nav');

hamburger.addEventListener('click', () => {
    nav.classList.toggle('active');
    hamburger.innerHTML = nav.classList.contains('active') 
        ? '<i class="fas fa-times"></i>' 
        : '<i class="fas fa-bars"></i>';
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (nav.classList.contains('active') && 
        !e.target.closest('nav') && 
        !e.target.closest('.hamburger')) {
        nav.classList.remove('active');
        hamburger.innerHTML = '<i class="fas fa-bars"></i>';
    }
});

// Function to load doctors dynamically
async function loadDoctors() {
    const doctorsContainer = document.querySelector('.doctors-grid');
    if (!doctorsContainer) return;
    
    try {
        const response = await fetch('/api/doctors');
        const doctors = await response.json();
        
        // Clear loading placeholder if any
        doctorsContainer.innerHTML = '';
        
        doctors.forEach(doctor => {
            const doctorCard = document.createElement('div');
            doctorCard.className = 'doctor-card';
            doctorCard.setAttribute('data-aos', 'fade-up');
            doctorCard.setAttribute('data-aos-delay', '100');
            
            const socialLinks = [];
            if (doctor.social_linkedin) {
                socialLinks.push(`<a href="${doctor.social_linkedin}" target="_blank" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>`);
            }
            if (doctor.social_twitter) {
                socialLinks.push(`<a href="${doctor.social_twitter}" target="_blank" aria-label="Twitter"><i class="fab fa-twitter"></i></a>`);
            }
            
            doctorCard.innerHTML = `
                <div class="doctor-image">
                    <img src="${doctor.image}" alt="${doctor.name}" loading="lazy">
                </div>
                <div class="doctor-info">
                    <div class="doctor-name">
                        <h3>${doctor.name}</h3>
                    </div>
                    <div class="doctor-specialty">
                        <p>${doctor.specialty}</p>
                    </div>
                    <div class="doctor-social">
                        ${socialLinks.join('')}
                        <a href="mailto:${doctor.email}" aria-label="Email"><i class="fas fa-envelope"></i></a>
                    </div>
                </div>
            `;
            
            doctorsContainer.appendChild(doctorCard);
        });
        
        // Re-initialize lazy loading for the new images
        lazyLoadImages();
        
    } catch (error) {
        console.error('Error loading doctors:', error);
        doctorsContainer.innerHTML = `
            <div class="error-message">
                <p>Terjadi kesalahan saat memuat data dokter. Silakan coba lagi nanti.</p>
            </div>
        `;
    }
}

// Initialize all modules
document.addEventListener('DOMContentLoaded', () => {
    // Load doctors dynamically
    loadDoctors();
    
    // Initialize testimonials slider
    initTestimonials();
    
    // Initialize smooth scrolling for anchor links
    smoothScroll();
    
    // Initialize appointment form validation and submission
    initAppointmentForm();
    
    // Initialize lazy loading for images
    lazyLoadImages();
    
    // Initialize scroll effects
    initScrollEffects();
    
    // Initialize map fallback
    initMapFallback();
    
    // Newsletter form submission
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = e.target.querySelector('input[type="email"]').value;
            
            // Simulate form submission
            alert(`Terima kasih! Email ${email} telah ditambahkan ke daftar newsletter kami.`);
            e.target.reset();
        });
    }
    
    // Add special effect to service icons
    const serviceIcons = document.querySelectorAll('.service-icon');
    serviceIcons.forEach(icon => {
        icon.classList.add('pulse-element');
        
        // Add tooth icon animation
        if (icon.querySelector('.fa-tooth')) {
            icon.querySelector('.fa-tooth').classList.add('tooth-icon');
        }
    });
    
    // Add shine effect to buttons
    const primaryButtons = document.querySelectorAll('.btn-primary');
    primaryButtons.forEach(btn => {
        btn.classList.add('shine-effect');
    });
});

// Current year for copyright
const yearSpan = document.querySelector('.current-year');
if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
}
