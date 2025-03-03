import { initBookingSystem } from './booking.js';

// Form validation and submission
export function initAppointmentForm() {
    const form = document.getElementById('appointment-form');
    if (!form) return;

    // Initialize the booking system
    initBookingSystem();
    
    // Add form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get all required data
        const formData = {
            fullName: form.querySelector('#patient-name')?.value,
            email: form.querySelector('#patient-email')?.value,
            phone: form.querySelector('#patient-phone')?.value,
            service: document.querySelector('#summary-service')?.textContent,
            doctor_id: form.querySelector('input[name="doctor_id"]')?.value,
            booking_date: form.querySelector('input[name="booking_date"]')?.value,
            booking_time: form.querySelector('input[name="booking_time"]')?.value,
            additionalInfo: form.querySelector('#patient-notes')?.value || ''
        };

        // Validate required fields
        const requiredFields = ['fullName', 'email', 'phone', 'service', 'doctor_id', 'booking_date', 'booking_time'];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            // Clear previous errors
            clearErrors(form);
            
            // Show errors for missing fields
            missingFields.forEach(field => {
                const element = form.querySelector(`#patient-${field}`) || 
                              form.querySelector(`[name="${field}"]`);
                if (element) {
                    showError(element, 'This field is required');
                }
            });

            // Show general error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger';
            errorDiv.style.marginBottom = '20px';
            errorDiv.textContent = 'Please complete all required fields';
            form.insertBefore(errorDiv, form.firstChild);
            
            return;
        }

        await submitBooking(form, formData);
    });
}

// Show error message for a field
function showError(input, message) {
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;

    input.classList.add('error');
    
    const errorElement = document.createElement('span');
    errorElement.className = 'form-error';
    errorElement.textContent = message;
    formGroup.appendChild(errorElement);
}

// Clear all error messages
function clearErrors(form) {
    form.querySelectorAll('.form-error').forEach(error => error.remove());
    form.querySelectorAll('.error').forEach(input => input.classList.remove('error'));
    const existingAlert = form.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
}

// Submit booking to server
async function submitBooking(form, formData) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    
    try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mengirim...';

        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create booking');
        }

        const result = await response.json();
        
        // Show success message
        form.innerHTML = `
            <div class="success-message">
                <i class="fas fa-check-circle"></i>
                <h3>Permintaan Janji Temu Terkirim!</h3>
                <p>Terima kasih telah membuat janji dengan kami. Tim kami akan menghubungi Anda dalam waktu 24 jam untuk mengkonfirmasi jadwal kunjungan Anda.</p>
            </div>
        `;

    } catch (error) {
        console.error('Error submitting booking:', error);
        
        // Show error message
        clearErrors(form);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.style.marginBottom = '20px';
        errorDiv.textContent = error.message;
        form.insertBefore(errorDiv, form.firstChild);
        
        // Reset submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}
