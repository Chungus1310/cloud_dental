// Services page functionality
document.addEventListener('DOMContentLoaded', () => {
    loadServices();
    setupCategoryFilters();
});

let allServices = [];

async function loadServices() {
    const servicesGrid = document.getElementById('services-grid');
    
    try {
        const response = await fetch('/api/services');
        if (!response.ok) throw new Error('Failed to fetch services');
        
        allServices = await response.json();
        renderServices(allServices);
    } catch (error) {
        console.error('Error:', error);
        servicesGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load services. Please try again.</p>
                <button onclick="loadServices()" class="btn btn-primary">Retry</button>
            </div>
        `;
    }
}

function renderServices(services) {
    const servicesGrid = document.getElementById('services-grid');
    
    if (!services.length) {
        servicesGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-tooth"></i>
                <p>No services found in this category.</p>
            </div>
        `;
        return;
    }
    
    servicesGrid.innerHTML = services.map(service => `
        <div class="service-detail-card" data-aos="fade-up" data-category="${service.category || 'all'}">
            <div class="service-icon">
                <i class="${service.icon || 'fas fa-tooth'}"></i>
            </div>
            <div class="service-content">
                <h3>${service.name}</h3>
                <p>${service.description}</p>
                <div class="service-features">
                    <div class="feature">
                        <i class="fas fa-clock"></i>
                        <span>Duration: ${service.duration || '30-60'} mins</span>
                    </div>
                    <div class="feature">
                        <i class="fas fa-user-md"></i>
                        <span>${service.specialist || 'Specialist Consultation'}</span>
                    </div>
                </div>
                <div class="service-actions">
                    <a href="../index.html#appointment" class="btn btn-primary">Book Now</a>
                    <button class="btn btn-outline learn-more" onclick="showServiceDetails('${service.id}')">
                        Learn More
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function setupCategoryFilters() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Filter services
            const category = button.dataset.category;
            filterServicesByCategory(category);
        });
    });
}

function filterServicesByCategory(category) {
    const filteredServices = category === 'all' 
        ? allServices 
        : allServices.filter(service => service.category === category);
    
    renderServices(filteredServices);
}

function showServiceDetails(serviceId) {
    const service = allServices.find(s => s.id === serviceId);
    if (!service) return;
    
    // Create and show modal with service details
    const modal = document.createElement('div');
    modal.className = 'service-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>${service.name}</h2>
            <div class="service-detail-content">
                <div class="service-icon">
                    <i class="${service.icon || 'fas fa-tooth'}"></i>
                </div>
                <p class="service-description">${service.description}</p>
                <div class="service-benefits">
                    <h3>Benefits</h3>
                    <ul>
                        ${(service.benefits || [
                            'Improved oral health',
                            'Professional care',
                            'Modern techniques',
                            'Comfortable experience'
                        ]).map(benefit => `<li>${benefit}</li>`).join('')}
                    </ul>
                </div>
                <div class="service-process">
                    <h3>Process</h3>
                    <p>${service.process || 'Our experienced dentists will evaluate your condition and provide personalized treatment using the latest dental technology.'}</p>
                </div>
                <a href="../index.html#appointment" class="btn btn-primary">Schedule Appointment</a>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}