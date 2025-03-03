// Doctors page functionality
document.addEventListener('DOMContentLoaded', () => {
    loadDoctors();
    setupFilters();
});

let allDoctors = [];

async function loadDoctors() {
    const doctorsGrid = document.getElementById('doctors-grid');
    
    try {
        const response = await fetch('/api/doctors');
        if (!response.ok) throw new Error('Failed to fetch doctors');
        
        allDoctors = await response.json();
        renderDoctors(allDoctors);
    } catch (error) {
        console.error('Error:', error);
        doctorsGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load doctors. Please try again.</p>
                <button onclick="loadDoctors()" class="btn btn-primary">Retry</button>
            </div>
        `;
    }
}

function renderDoctors(doctors) {
    const doctorsGrid = document.getElementById('doctors-grid');
    
    if (!doctors.length) {
        doctorsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-user-md"></i>
                <p>No doctors found matching your criteria.</p>
            </div>
        `;
        return;
    }
    
    doctorsGrid.innerHTML = doctors.map(doctor => `
        <div class="doctor-card" data-aos="fade-up">
            <div class="doctor-image">
                <img src="${doctor.image || '../images/default-doctor.jpg'}" 
                     alt="${doctor.name}"
                     onerror="this.src='../images/default-doctor.jpg'">
            </div>
            <div class="doctor-info">
                <div class="doctor-name">
                    <h3>${doctor.name}</h3>
                </div>
                <div class="doctor-specialty">
                    <p>${doctor.specialty}</p>
                </div>
                <div class="doctor-bio">
                    <p>${doctor.bio || 'Experienced dental professional dedicated to providing excellent care.'}</p>
                </div>
                <div class="doctor-availability">
                    <p><i class="far fa-clock"></i> Available: Mon-Fri</p>
                </div>
                <div class="doctor-social">
                    ${doctor.social_linkedin ? `<a href="${doctor.social_linkedin}" target="_blank"><i class="fab fa-linkedin"></i></a>` : ''}
                    ${doctor.social_twitter ? `<a href="${doctor.social_twitter}" target="_blank"><i class="fab fa-twitter"></i></a>` : ''}
                </div>
                <a href="../index.html#appointment" class="btn btn-primary">Book Appointment</a>
            </div>
        </div>
    `).join('');
}

function setupFilters() {
    const specialtyFilter = document.getElementById('specialty-filter');
    const searchInput = document.getElementById('doctor-search');
    
    specialtyFilter.addEventListener('change', filterDoctors);
    searchInput.addEventListener('input', filterDoctors);
}

function filterDoctors() {
    const specialtyFilter = document.getElementById('specialty-filter');
    const searchInput = document.getElementById('doctor-search');
    
    const selectedSpecialty = specialtyFilter.value.toLowerCase();
    const searchTerm = searchInput.value.toLowerCase();
    
    const filteredDoctors = allDoctors.filter(doctor => {
        const matchesSpecialty = !selectedSpecialty || doctor.specialty.toLowerCase().includes(selectedSpecialty);
        const matchesSearch = !searchTerm || 
            doctor.name.toLowerCase().includes(searchTerm) || 
            doctor.specialty.toLowerCase().includes(searchTerm);
        
        return matchesSpecialty && matchesSearch;
    });
    
    renderDoctors(filteredDoctors);
}