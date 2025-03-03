/**
 * Cloud's Dental Hospital - Admin Dashboard JavaScript
 */

// Admin Panel Main JavaScript
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Check authentication status
    checkAuth();
    
    // Setup event listeners
    setupEventListeners();
    setupSidebarToggle();
    
    // Initialize event listeners for all page buttons
    initializeEventListeners();
    
    // Add modal templates to body if they don't exist
    if (!document.getElementById('booking-details-modal')) {
        addModalTemplates();
    }

    // Setup login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await login();
        });
    }
}

// Update event listeners for navigation
function setupEventListeners() {
    // Setup navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            if (page) {
                navigateTo(page);
            }
        });
    });

    // Logout button
    document.getElementById('logout-button')?.addEventListener('click', logout);

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Close mobile menu when clicking nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            if (window.innerWidth <= 991 && sidebar) {
                sidebar.classList.remove('active');
            }
        });
    });
    
    // Close buttons for all modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.closest('.modal').id;
            closeModal(modalId);
        });
    });
    
    document.querySelectorAll('[id^="cancel-"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.closest('.modal').id;
            closeModal(modalId);
        });
    });
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    let errorDiv = document.getElementById('login-error');
    
    if (!errorDiv) {
        const loginForm = document.getElementById('login-form');
        errorDiv = document.createElement('div');
        errorDiv.id = 'login-error';
        errorDiv.className = 'alert alert-danger';
        if (loginForm && loginForm.parentNode) {
            loginForm.parentNode.insertBefore(errorDiv, loginForm);
        }
    }
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Store the token and show dashboard
        localStorage.setItem('adminToken', data.token);
        showDashboard();
        await loadDashboardData();
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    }
}

async function logout() {
    try {
        if (window.dashboardRefreshInterval) {
            clearInterval(window.dashboardRefreshInterval);
        }
        await fetch('/api/auth/logout', { method: 'POST' });
        localStorage.removeItem('adminToken');
        showLoginPage();
    } catch (error) {
        showErrorMessage('Failed to log out');
    }
}

async function checkAuth() {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
        showLoginPage();
        return;
    }

    try {
        const response = await fetch('/api/auth/check', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.isAuthenticated) {
            showDashboard();
            await loadDashboardData();
        } else {
            showLoginPage();
        }
    } catch (error) {
        showLoginPage();
    }
}

function showLoginPage() {
    hideAllPages();
    document.getElementById('login-page').classList.remove('hidden');
    document.querySelector('.sidebar')?.classList.add('hidden');
    document.querySelector('.admin-header')?.classList.add('hidden');
}

function showDashboard() {
    hideAllPages();
    document.getElementById('dashboard-page').classList.remove('hidden');
    document.querySelector('.sidebar')?.classList.remove('hidden');
    document.querySelector('.admin-header')?.classList.remove('hidden');
    document.querySelector('[data-page="dashboard"]')?.classList.add('active');
    setupDashboardAutoRefresh();
}

function hideAllPages() {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
}

async function loadDashboardData() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        showLoginPage();
        return;
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        // Load statistics
        const statsResponse = await fetch('/api/admin/stats', { headers });
        const stats = await handleResponse(statsResponse);
        
        // Validate and update statistics
        const validStats = {
            totalBookings: Number(stats.totalBookings) || 0,
            totalDoctors: Number(stats.totalDoctors) || 0,
            pendingBookings: Number(stats.pendingBookings) || 0,
            totalTestimonials: Number(stats.totalTestimonials) || 0
        };
        
        // Update statistics display
        updateDashboardStats(validStats);

        // Load recent bookings
        const bookingsResponse = await fetch('/api/admin/recent-bookings', { headers });
        const bookingsData = await handleResponse(bookingsResponse);
        
        // Update recent bookings table
        if (bookingsData && Array.isArray(bookingsData.bookings)) {
            updateRecentBookings(bookingsData.bookings);
        } else {
            updateRecentBookings([]);
        }

    } catch (error) {
        showErrorMessage('Failed to load dashboard data. Please try refreshing the page.');
    }
}

// Helper function to handle API responses
async function handleResponse(response) {
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (!data) throw new Error('No data received from server');
    return data;
}

// Helper functions for data validation and error handling
function validateData(data, requiredFields) {
    if (!data) return false;
    return requiredFields.every(field => data[field] != null);
}

function validateBookingData(booking) {
    return validateData(booking, ['id', 'patientName', 'date', 'time', 'status']);
}

function validateDoctorData(doctor) {
    return validateData(doctor, ['id', 'name', 'specialty']);
}

function validateServiceData(service) {
    return validateData(service, ['id', 'name', 'description']);
}

// Update dashboard stats with validation
function updateDashboardStats(stats) {
    if (!stats || typeof stats !== 'object') {
        return;
    }
    
    try {
        document.getElementById('total-bookings').textContent = stats.totalBookings;
        document.getElementById('total-doctors').textContent = stats.totalDoctors;
        document.getElementById('pending-bookings').textContent = stats.pendingBookings;
        document.getElementById('total-testimonials').textContent = stats.totalTestimonials;
    } catch (error) {
        showErrorMessage('Error updating dashboard stats');
    }
}

// Update recent bookings table
function updateRecentBookings(bookings) {
    const tbody = document.getElementById('recent-bookings-table');
    if (!tbody) {
        return;
    }
    
    tbody.innerHTML = '';

    if (!Array.isArray(bookings) || bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No recent bookings found</td></tr>';
        return;
    }

    bookings.forEach(booking => {
        if (!booking) return;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(booking.patient_name || booking.patientName || 'N/A')}</td>
            <td>${escapeHtml(booking.doctor_name || booking.doctorName || 'N/A')}</td>
            <td>${formatDateTime(booking.booking_date || booking.date, booking.booking_time || booking.time)}</td>
            <td><span class="status-badge ${booking.status || 'pending'}">${capitalizeFirst(booking.status || 'pending')}</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon view-booking" data-id="${booking.id}" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon edit-status" data-id="${booking.id}" title="Update Status">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    setupBookingActionListeners();
}

// Show error message to user
function showErrorMessage(message, isError = true) {
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alert = document.createElement('div');
    alert.className = `alert ${isError ? 'alert-danger' : 'alert-success'}`;
    alert.textContent = message;

    const container = document.querySelector('.stat-cards');
    container.insertAdjacentElement('beforebegin', alert);

    // Auto-remove after 5 seconds
    setTimeout(() => alert.remove(), 5000);
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function setupBookingActionListeners() {
    // View booking details
    document.querySelectorAll('.view-booking').forEach(button => {
        button.addEventListener('click', () => viewBookingDetails(button.dataset.id));
    });

    // Edit booking status
    document.querySelectorAll('.edit-status').forEach(button => {
        button.addEventListener('click', () => editBookingStatus(button.dataset.id));
    });
}

async function viewBookingDetails(bookingId) {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
        const response = await fetch(`/api/admin/bookings/${bookingId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const booking = await handleResponse(response);
        
        // Update the booking details modal with content
        showBookingDetailsModal(booking);
    } catch (error) {
        showErrorMessage('Failed to load booking details');
    }
}

// Fix editBookingStatus to avoid infinite recursion
async function editBookingStatus(bookingId) {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        showLoginPage();
        return;
    }

    const modal = document.getElementById('booking-status-modal');
    if (!modal) {
        showErrorMessage('Status modal not found');
        return;
    }

    document.getElementById('booking-id').value = bookingId;
    openModal('booking-status-modal');

    const saveButton = document.getElementById('save-booking-status');
    if (saveButton) {
        const newSaveHandler = async () => {
            const status = document.getElementById('booking-status').value;
            if (!status) {
                showErrorMessage('Please select a status');
                return;
            }

            try {
                const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status })
                });
                
                await handleResponse(response);
                closeModal('booking-status-modal');
                await loadDashboardData();
                showErrorMessage('Booking status updated successfully', false);
                
                // Clean up event listener
                saveButton.removeEventListener('click', newSaveHandler);
            } catch (error) {
                showErrorMessage('Failed to update booking status: ' + error.message);
            }
        };

        // Clear previous handlers and add new one
        saveButton.onclick = null;
        saveButton.addEventListener('click', newSaveHandler);
    }
}

// Show booking details modal with all necessary info
function showBookingDetailsModal(booking) {
    if (!booking) {
        showErrorMessage('No booking details available');
        return;
    }

    const contentContainer = document.getElementById('booking-details-content');
    if (!contentContainer) {
        const modalBody = document.querySelector('#booking-details-modal .modal-body');
        if (modalBody) {
            const div = document.createElement('div');
            div.id = 'booking-details-content';
            modalBody.appendChild(div);
        } else {
            showErrorMessage('Modal body not found');
            return;
        }
    }

    // Format booking details HTML
    const bookingDetails = `
        <div class="booking-detail">
            <h4>Patient Information</h4>
            <p><strong>Name:</strong> ${escapeHtml(booking.patientName)}</p>
            <p><strong>Email:</strong> ${escapeHtml(booking.email || '')}</p>
            <p><strong>Phone:</strong> ${escapeHtml(booking.phone || '')}</p>
        </div>
        
        <div class="booking-detail">
            <h4>Appointment Details</h4>
            <p><strong>Service:</strong> ${escapeHtml(booking.service || '')}</p>
            <p><strong>Doctor:</strong> ${escapeHtml(booking.doctorName || 'N/A')}</p>
            <p><strong>Date & Time:</strong> ${formatDateTime(booking.date, booking.time)}</p>
            <p><strong>Status:</strong> <span class="status-badge ${booking.status || 'pending'}">${capitalizeFirst(booking.status || 'pending')}</span></p>
        </div>
        
        <div class="booking-detail">
            <h4>Additional Information</h4>
            <p>${booking.notes ? escapeHtml(booking.notes) : 'No additional notes provided.'}</p>
        </div>
        
        <div class="booking-actions">
            <button class="btn btn-primary update-status-btn" data-id="${booking.id}">Update Status</button>
        </div>
    `;

    // Update the content and add event listeners
    document.getElementById('booking-details-content').innerHTML = bookingDetails;
    
    // Add event listener for the update status button
    const updateStatusBtn = document.getElementById('booking-details-content').querySelector('.update-status-btn');
    if (updateStatusBtn) {
        updateStatusBtn.addEventListener('click', () => {
            closeModal('booking-details-modal');
            editBookingStatus(booking.id);
        });
    }
    
    // Open the modal
    openModal('booking-details-modal');
}

function formatDateTime(date, time) {
    if (!date || !time) return 'N/A';
    try {
        const dateObj = new Date(`${date}T${time}`);
        return new Intl.DateTimeFormat('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(dateObj);
    } catch (error) {
        return `${date} ${time}`;
    }
}

function capitalizeFirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Update navigateTo function for proper navigation
async function navigateTo(page) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
    
    // Clear dashboard refresh interval when navigating away
    if (window.dashboardRefreshInterval) {
        clearInterval(window.dashboardRefreshInterval);
    }

    // Clean up and hide all pages
    cleanup();
    hideAllPages();
    
    // Update page title
    document.getElementById('page-title').textContent = capitalizeFirst(page);
    
    // Show the selected page
    const pageElement = document.getElementById(`${page}-page`);
    if (pageElement) {
        pageElement.classList.remove('hidden');
    }
    
    // Load data for the page
    await loadPageData(page);
    
    // Set up auto-refresh if on dashboard
    if (page === 'dashboard') {
        setupDashboardAutoRefresh();
    }
}

async function loadPageData(page) {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    try {
        console.log(`Loading data for ${page} page`);
        switch (page) {
            case 'dashboard':
                await loadDashboardData();
                break;
            case 'doctors':
                const doctorsResponse = await fetch('/api/admin/doctors', { headers });
                const doctorsData = await handleResponse(doctorsResponse);
                
                if (Array.isArray(doctorsData.doctors)) {
                    updateDoctorsTable(doctorsData.doctors);
                } else {
                    updateDoctorsTable([]);
                }
                break;
            case 'bookings':
                const bookingsResponse = await fetch('/api/admin/bookings', { headers });
                const bookingsData = await handleResponse(bookingsResponse);
                
                if (Array.isArray(bookingsData.bookings)) {
                    updateBookingsTable(bookingsData.bookings);
                } else {
                    updateBookingsTable([]);
                }
                setupBookingFilters();
                break;
            case 'services':
                const servicesResponse = await fetch('/api/admin/services', { headers });
                const servicesData = await handleResponse(servicesResponse);
                
                if (Array.isArray(servicesData.services)) {
                    updateServicesGrid(servicesData.services);
                } else {
                    updateServicesGrid([]);
                }
                break;
            case 'testimonials':
                const pendingResponse = await fetch('/api/admin/testimonials?approved=false', { headers });
                const approvedResponse = await fetch('/api/admin/testimonials?approved=true', { headers });
                
                const pendingData = await handleResponse(pendingResponse);
                const approvedData = await handleResponse(approvedResponse);
                
                updateTestimonials(
                    Array.isArray(pendingData.testimonials) ? pendingData.testimonials : [], 
                    Array.isArray(approvedData.testimonials) ? approvedData.testimonials : []
                );
                break;
            case 'settings':
                // Get current admin info to populate username
                const adminResponse = await fetch('/api/auth/check', { headers });
                const adminData = await handleResponse(adminResponse);
                if (adminData.admin?.username) {
                    const usernameField = document.getElementById('settings-username');
                    if (usernameField) usernameField.value = adminData.admin.username;
                }
                setupSettingsForm();
                break;
            default:
                console.warn(`Unknown page: ${page}`);
        }
    } catch (error) {
        console.error(`Error loading ${page} data:`, error);
        showErrorMessage(`Failed to load ${page} data. Please try refreshing the page.`);
    }
}

// Doctors page functions
function updateDoctorsTable(doctors) {
    const tbody = document.getElementById('doctors-table');
    tbody.innerHTML = '';

    if (!Array.isArray(doctors) || doctors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No doctors found</td></tr>';
        return;
    }

    doctors.forEach(doctor => {
        if (!validateDoctorData(doctor)) return;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(doctor.name)}</td>
            <td>${escapeHtml(doctor.specialty)}</td>
            <td><span class="status-badge active">Active</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon edit-doctor" data-id="${doctor.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete-doctor" data-id="${doctor.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    setupDoctorActionListeners();
}

// Bookings page functions
function updateBookingsTable(bookings) {
    const tbody = document.getElementById('bookings-table');
    tbody.innerHTML = '';

    if (!Array.isArray(bookings) || bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No bookings found</td></tr>';
        return;
    }

    bookings.forEach(booking => {
        if (!validateBookingData(booking)) return;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(booking.patientName)}</td>
            <td>${escapeHtml(booking.doctorName || 'N/A')}</td>
            <td>${escapeHtml(booking.service || 'N/A')}</td>
            <td>${formatDateTime(booking.date, booking.time)}</td>
            <td><span class="status-badge ${booking.status}">${capitalizeFirst(booking.status || 'pending')}</span></td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon view-booking" data-id="${booking.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon edit-status" data-id="${booking.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    setupBookingActionListeners();
}

// Services page functions
function updateServicesGrid(services) {
    const grid = document.getElementById('services-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (!Array.isArray(services) || services.length === 0) {
        grid.innerHTML = '<div class="text-center">No services found</div>';
        return;
    }

    services.forEach(service => {
        if (!validateServiceData(service)) return;
        
        const card = document.createElement('div');
        card.className = 'service-card';
        card.innerHTML = `
            <div class="service-image">
                <img src="${service.image || '../images/default-service.jpg'}" 
                     alt="${escapeHtml(service.name)}"
                     onerror="this.src='../images/default-service.jpg'"
                     loading="lazy">
            </div>
            <div class="service-icon">
                <i class="${service.icon || 'fas fa-tooth'}"></i>
            </div>
            <h3>${escapeHtml(service.name)}</h3>
            <p>${escapeHtml(service.description)}</p>
            <div class="service-info">
                <span class="duration"><i class="far fa-clock"></i> ${service.duration || 30} mins</span>
                <span class="category"><i class="fas fa-tag"></i> ${service.category || 'General'}</span>
            </div>
            <div class="service-actions">
                <button class="btn btn-primary edit-service" data-id="${service.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger delete-service" data-id="${service.id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        grid.appendChild(card);
    });

    setupServiceActionListeners();
}

// Testimonials page functions
function updateTestimonials(pendingTestimonials, approvedTestimonials) {
    updateTestimonialSection('pending-testimonials', pendingTestimonials, true);
    updateTestimonialSection('approved-testimonials', approvedTestimonials, false);
}

function updateTestimonialSection(containerId, testimonials, isPending) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (!testimonials?.length) {
        container.innerHTML = `<div class="text-center">No ${isPending ? 'pending' : 'approved'} testimonials</div>`;
        return;
    }

    testimonials.forEach(testimonial => {
        const card = document.createElement('div');
        card.className = 'testimonial-card';
        card.innerHTML = `
            <div class="testimonial-header">
                <img src="${testimonial.image || '../images/default-avatar.jpg'}" alt="${testimonial.name}">
                <div>
                    <h4>${escapeHtml(testimonial.name)}</h4>
                    <p>${escapeHtml(testimonial.title)}</p>
                </div>
            </div>
            <div class="testimonial-content">
                <p>${escapeHtml(testimonial.content)}</p>
            </div>
            <div class="testimonial-actions">
                ${isPending ? `
                    <button class="btn btn-primary approve-testimonial" data-id="${testimonial.id}">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-danger reject-testimonial" data-id="${testimonial.id}">
                        <i class="fas fa-times"></i> Reject
                    </button>
                ` : `
                    <button class="btn btn-danger remove-testimonial" data-id="${testimonial.id}">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                `}
            </div>
        `;
        container.appendChild(card);
    });

    // Setup testimonial action listeners
    setupTestimonialActionListeners(isPending);
}

// Settings page functions
function setupSettingsForm() {
    const form = document.getElementById('change-password-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const currentPassword = form.currentPassword.value;
        const newPassword = form.newPassword.value;
        const confirmPassword = form.confirmPassword.value;

        if (newPassword !== confirmPassword) {
            showErrorMessage('New passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/admin/change-password', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await handleResponse(response);
            showErrorMessage(data.message, false);
            form.reset();
        } catch (error) {
            showErrorMessage(error.message || 'Failed to change password');
        }
    });
}

// Initialize event listeners for all pages
function initializeEventListeners() {
    // Add doctor button
    const addDoctorBtn = document.getElementById('add-doctor-btn');
    if (addDoctorBtn) {
        addDoctorBtn.removeEventListener('click', showAddDoctorModal); // Remove any existing
        addDoctorBtn.addEventListener('click', showAddDoctorModal);
    }

    // Add service button
    const addServiceBtn = document.getElementById('add-service-btn');
    if (addServiceBtn) {
        addServiceBtn.removeEventListener('click', showAddServiceModal); // Remove any existing
        addServiceBtn.addEventListener('click', showAddServiceModal);
    }

    // Add testimonial button
    const addTestimonialBtn = document.getElementById('add-testimonial-btn');
    if (addTestimonialBtn) {
        addTestimonialBtn.removeEventListener('click', showAddTestimonialModal); // Remove any existing
        addTestimonialBtn.addEventListener('click', showAddTestimonialModal);
    }

    // Save doctor button
    const saveDoctorBtn = document.getElementById('save-doctor');
    if (saveDoctorBtn) {
        saveDoctorBtn.removeEventListener('click', saveDoctorData); // Remove any existing
        saveDoctorBtn.addEventListener('click', saveDoctorData);
    }

    // Save service button
    const saveServiceBtn = document.getElementById('save-service');
    if (saveServiceBtn) {
        saveServiceBtn.removeEventListener('click', saveServiceData); // Remove any existing
        saveServiceBtn.addEventListener('click', saveServiceData);
    }

    // Save testimonial button
    const saveTestimonialBtn = document.getElementById('save-testimonial');
    if (saveTestimonialBtn) {
        saveTestimonialBtn.removeEventListener('click', saveTestimonialData); // Remove any existing
        saveTestimonialBtn.addEventListener('click', saveTestimonialData);
    }

    // Booking filters
    const statusFilter = document.getElementById('status-filter');
    const dateFilter = document.getElementById('date-filter');
    if (statusFilter && dateFilter) {
        statusFilter.addEventListener('change', applyBookingFilters);
        dateFilter.addEventListener('change', applyBookingFilters);
    }

    // Add refresh button functionality
    const refreshButton = document.createElement('button');
    refreshButton.className = 'btn-icon refresh-data';
    refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
    refreshButton.title = 'Refresh Data';
    refreshButton.addEventListener('click', async () => {
        const activePage = document.querySelector('.nav-item.active');
        if (activePage) {
            await loadPageData(activePage.dataset.page);
        }
    });

    // Add refresh button to header
    const headerRight = document.querySelector('.admin-header-right');
    if (headerRight) {
        headerRight.insertBefore(refreshButton, headerRight.firstChild);
    }
}

// Call initializeEventListeners after DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    init(); // Call the existing init function
});

// Add all modal templates to the body
function addModalTemplates() {
    // Doctor edit modal
    const doctorModal = createModalTemplate(
        'doctor-modal',
        'Doctor Details',
        getDoctorModalContent(),
        `
        <button type="button" class="btn btn-primary" id="save-doctor">Save Changes</button>
        <button type="button" class="btn" id="cancel-doctor">Cancel</button>
        `
    );

    // Service edit modal
    const serviceModal = createModalTemplate(
        'service-modal',
        'Service Details',
        getServiceModalContent(),
        `
        <button type="button" class="btn btn-primary" id="save-service">Save Changes</button>
        <button type="button" class="btn" id="cancel-service">Cancel</button>
        `
    );

    // Booking status edit modal
    const bookingStatusModal = createModalTemplate(
        'booking-status-modal',
        'Update Booking Status',
        `
        <form id="booking-status-form">
            <input type="hidden" id="booking-id">
            <div class="form-group">
                <label for="booking-status">Status</label>
                <select id="booking-status" required>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>
        </form>
        `,
        `
        <button type="button" class="btn btn-primary" id="save-booking-status">Save Changes</button>
        <button type="button" class="btn" id="cancel-booking-status">Cancel</button>
        `
    );

    // Booking details modal
    const bookingDetailsModal = createModalTemplate(
        'booking-details-modal',
        'Booking Details',
        `
        <div id="booking-details-content"></div>
        `,
        `
        <button type="button" class="btn" id="close-booking-details">Close</button>
        `
    );

    // Delete confirmation modal
    const deleteConfirmModal = createModalTemplate(
        'delete-confirm-modal',
        'Confirm Deletion',
        `
        <p id="delete-confirm-message">Are you sure you want to delete this item?</p>
        <input type="hidden" id="delete-item-id">
        <input type="hidden" id="delete-item-type">
        `,
        `
        <button type="button" class="btn btn-danger" id="confirm-delete">Delete</button>
        <button type="button" class="btn" id="cancel-delete">Cancel</button>
        `
    );

    // Add testimonial modal
    const testimonialModal = createModalTemplate(
        'testimonial-modal',
        'Testimonial Details',
        getTestimonialModalContent(),
        `
        <button type="button" class="btn btn-primary" id="save-testimonial">Save Changes</button>
        <button type="button" class="btn" id="cancel-testimonial">Cancel</button>
        `
    );

    // Add all modals to the body
    document.body.appendChild(doctorModal);
    document.body.appendChild(serviceModal);
    document.body.appendChild(bookingStatusModal);
    document.body.appendChild(bookingDetailsModal);
    document.body.appendChild(deleteConfirmModal);
    document.body.appendChild(testimonialModal);

    // Set up event listeners for modal actions
    setupModalEventListeners();
}

// Create a modal template element
function createModalTemplate(id, title, bodyContent, footerContent) {
    const modalDiv = document.createElement('div');
    modalDiv.id = id;
    modalDiv.className = 'modal';
    
    modalDiv.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                ${bodyContent}
            </div>
            <div class="modal-footer">
                ${footerContent}
            </div>
        </div>
    `;
    return modalDiv;
}

// Doctor modal template with image upload
function getDoctorModalContent() {
    return `
        <form id="doctor-form" enctype="multipart/form-data">
            <input type="hidden" id="doctor-id">
            <div class="form-group">
                <label for="doctor-image">Profile Image</label>
                <div class="image-upload-container">
                    <img id="doctor-image-preview" src="../images/default-avatar.jpg" alt="Doctor preview">
                    <input type="file" id="doctor-image" accept="image/*" class="image-upload">
                </div>
            </div>
            <div class="form-group">
                <label for="doctor-name">Name</label>
                <input type="text" id="doctor-name" required>
            </div>
            <div class="form-group">
                <label for="doctor-specialty">Specialty</label>
                <input type="text" id="doctor-specialty" required>
            </div>
            <div class="form-group">
                <label for="doctor-email">Email</label>
                <input type="email" id="doctor-email" required>
            </div>
            <div class="form-group">
                <label for="doctor-bio">Bio</label>
                <textarea id="doctor-bio" rows="4"></textarea>
            </div>
            <div class="form-group">
                <label for="doctor-services">Services</label>
                <select id="doctor-services" multiple>
                    <!-- Will be populated dynamically -->
                </select>
            </div>
        </form>
    `;
}

// Service modal template
function getServiceModalContent() {
    return `
        <form id="service-form" enctype="multipart/form-data">
            <input type="hidden" id="service-id">
            <div class="form-group">
                <label for="service-image">Service Image</label>
                <div class="image-upload-container">
                    <img id="service-image-preview" src="../images/default-service.jpg" alt="Service preview">
                    <input type="file" id="service-image" accept="image/*" class="image-upload">
                </div>
            </div>
            <div class="form-group">
                <label for="service-name">Name</label>
                <input type="text" id="service-name" required>
            </div>
            <div class="form-group">
                <label for="service-description">Description</label>
                <textarea id="service-description" rows="4" required></textarea>
            </div>
            <div class="form-group">
                <label for="service-icon">Icon Class (FontAwesome)</label>
                <input type="text" id="service-icon" placeholder="fas fa-tooth">
                <div class="icon-preview">
                    <i id="icon-preview" class="fas fa-tooth"></i>
                </div>
            </div>
            <div class="form-group">
                <label for="service-category">Category</label>
                <select id="service-category" required>
                    <option value="preventive">Preventive</option>
                    <option value="cosmetic">Cosmetic</option>
                    <option value="surgical">Surgical</option>
                    <option value="pediatric">Pediatric</option>
                    <option value="general">General</option>
                </select>
            </div>
            <div class="form-group">
                <label for="service-duration">Duration (minutes)</label>
                <input type="number" id="service-duration" min="15" step="15" placeholder="30">
            </div>
        </form>
    `;
}

// Add testimonial modal template
function getTestimonialModalContent() {
    return `
        <form id="testimonial-form" enctype="multipart/form-data">
            <input type="hidden" id="testimonial-id">
            <div class="form-group">
                <label for="testimonial-image">User Image</label>
                <div class="image-upload-container">
                    <img id="testimonial-image-preview" src="../images/testimonial-1.jpg" alt="User preview">
                    <input type="file" id="testimonial-image" accept="image/*" class="image-upload">
                </div>
            </div>
            <div class="form-group">
                <label for="testimonial-name">Name</label>
                <input type="text" id="testimonial-name" required>
            </div>
            <div class="form-group">
                <label for="testimonial-title">Title/Position</label>
                <input type="text" id="testimonial-title">
            </div>
            <div class="form-group">
                <label for="testimonial-content">Testimonial</label>
                <textarea id="testimonial-content" rows="4" required></textarea>
            </div>
            <div class="form-group">
                <label for="testimonial-rating">Rating</label>
                <select id="testimonial-rating" required>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                </select>
            </div>
        </form>
    `;
}

// Function to show testimonial modal
function showTestimonialModal(testimonial = null) {
    // Check if modal exists, if not create it first
    if (!document.getElementById('testimonial-modal')) {
        const testimonialModal = createModalTemplate(
            'testimonial-modal',
            testimonial ? 'Edit Testimonial' : 'Add Testimonial',
            getTestimonialModalContent(),
            `
            <button type="button" class="btn btn-primary" id="save-testimonial">Save</button>
            <button type="button" class="btn" id="cancel-testimonial">Cancel</button>
            `
        );
        document.body.appendChild(testimonialModal);
    }

    // Setup image preview for newly created elements
    setupImagePreview();

    // Populate form if editing, otherwise reset
    if (testimonial) {
        document.getElementById('testimonial-id').value = testimonial.id;
        document.getElementById('testimonial-name').value = testimonial.name;
        document.getElementById('testimonial-title').value = testimonial.title || '';
        document.getElementById('testimonial-content').value = testimonial.content;
        document.getElementById('testimonial-rating').value = testimonial.rating;
        if (testimonial.image) {
            document.getElementById('testimonial-image-preview').src = testimonial.image;
        }
    } else {
        document.getElementById('testimonial-id').value = '';
        const form = document.getElementById('testimonial-form');
        if (form) form.reset();
    }

    // Setup event listeners for the testimonial modal buttons
    document.getElementById('save-testimonial')?.addEventListener('click', saveTestimonialData);
    document.getElementById('cancel-testimonial')?.addEventListener('click', () => closeModal('testimonial-modal'));

    // Open the modal
    openModal('testimonial-modal');
}

// Image upload preview functionality
function setupImagePreview() {
    const imageInputs = document.querySelectorAll('.image-upload');
    imageInputs.forEach(input => {
        // Remove existing listeners first to avoid duplicates
        input.removeEventListener('change', handleImageChange);
        // Add new listener
        input.addEventListener('change', handleImageChange);
    });
}

// Handle image change event
function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        const previewId = this.id + '-preview';
        const preview = document.getElementById(previewId);
        
        reader.onload = function(e) {
            if (preview) preview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Setup modal event listeners with image handling
function setupModalEventListeners() {
    // Doctor modal
    document.getElementById('save-doctor')?.addEventListener('click', async () => {
        const doctorId = document.getElementById('doctor-id').value;
        const formData = new FormData();
        
        // Add form fields to FormData
        formData.append('name', document.getElementById('doctor-name').value);
        formData.append('specialty', document.getElementById('doctor-specialty').value);
        formData.append('email', document.getElementById('doctor-email').value);
        formData.append('bio', document.getElementById('doctor-bio').value);
        
        // Handle image upload
        const imageFile = document.getElementById('doctor-image').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        // Add selected services
        const services = Array.from(document.getElementById('doctor-services').selectedOptions)
            .map(opt => opt.value);
        formData.append('services', JSON.stringify(services));
        
        try {
            const response = await fetch(
                doctorId ? `/api/admin/doctors/${doctorId}` : '/api/admin/doctors',
                {
                    method: doctorId ? 'PUT' : 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    },
                    body: formData
                }
            );
            
            await handleResponse(response);
            closeModal('doctor-modal');
            navigateTo('doctors');
            showErrorMessage(`Doctor ${doctorId ? 'updated' : 'added'} successfully`, false);
        } catch (error) {
            showErrorMessage(`Failed to ${doctorId ? 'update' : 'add'} doctor`);
        }
    });
    
    // Service modal with icon preview
    document.getElementById('service-icon')?.addEventListener('input', (e) => {
        const iconPreview = document.getElementById('icon-preview');
        iconPreview.className = e.target.value;
    });
    
    document.getElementById('save-service')?.addEventListener('click', async () => {
        const serviceId = document.getElementById('service-id').value;
        const formData = new FormData();
        
        // Get all form values
        formData.append('name', document.getElementById('service-name').value);
        formData.append('description', document.getElementById('service-description').value);
        formData.append('icon', document.getElementById('service-icon').value);
        formData.append('category', document.getElementById('service-category').value);
        formData.append('duration', document.getElementById('service-duration').value);
        
        // Handle image upload
        const imageFile = document.getElementById('service-image').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }
        
        try {
            const response = await fetch(
                serviceId ? `/api/admin/services/${serviceId}` : '/api/admin/services',
                {
                    method: serviceId ? 'PUT' : 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    },
                    body: formData
                }
            );
            
            await handleResponse(response);
            closeModal('service-modal');
            navigateTo('services');
            showErrorMessage(`Service ${serviceId ? 'updated' : 'added'} successfully`, false);
        } catch (error) {
            showErrorMessage(`Failed to ${serviceId ? 'update' : 'add'} service`);
        }
    });
    
    // Booking status modal - Fixed event handler
    document.getElementById('save-booking-status')?.addEventListener('click', async function() {
        const bookingId = document.getElementById('booking-id').value;
        const newStatus = document.getElementById('booking-status').value;
        
        try {
            const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            await handleResponse(response);
            closeModal('booking-status-modal');
            navigateTo(document.querySelector('.nav-item.active').dataset.page);
            showErrorMessage('Booking status updated successfully', false);
        } catch (error) {
            showErrorMessage('Failed to update booking status');
        }
    });
    
    // Delete confirmation
    document.getElementById('confirm-delete')?.addEventListener('click', confirmDelete);
    
    // Close buttons
    document.querySelectorAll('.close-modal, [id^="cancel-"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.closest('.modal').id;
            closeModal(modalId);
        });
    });
}

// Function to show a modal
function openModal(modalId) {
    try {
        console.log(`Opening modal: ${modalId}`);
        const modal = document.getElementById(modalId);
        if (modal) {
            // Remove any existing alerts
            const alerts = modal.querySelectorAll('.alert');
            alerts.forEach(alert => alert.remove());
            
            // Show the modal
            modal.classList.add('active');
            
            // Setup image previews for all modals
            setupImagePreview();
            
            // Setup icon preview if this is a service modal
            if (modalId === 'service-modal') {
                setupIconPreview();
            }
            
            // Handle specific modal initialization
            if (modalId === 'doctor-modal' && !document.getElementById('doctor-services').options.length) {
                loadServicesForDoctor();
            }
        } else {
            console.error(`Modal not found: ${modalId}`);
            // Create the modal if it doesn't exist
            addModalTemplates();
            // Try to open it again
            setTimeout(() => openModal(modalId), 100);
        }
    } catch (error) {
        console.error('Error opening modal:', error);
        showErrorMessage('Error opening modal: ' + error.message);
    }
}

// Function to close a modal
function closeModal(modalId) {
    try {
        console.log(`Closing modal: ${modalId}`);
        const modal = document.getElementById(modalId);
        if (modal) {
            // Clean up form data ONLY if it's not the booking-status-modal or booking-details-modal
            // This ensures the booking ID remains set when we need it
            const form = modal.querySelector('form');
            if (form && modalId !== 'booking-status-modal' && modalId !== 'booking-details-modal') {
                form.reset();
            }
            
            // Remove any alerts
            const alerts = modal.querySelectorAll('.alert');
            alerts.forEach(alert => alert.remove());
            
            modal.classList.remove('active');
        } else {
            console.error(`Modal not found: ${modalId}`);
        }
    } catch (error) {
        console.error('Error closing modal:', error);
        showErrorMessage('Error closing modal');
    }
}

// Clean up when switching pages
function cleanup() {
    // Close any open modals
    document.querySelectorAll('.modal.active').forEach(modal => {
        closeModal(modal.id);
    });

    // Remove any alerts
    document.querySelectorAll('.alert').forEach(alert => {
        alert.remove();
    });
}

// Setup doctor action listeners
function setupDoctorActionListeners() {
    // Edit doctor buttons
    document.querySelectorAll('.edit-doctor').forEach(button => {
        button.addEventListener('click', () => editDoctor(button.dataset.id));
    });

    // Delete doctor buttons
    document.querySelectorAll('.delete-doctor').forEach(button => {
        button.addEventListener('click', () => {
            const doctorId = button.dataset.id;
            const doctorName = button.closest('tr').querySelector('td:first-child').textContent;
            showDeleteConfirmation('doctor', doctorId, `Are you sure you want to delete doctor "${doctorName}"?`);
        });
    });
}

// Setup service action listeners
function setupServiceActionListeners() {
    // Edit service buttons
    document.querySelectorAll('.edit-service').forEach(button => {
        button.addEventListener('click', () => editService(button.dataset.id));
    });

    // Delete service buttons
    document.querySelectorAll('.delete-service').forEach(button => {
        button.addEventListener('click', () => {
            const serviceId = button.dataset.id;
            const serviceName = button.closest('.service-card').querySelector('h3').textContent;
            showDeleteConfirmation('service', serviceId, `Are you sure you want to delete service "${serviceName}"?`);
        });
    });
}

// Setup testimonial action listeners
function setupTestimonialActionListeners(isPending) {
    if (isPending) {
        // Approve testimonial buttons
        document.querySelectorAll('.approve-testimonial').forEach(button => {
            button.addEventListener('click', () => approveTestimonial(button.dataset.id));
        });

        // Reject testimonial buttons
        document.querySelectorAll('.reject-testimonial').forEach(button => {
            button.addEventListener('click', () => {
                const testimonialId = button.dataset.id;
                showDeleteConfirmation('testimonial', testimonialId, 'Are you sure you want to reject this testimonial?');
            });
        });
    } else {
        // Remove testimonial buttons
        document.querySelectorAll('.remove-testimonial').forEach(button => {
            button.addEventListener('click', () => {
                const testimonialId = button.dataset.id;
                showDeleteConfirmation('testimonial', testimonialId, 'Are you sure you want to remove this testimonial?');
            });
        });
    }
}

// Setup booking filters
function setupBookingFilters() {
    const statusFilter = document.getElementById('status-filter');
    const dateFilter = document.getElementById('date-filter');
    
    if (statusFilter && dateFilter) {
        statusFilter.addEventListener('change', applyBookingFilters);
        dateFilter.addEventListener('change', applyBookingFilters);
    }
}

// Apply booking filters
async function applyBookingFilters() {
    const status = document.getElementById('status-filter').value;
    const date = document.getElementById('date-filter').value;
    
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    
    try {
        let url = '/api/admin/bookings?';
        if (status) url += `status=${status}&`;
        if (date) url += `date=${date}&`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await handleResponse(response);
        
        if (Array.isArray(data.bookings)) {
            updateBookingsTable(data.bookings);
        } else {
            updateBookingsTable([]);
        }
    } catch (error) {
        console.error('Error applying filters:', error);
        showErrorMessage('Failed to filter bookings');
    }
}

// Edit a doctor
async function editDoctor(doctorId) {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
        // Fetch doctor details
        const response = await fetch(`/api/admin/doctors/${doctorId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const doctor = await handleResponse(response);
        
        // Make sure the modal exists
        if (!document.getElementById('doctor-modal')) {
            showAddDoctorModal();
        }

        // Fetch services for dropdown
        const servicesResponse = await fetch('/api/admin/services', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const servicesData = await handleResponse(servicesResponse);
        
        // Populate the doctor form
        document.getElementById('doctor-id').value = doctor.id;
        document.getElementById('doctor-name').value = doctor.name;
        document.getElementById('doctor-specialty').value = doctor.specialty;
        document.getElementById('doctor-email').value = doctor.email;
        document.getElementById('doctor-bio').value = doctor.bio || '';
        
        // If doctor has an image, update the preview
        if (doctor.image_url) {
            document.getElementById('doctor-image-preview').src = doctor.image_url;
        }
        
        // Populate services dropdown
        const servicesSelect = document.getElementById('doctor-services');
        servicesSelect.innerHTML = '';
        if (Array.isArray(servicesData.services)) {
            servicesData.services.forEach(service => {
                const option = document.createElement('option');
                option.value = service.id;
                option.textContent = service.name;
                // Check if this service is assigned to the doctor
                if (Array.isArray(doctor.services) && doctor.services.includes(service.id)) {
                    option.selected = true;
                } else if (doctor.serviceIds && Array.isArray(doctor.serviceIds) && doctor.serviceIds.includes(service.id)) {
                    option.selected = true;
                }
                servicesSelect.appendChild(option);
            });
        } else {
            console.error('Doctor services select element or services data not found');
        }

        // Show the modal
        openModal('doctor-modal');
    } catch (error) {
        console.error('Error loading doctor details:', error);
        showErrorMessage('Failed to load doctor details');
    }
}

// Edit a service
async function editService(serviceId) {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
        const response = await fetch(`/api/admin/services/${serviceId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const service = await handleResponse(response);
        
        // Make sure the modal exists in the DOM
        if (!document.getElementById('service-modal')) {
            showAddServiceModal();
        }
        
        // Populate the service form
        document.getElementById('service-id').value = service.id;
        document.getElementById('service-name').value = service.name;
        document.getElementById('service-description').value = service.description;
        document.getElementById('service-icon').value = service.icon || 'fas fa-tooth';
        document.getElementById('service-category').value = service.category || 'general';
        document.getElementById('service-duration').value = service.duration || 30;
        
        // Update the icon preview
        setupIconPreview();
        
        // If service has an image, update the preview
        if (service.image) {
            document.getElementById('service-image-preview').src = service.image;
        } else {
            document.getElementById('service-image-preview').src = '../images/default-service.jpg';
        }

        // Open the modal
        openModal('service-modal');
    } catch (error) {
        console.error('Error loading service details:', error);
        showErrorMessage('Failed to load service details');
    }
}

// Approve testimonial
async function approveTestimonial(testimonialId) {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
        const response = await fetch(`/api/admin/testimonials/${testimonialId}/approve`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        await handleResponse(response);
        
        // Reload testimonials
        navigateTo('testimonials');
        showErrorMessage('Testimonial approved successfully', false);
    } catch (error) {
        showErrorMessage('Failed to approve testimonial');
    }
}

// Show delete confirmation modal
function showDeleteConfirmation(itemType, itemId, message) {
    // Make sure the confirmation modal exists
    if (!document.getElementById('delete-confirm-modal')) {
        const deleteConfirmModal = createModalTemplate(
            'delete-confirm-modal',
            'Confirm Deletion',
            `
            <p id="delete-confirm-message">Are you sure you want to delete this item?</p>
            <input type="hidden" id="delete-item-id">
            <input type="hidden" id="delete-item-type">
            `,
            `
            <button type="button" class="btn btn-danger" id="confirm-delete">Delete</button>
            <button type="button" class="btn" id="cancel-delete">Cancel</button>
            `
        );
        document.body.appendChild(deleteConfirmModal);
        
        // Add event listener to the confirm delete button
        document.getElementById('confirm-delete')?.addEventListener('click', confirmDelete);
        document.getElementById('cancel-delete')?.addEventListener('click', () => closeModal('delete-confirm-modal'));
    }
    
    document.getElementById('delete-confirm-message').textContent = message;
    document.getElementById('delete-item-type').value = itemType;
    document.getElementById('delete-item-id').value = itemId;
    openModal('delete-confirm-modal');
}

// Confirm delete action
async function confirmDelete() {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    
    const itemType = document.getElementById('delete-item-type').value;
    const itemId = document.getElementById('delete-item-id').value;
    
    let endpoint;
    switch (itemType) {
        case 'doctor':
            endpoint = `/api/admin/doctors/${itemId}`;
            break;
        case 'service':
            endpoint = `/api/admin/services/${itemId}`;
            break;
        case 'testimonial':
            endpoint = `/api/admin/testimonials/${itemId}`;
            break;
        default:
            showErrorMessage('Invalid item type');
            closeModal('delete-confirm-modal');
            return;
    }
    
    try {
        console.log(`Deleting ${itemType} with ID ${itemId}`);
        const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        await handleResponse(response);
        
        // Close modal and reload data
        closeModal('delete-confirm-modal');
        
        // Reload the appropriate page
        const activePage = document.querySelector('.nav-item.active')?.dataset.page || itemType + 's';
        navigateTo(activePage);
        
        showErrorMessage(`${capitalizeFirst(itemType)} deleted successfully`, false);
    } catch (error) {
        showErrorMessage(`Failed to delete ${itemType}: ${error.message}`);
    }
}

// Show add testimonial modal
function showAddTestimonialModal() {
    // Call the existing testimonial modal function without any testimonial data to add new
    showTestimonialModal(null);
}

// Save doctor data
async function saveDoctorData() {
    const doctorId = document.getElementById('doctor-id').value;
    const formData = new FormData();
    
    // Add form fields to FormData
    formData.append('name', document.getElementById('doctor-name').value);
    formData.append('specialty', document.getElementById('doctor-specialty').value);
    formData.append('email', document.getElementById('doctor-email').value);
    formData.append('bio', document.getElementById('doctor-bio').value);
    
    // Handle image upload - important to use 'image' to match server expectations
    const imageFile = document.getElementById('doctor-image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    // Add selected services
    const servicesSelect = document.getElementById('doctor-services');
    if (servicesSelect) {
        const services = Array.from(servicesSelect.selectedOptions)
            .map(opt => opt.value);
        formData.append('services', JSON.stringify(services));
    } else {
        formData.append('services', JSON.stringify([]));
    }
    
    try {
        console.log("Saving doctor data...");
        
        // Log the form data for debugging
        console.log("Form data contents:");
        for (const pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }
        
        const response = await fetch(
            doctorId ? `/api/admin/doctors/${doctorId}` : '/api/admin/doctors',
            {
                method: doctorId ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: formData
            }
        );
        
        await handleResponse(response);
        closeModal('doctor-modal');
        navigateTo('doctors');
        showErrorMessage(`Doctor ${doctorId ? 'updated' : 'added'} successfully`, false);
    } catch (error) {
        console.error("Error saving doctor:", error);
        showErrorMessage(`Failed to ${doctorId ? 'update' : 'add'} doctor: ${error.message}`);
    }
}

// Save service data
async function saveServiceData() {
    const serviceId = document.getElementById('service-id').value;
    const name = document.getElementById('service-name').value.trim();
    const description = document.getElementById('service-description').value.trim();
    const icon = document.getElementById('service-icon').value.trim();
    const category = document.getElementById('service-category').value.trim();
    const duration = parseInt(document.getElementById('service-duration').value);

    // Validate required fields
    if (!name || !description) {
        showErrorMessage("Name and description are required");
        return;
    }

    // Validate duration
    if (isNaN(duration) || duration < 15) {
        showErrorMessage("Duration must be at least 15 minutes");
        return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) {
        showLoginPage();
        return;
    }

    try {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('icon', icon);
        formData.append('category', category);
        formData.append('duration', duration);
        
        // Handle image upload
        const imageFile = document.getElementById('service-image').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        console.log("Saving service data...");
        
        const response = await fetch(
            serviceId ? `/api/admin/services/${serviceId}` : '/api/admin/services',
            {
                method: serviceId ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            }
        );
        
        await handleResponse(response);
        closeModal('service-modal');
        navigateTo('services');
        showErrorMessage(`Service ${serviceId ? 'updated' : 'added'} successfully`, false);
    } catch (error) {
        console.error("Error saving service:", error);
        showErrorMessage(`Failed to ${serviceId ? 'update' : 'add'} service: ${error.message}`);
    }
}

// Save testimonial data
async function saveTestimonialData() {
    const testimonialId = document.getElementById('testimonial-id').value;
    const formData = new FormData();
    
    formData.append('name', document.getElementById('testimonial-name').value);
    formData.append('title', document.getElementById('testimonial-title').value);
    formData.append('content', document.getElementById('testimonial-content').value);
    formData.append('rating', document.getElementById('testimonial-rating').value);
    
    // Handle image upload - important to use 'image' to match server expectations
    const imageFile = document.getElementById('testimonial-image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    try {
        console.log("Saving testimonial data...");
        
        // Log the form data for debugging
        console.log("Form data contents:");
        for (const pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }
        
        const response = await fetch(
            testimonialId ? 
            `/api/admin/testimonials/${testimonialId}` : 
            '/api/admin/testimonials',
            {
                method: testimonialId ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: formData
            }
        );
        
        await handleResponse(response);
        closeModal('testimonial-modal');
        navigateTo('testimonials');
        showErrorMessage(`Testimonial ${testimonialId ? 'updated' : 'added'} successfully`, false);
    } catch (error) {
        console.error("Error saving testimonial:", error);
        showErrorMessage(`Failed to ${testimonialId ? 'update' : 'add'} testimonial: ${error.message}`);
    }
}

// Load services for doctor selection
async function loadServicesForDoctor() {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
        console.log("Loading services for doctor selection...");
        const response = await fetch('/api/admin/services', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await handleResponse(response);
        const select = document.getElementById('doctor-services');
        if (select && data.services) {
            // Clear existing options
            select.innerHTML = '';
            
            // Add options for each service
            data.services.forEach(service => {
                const option = document.createElement('option');
                option.value = service.id;
                option.textContent = service.name;
                select.appendChild(option);
            });
        } else {
            console.error('Doctor services select element or services data not found');
        }
    } catch (error) {
        showErrorMessage('Failed to load services');
        console.error('Error loading services:', error);
    }
}

// Auto refresh dashboard data every 30 seconds
function setupDashboardAutoRefresh() {
    if (window.dashboardRefreshInterval) {
        clearInterval(window.dashboardRefreshInterval);
    }
    
    window.dashboardRefreshInterval = setInterval(async () => {
        const activePage = document.querySelector('.nav-item.active');
        if (activePage && activePage.dataset.page === 'dashboard') {
            await loadDashboardData();
        }
    }, 30000);
}

// Add/update the sidebar toggle functionality
function setupSidebarToggle() {
    const toggleBtn = document.getElementById('toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            if (mainContent) {
                mainContent.style.marginLeft = sidebar.classList.contains('collapsed') ? '60px' : 'var(--sidebar-width)';
            }
        });
    }
    
    // On mobile, toggle active class instead
    const mobileToggle = document.querySelector('.sidebar-header .toggle-btn');
    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    // Close sidebar on mobile when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 991 && 
            sidebar && 
            sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            !toggleBtn?.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
}

// Fix function to show add doctor modal
function showAddDoctorModal() {
    // Make sure modal exists or create it
    if (!document.getElementById('doctor-modal')) {
        addModalTemplates();
    }
    
    // Clear form for new doctor
    document.getElementById('doctor-id').value = '';
    const form = document.getElementById('doctor-form');
    if (form) form.reset();
    
    // Set default image
    document.getElementById('doctor-image-preview').src = '../images/default-avatar.jpg';
    
    // Load services for dropdown
    loadServicesForDoctor();
    
    // Open the modal
    openModal('doctor-modal');
}

// Fix function to show add service modal
function showAddServiceModal() {
    // Make sure modal exists or create it
    if (!document.getElementById('service-modal')) {
        addModalTemplates();
    }
    
    // Clear form for new service
    document.getElementById('service-id').value = '';
    const form = document.getElementById('service-form');
    if (form) form.reset();
    
    // Reset image and icon preview
    document.getElementById('service-image-preview').src = '../images/default-service.jpg';
    
    const iconPreview = document.getElementById('icon-preview');
    if (iconPreview) {
        iconPreview.className = 'fas fa-tooth';
    }
    
    // Open the modal
    openModal('service-modal');
}

// Fix loadServicesForDoctor function to properly populate the dropdown
async function loadServicesForDoctor() {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
        console.log("Loading services for doctor selection...");
        const response = await fetch('/api/admin/services', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await handleResponse(response);
        const select = document.getElementById('doctor-services');
        if (select && data.services) {
            // Clear existing options
            select.innerHTML = '';
            
            // Add options for each service
            data.services.forEach(service => {
                const option = document.createElement('option');
                option.value = service.id;
                option.textContent = service.name;
                select.appendChild(option);
            });
        } else {
            console.error('Doctor services select element or services data not found');
        }
    } catch (error) {
        showErrorMessage('Failed to load services');
        console.error('Error loading services:', error);
    }
}

// Fix function to set up icon preview
function setupIconPreview() {
    const iconInput = document.getElementById('service-icon');
    const iconPreview = document.getElementById('icon-preview');
    
    if (iconInput && iconPreview) {
        // Set initial preview based on current value
        iconPreview.className = iconInput.value || 'fas fa-tooth';
        
        // Add input event listener
        iconInput.addEventListener('input', (e) => {
            iconPreview.className = e.target.value || 'fas fa-tooth';
        });
    }
}

// Fix openModal function to ensure proper initialization
function openModal(modalId) {
    try {
        console.log(`Opening modal: ${modalId}`);
        const modal = document.getElementById(modalId);
        if (modal) {
            // Remove any existing alerts
            const alerts = modal.querySelectorAll('.alert');
            alerts.forEach(alert => alert.remove());
            
            // Show the modal
            modal.classList.add('active');
            
            // Setup image previews for all modals
            setupImagePreview();
            
            // Setup icon preview if this is a service modal
            if (modalId === 'service-modal') {
                setupIconPreview();
            }
            
            // Handle specific modal initialization
            if (modalId === 'doctor-modal' && !document.getElementById('doctor-services').options.length) {
                loadServicesForDoctor();
            }
        } else {
            console.error(`Modal not found: ${modalId}`);
            // Create the modal if it doesn't exist
            addModalTemplates();
            // Try to open it again
            setTimeout(() => openModal(modalId), 100);
        }
    } catch (error) {
        console.error('Error opening modal:', error);
        showErrorMessage('Error opening modal: ' + error.message);
    }
}

// Fix saveDoctorData to handle image field correctly
async function saveDoctorData() {
    const doctorId = document.getElementById('doctor-id').value;
    const formData = new FormData();
    
    // Add form fields to FormData
    formData.append('name', document.getElementById('doctor-name').value);
    formData.append('specialty', document.getElementById('doctor-specialty').value);
    formData.append('email', document.getElementById('doctor-email').value);
    formData.append('bio', document.getElementById('doctor-bio').value);
    
    // Handle image upload - important to use 'image' to match server expectations
    const imageFile = document.getElementById('doctor-image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    // Add selected services
    const servicesSelect = document.getElementById('doctor-services');
    if (servicesSelect) {
        const services = Array.from(servicesSelect.selectedOptions)
            .map(opt => opt.value);
        formData.append('services', JSON.stringify(services));
    } else {
        formData.append('services', JSON.stringify([]));
    }
    
    try {
        console.log("Saving doctor data...");
        
        // Log the form data for debugging
        console.log("Form data contents:");
        for (const pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }
        
        const response = await fetch(
            doctorId ? `/api/admin/doctors/${doctorId}` : '/api/admin/doctors',
            {
                method: doctorId ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: formData
            }
        );
        
        await handleResponse(response);
        closeModal('doctor-modal');
        navigateTo('doctors');
        showErrorMessage(`Doctor ${doctorId ? 'updated' : 'added'} successfully`, false);
    } catch (error) {
        console.error("Error saving doctor:", error);
        showErrorMessage(`Failed to ${doctorId ? 'update' : 'add'} doctor: ${error.message}`);
    }
}

// Fix saveServiceData to handle image field correctly
async function saveServiceData() {
    const serviceId = document.getElementById('service-id').value;
    const name = document.getElementById('service-name').value.trim();
    const description = document.getElementById('service-description').value.trim();
    const icon = document.getElementById('service-icon').value.trim();
    const category = document.getElementById('service-category').value.trim();
    const duration = parseInt(document.getElementById('service-duration').value);

    // Validate required fields
    if (!name || !description) {
        showErrorMessage("Name and description are required");
        return;
    }

    // Validate duration
    if (isNaN(duration) || duration < 15) {
        showErrorMessage("Duration must be at least 15 minutes");
        return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) {
        showLoginPage();
        return;
    }

    try {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('icon', icon);
        formData.append('category', category);
        formData.append('duration', duration);
        
        // Handle image upload
        const imageFile = document.getElementById('service-image').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        console.log("Saving service data...");
        
        const response = await fetch(
            serviceId ? `/api/admin/services/${serviceId}` : '/api/admin/services',
            {
                method: serviceId ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            }
        );
        
        await handleResponse(response);
        closeModal('service-modal');
        navigateTo('services');
        showErrorMessage(`Service ${serviceId ? 'updated' : 'added'} successfully`, false);
    } catch (error) {
        console.error("Error saving service:", error);
        showErrorMessage(`Failed to ${serviceId ? 'update' : 'add'} service: ${error.message}`);
    }
}

// Fix saveTestimonialData to handle image field correctly
async function saveTestimonialData() {
    const testimonialId = document.getElementById('testimonial-id').value;
    const formData = new FormData();
    
    formData.append('name', document.getElementById('testimonial-name').value);
    formData.append('title', document.getElementById('testimonial-title').value);
    formData.append('content', document.getElementById('testimonial-content').value);
    formData.append('rating', document.getElementById('testimonial-rating').value);
    
    // Handle image upload - important to use 'image' to match server expectations
    const imageFile = document.getElementById('testimonial-image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    try {
        console.log("Saving testimonial data...");
        
        // Log the form data for debugging
        console.log("Form data contents:");
        for (const pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }
        
        const response = await fetch(
            testimonialId ? 
            `/api/admin/testimonials/${testimonialId}` : 
            '/api/admin/testimonials',
            {
                method: testimonialId ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: formData
            }
        );
        
        await handleResponse(response);
        closeModal('testimonial-modal');
        navigateTo('testimonials');
        showErrorMessage(`Testimonial ${testimonialId ? 'updated' : 'added'} successfully`, false);
    } catch (error) {
        console.error("Error saving testimonial:", error);
        showErrorMessage(`Failed to ${testimonialId ? 'update' : 'add'} testimonial: ${error.message}`);
    }
}