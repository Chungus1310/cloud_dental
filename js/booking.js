/**
 * Cloud's Dental Hospital - Dynamic Booking System
 * Handles the multi-step booking form with doctor and time slot selection
 */

// Services offered by the clinic - will be fetched from backend in production
let services = [];
let selectedDoctor = null;
let selectedService = null;
let selectedDate = null;
let selectedTime = null;

// Initialize the booking form
export function initBookingSystem() {
    const bookingForm = document.getElementById('appointment-form');
    
    if (!bookingForm) return;
    
    // Create multi-step booking form structure
    setupMultiStepForm();
    
    // Load services from the server
    loadServices();
    
    // Setup event listeners
    setupEventListeners();
}

// Setup the multi-step booking form
function setupMultiStepForm() {
    const bookingForm = document.getElementById('appointment-form');
    
    // Create the multi-step form structure
    bookingForm.innerHTML = `
        <div class="form-steps">
            <div class="form-step active" data-step="1">
                <span>1</span>
                <p>Pilih Layanan</p>
            </div>
            <div class="form-step" data-step="2">
                <span>2</span>
                <p>Pilih Dokter</p>
            </div>
            <div class="form-step" data-step="3">
                <span>3</span>
                <p>Pilih Jadwal</p>
            </div>
            <div class="form-step" data-step="4">
                <span>4</span>
                <p>Detail Pribadi</p>
            </div>
        </div>
        
        <div class="step-content active" id="step-1">
            <h3>Pilih Layanan</h3>
            <div class="services-slider-container">
                <button type="button" class="slider-nav prev-btn" id="prev-service">&lt;</button>
                <div class="services-grid" id="services-container">
                    <div class="spinner-container">
                        <div class="spinner"></div>
                    </div>
                </div>
                <button type="button" class="slider-nav next-btn" id="next-service">&gt;</button>
            </div>
        </div>
        
        <div class="step-content" id="step-2">
            <h3>Pilih Dokter</h3>
            <div class="doctors-selection" id="doctors-container">
                <!-- Will be populated dynamically -->
            </div>
            <div class="form-navigation">
                <button type="button" class="btn btn-outline previous-step">Kembali</button>
            </div>
        </div>
        
        <div class="step-content" id="step-3">
            <h3>Pilih Jadwal</h3>
            <div class="date-selection-container">
                <div class="form-group">
                    <label for="appointment-date">Tanggal</label>
                    <input type="date" id="appointment-date" class="form-control" min="${getTodayDate()}" required>
                </div>
                <div class="time-slots" id="time-slots-container">
                    <p class="select-date-prompt">Silahkan pilih tanggal terlebih dahulu</p>
                </div>
            </div>
            <div class="form-navigation">
                <button type="button" class="btn btn-outline previous-step">Kembali</button>
            </div>
        </div>
        
        <div class="step-content" id="step-4">
            <h3>Informasi Pribadi</h3>
            <div class="personal-info-form">
                <div class="form-group">
                    <label for="patient-name">Nama Lengkap</label>
                    <input type="text" id="patient-name" name="fullName" placeholder="Nama Lengkap Anda" required>
                </div>
                <div class="form-group">
                    <label for="patient-email">Email</label>
                    <input type="email" id="patient-email" name="email" placeholder="alamat@email.com" required>
                </div>
                <div class="form-group">
                    <label for="patient-phone">Nomor Telepon</label>
                    <input type="tel" id="patient-phone" name="phone" placeholder="0812XXXXXXXX" required>
                </div>
                <div class="form-group">
                    <label for="patient-notes">Catatan Tambahan (opsional)</label>
                    <textarea id="patient-notes" name="additionalInfo" placeholder="Informasi tambahan yang perlu kami ketahui" rows="3"></textarea>
                </div>
            </div>
            <div class="form-summary">
                <h4>Ringkasan Janji Temu</h4>
                <div class="summary-item">
                    <span>Layanan:</span>
                    <span id="summary-service"></span>
                </div>
                <div class="summary-item">
                    <span>Dokter:</span>
                    <span id="summary-doctor"></span>
                </div>
                <div class="summary-item">
                    <span>Jadwal:</span>
                    <span id="summary-schedule"></span>
                </div>
            </div>
            <div class="form-navigation">
                <button type="button" class="btn btn-outline previous-step">Kembali</button>
                <button type="submit" class="btn btn-primary">Kirim Permintaan</button>
            </div>
        </div>
    `;
}

// Setup event listeners for the booking form
function setupEventListeners() {
    // Previous step buttons
    document.querySelectorAll('.previous-step').forEach(button => {
        button.addEventListener('click', () => {
            const currentStep = document.querySelector('.step-content.active');
            const currentStepNumber = parseInt(currentStep.id.split('-')[1]);
            
            if (currentStepNumber > 1) {
                goToStep(currentStepNumber - 1);
            }
        });
    });
    
    // Date selection
    const dateInput = document.getElementById('appointment-date');
    if (dateInput) {
        dateInput.addEventListener('change', () => {
            selectedDate = dateInput.value;
            if (selectedDoctor && selectedDate) {
                loadTimeSlots(selectedDoctor.id, selectedDate);
            }
        });
    }
    
    // Service slider navigation
    const prevBtn = document.getElementById('prev-service');
    const nextBtn = document.getElementById('next-service');
    
    if (prevBtn && nextBtn) {
        let currentPage = 0;
        const itemsPerPage = 4;
        
        // Update buttons visibility initially
        updateSliderButtons(currentPage, services.length, itemsPerPage);

        prevBtn.addEventListener('click', () => {
            if (currentPage > 0) {
                currentPage--;
                showPage(currentPage, itemsPerPage);
            }
        });
        
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(services.length / itemsPerPage);
            if (currentPage < totalPages - 1) {
                currentPage++;
                showPage(currentPage, itemsPerPage);
            }
        });
    }
}

// Show a specific page of services
function showPage(pageNum, itemsPerPage) {
    const servicesContainer = document.getElementById('services-container');
    if (!servicesContainer) return;

    // Clear container
    servicesContainer.innerHTML = '';

    const start = pageNum * itemsPerPage;
    const end = Math.min(start + itemsPerPage, services.length);
    
    for (let i = start; i < end; i++) {
        const service = services[i];
        createServiceCard(service, servicesContainer);
    }
    
    // Update navigation buttons visibility
    updateSliderButtons(pageNum, services.length, itemsPerPage);
}

// Update slider navigation buttons visibility
function updateSliderButtons(currentPage, totalItems, itemsPerPage) {
    const prevBtn = document.getElementById('prev-service');
    const nextBtn = document.getElementById('next-service');
    
    if (!prevBtn || !nextBtn) return;
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    prevBtn.classList.toggle('hidden', currentPage === 0);
    nextBtn.classList.toggle('hidden', currentPage >= totalPages - 1 || totalPages <= 1);
}

// Create a service card element
function createServiceCard(service, container) {
    const serviceCard = document.createElement('div');
    serviceCard.className = 'service-card';
    serviceCard.dataset.serviceId = service.id;
    serviceCard.dataset.serviceName = service.name;
    
    serviceCard.innerHTML = `
        <div class="service-icon">
            <i class="${service.icon || 'fas fa-tooth'}"></i>
        </div>
        <h4>${service.name}</h4>
        <p>${service.description}</p>
    `;
    
    serviceCard.addEventListener('click', () => {
        document.querySelectorAll('.service-card').forEach(card => {
            card.classList.remove('active');
        });
        
        serviceCard.classList.add('active');
        selectedService = service;
        
        // Load doctors for this service
        loadDoctorsForService(service.id);
        
        // Go to next step after a short delay
        setTimeout(() => {
            goToStep(2);
        }, 400);
    });
    
    container.appendChild(serviceCard);
    return serviceCard;
}

// Go to a specific step
function goToStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show the target step
    document.getElementById(`step-${stepNumber}`).classList.add('active');
    
    // Update step indicator
    document.querySelectorAll('.form-step').forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        step.classList.toggle('active', stepNum === stepNumber);
        step.classList.toggle('completed', stepNum < stepNumber);
    });
    
    // If going to step 4 (summary), update the summary
    if (stepNumber === 4) {
        updateBookingSummary();
    }
}

// Load services from the server
function loadServices() {
    const servicesContainer = document.getElementById('services-container');
    if (!servicesContainer) return;
    
    // Show loading spinner
    servicesContainer.innerHTML = `
        <div class="spinner-container">
            <div class="spinner"></div>
        </div>
    `;
    
    fetch('/api/services')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            services = data;
            
            if (!Array.isArray(services) || services.length === 0) {
                servicesContainer.innerHTML = '<p class="no-data-message">No services available.</p>';
                return;
            }
            
            // Setup service slider pagination
            const itemsPerPage = 4;
            showPage(0, itemsPerPage);
        })
        .catch(error => {
            console.error('Error loading services:', error);
            servicesContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load services. Please try again.</p>
                    <button onclick="location.reload()" class="btn btn-primary">Retry</button>
                </div>
            `;
        });
}

// Load doctors that provide the selected service
function loadDoctorsForService(serviceId) {
    const doctorsContainer = document.getElementById('doctors-container');
    if (!doctorsContainer) return;
    
    // Show loading spinner
    doctorsContainer.innerHTML = `
        <div class="spinner-container">
            <div class="spinner"></div>
        </div>
    `;
    
    // First try to get doctors by service, then fall back to all doctors if that fails
    fetch(`/api/doctors/by-service/${serviceId}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(doctors => {
            // If no doctors are returned for this specific service, get all doctors
            if (!Array.isArray(doctors) || doctors.length === 0) {
                return fetch('/api/doctors')
                    .then(response => {
                        if (!response.ok) throw new Error('Network response was not ok');
                        return response.json();
                    });
            }
            return doctors;
        })
        .then(doctors => {
            // Clear loading spinner
            doctorsContainer.innerHTML = '';
            
            if (!Array.isArray(doctors) || doctors.length === 0) {
                doctorsContainer.innerHTML = '<p class="no-data-message">No doctors available for this service.</p>';
                return;
            }
            
            // Create doctor cards
            doctors.forEach(doctor => {
                const doctorCard = document.createElement('div');
                doctorCard.className = 'doctor-selection-card';
                doctorCard.dataset.doctorId = doctor.id;
                
                doctorCard.innerHTML = `
                    <div class="doctor-selection-image">
                        <img src="${doctor.image || '/images/default-doctor.jpg'}" 
                             alt="${doctor.name}" 
                             onerror="this.src='/images/default-doctor.jpg'"
                             loading="lazy">
                    </div>
                    <div class="doctor-selection-info">
                        <h4>${doctor.name}</h4>
                        <p>${doctor.specialty}</p>
                    </div>
                `;
                
                doctorCard.addEventListener('click', () => {
                    // Remove active class from all doctor cards
                    document.querySelectorAll('.doctor-selection-card').forEach(card => {
                        card.classList.remove('active');
                    });
                    
                    // Add active class to the selected card
                    doctorCard.classList.add('active');
                    
                    // Store selected doctor
                    selectedDoctor = doctor;
                    
                    // Reset date and time selection
                    selectedDate = null;
                    selectedTime = null;
                    
                    // Clear previous time slots
                    document.getElementById('time-slots-container').innerHTML = 
                        '<p class="select-date-prompt">Silahkan pilih tanggal terlebih dahulu</p>';
                    
                    // Reset date input
                    const dateInput = document.getElementById('appointment-date');
                    if (dateInput) {
                        dateInput.value = '';
                    }
                    
                    // Move to the next step after a short delay
                    setTimeout(() => {
                        goToStep(3);
                    }, 400);
                });
                
                doctorsContainer.appendChild(doctorCard);
            });
        })
        .catch(error => {
            console.error('Error loading doctors:', error);
            doctorsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load doctors. Please try again.</p>
                    <button onclick="loadDoctorsForService(${serviceId})" class="btn btn-primary">Retry</button>
                </div>
            `;
        });
}

// Load available time slots for the selected doctor and date
function loadTimeSlots(doctorId, date) {
    const timeSlotsContainer = document.getElementById('time-slots-container');
    if (!timeSlotsContainer) return;
    
    // Show loading spinner
    timeSlotsContainer.innerHTML = `
        <div class="spinner-container">
            <div class="spinner"></div>
        </div>
    `;
    
    fetch(`/api/doctors/${doctorId}/slots?date=${date}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(slots => {
            // Clear loading spinner
            timeSlotsContainer.innerHTML = '';
            
            if (!Array.isArray(slots) || slots.length === 0) {
                timeSlotsContainer.innerHTML = '<p class="no-slots-message">No time slots available for this date.</p>';
                return;
            }
            
            // Create time slot buttons
            const timeSlotGrid = document.createElement('div');
            timeSlotGrid.className = 'time-slot-grid';
            
            slots.forEach(slot => {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                
                if (!slot.available) {
                    timeSlot.classList.add('unavailable');
                }
                
                // Convert 24h time to 12h time for display
                const hour = parseInt(slot.time.split(':')[0]);
                const minute = slot.time.split(':')[1];
                const period = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 || 12;
                const displayTime = `${hour12}:${minute} ${period}`;
                
                timeSlot.innerHTML = `
                    <span>${displayTime}</span>
                    <small>${slot.available ? 'Available' : 'Booked'}</small>
                `;
                
                if (slot.available) {
                    timeSlot.addEventListener('click', () => {
                        // Remove active class from all time slots
                        document.querySelectorAll('.time-slot').forEach(ts => {
                            ts.classList.remove('active');
                        });
                        
                        // Add active class to the selected slot
                        timeSlot.classList.add('active');
                        
                        // Store selected time
                        selectedTime = slot.time;
                        
                        // Move to the next step after a short delay
                        setTimeout(() => {
                            goToStep(4);
                        }, 400);
                    });
                }
                
                timeSlotGrid.appendChild(timeSlot);
            });
            
            timeSlotsContainer.appendChild(timeSlotGrid);
        })
        .catch(error => {
            console.error('Error loading time slots:', error);
            timeSlotsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load time slots. Please try again.</p>
                    <button onclick="loadTimeSlots(${doctorId}, '${date}')" class="btn btn-primary">Retry</button>
                </div>
            `;
        });
}

// Update booking summary in step 4
function updateBookingSummary() {
    if (selectedService) {
        document.getElementById('summary-service').textContent = selectedService.name;
    }
    
    if (selectedDoctor) {
        document.getElementById('summary-doctor').textContent = selectedDoctor.name;
    }
    
    if (selectedDate && selectedTime) {
        // Format the date for display
        const bookingDate = new Date(selectedDate + 'T' + selectedTime);
        const formattedDate = bookingDate.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
        
        document.getElementById('summary-schedule').textContent = formattedDate;
        
        // Add hidden fields for form submission
        appendHiddenField('service', selectedService.name);
        appendHiddenField('doctor_id', selectedDoctor.id);
        appendHiddenField('booking_date', selectedDate);
        appendHiddenField('booking_time', selectedTime);
    }
}

// Append a hidden field to the form
function appendHiddenField(name, value) {
    const form = document.getElementById('appointment-form');
    let hiddenField = form.querySelector(`input[name="${name}"]`);
    
    if (!hiddenField) {
        hiddenField = document.createElement('input');
        hiddenField.type = 'hidden';
        hiddenField.name = name;
        form.appendChild(hiddenField);
    }
    
    hiddenField.value = value;
}

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}