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

// Initialize all modules
document.addEventListener('DOMContentLoaded', () => {
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
    
    // 3D tooth model removed
    
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
