// Form validation and submission
export function initAppointmentForm() {
    const form = document.getElementById('appointment-form');
    
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Basic validation
        let valid = true;
        const formInputs = form.querySelectorAll('input, select, textarea');
        
        formInputs.forEach(input => {
            if (input.required && !input.value.trim()) {
                valid = false;
                showError(input, 'This field is required');
            } else {
                removeError(input);
                
                // Email validation
                if (input.type === 'email' && !isValidEmail(input.value.trim())) {
                    valid = false;
                    showError(input, 'Please enter a valid email address');
                }
                
                // Phone validation
                if (input.type === 'tel' && !isValidPhone(input.value.trim())) {
                    valid = false;
                    showError(input, 'Please enter a valid phone number');
                }
            }
        });
        
        if (valid) {
            submitForm(form);
        }
    });
}

function showError(input, message) {
    // Remove existing error first
    removeError(input);
    
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'form-error';
    errorElement.textContent = message;
    errorElement.style.color = '#ff6b6b';
    errorElement.style.fontSize = '14px';
    errorElement.style.marginTop = '5px';
    
    // Highlight the input
    input.style.borderColor = '#ff6b6b';
    
    // Insert error message after the input
    input.parentNode.appendChild(errorElement);
}

function removeError(input) {
    input.style.borderColor = '';
    const errorElement = input.parentNode.querySelector('.form-error');
    if (errorElement) {
        errorElement.remove();
    }
}

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function isValidPhone(phone) {
    // Allow various phone formats and optional country codes
    const regex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
    return regex.test(phone);
}

function submitForm(form) {
    // Get form data
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengirim...';
    
    // Simulate API call
    setTimeout(() => {
        // Success message
        form.innerHTML = `
            <div class="success-message" style="text-align: center; padding: 20px;">
                <i class="fas fa-check-circle" style="font-size: 48px; color: #4CAF50; margin-bottom: 20px;"></i>
                <h3>Permintaan Janji Temu Terkirim!</h3>
                <p>Terima kasih telah membuat janji dengan kami. Tim kami akan menghubungi Anda dalam waktu 24 jam untuk mengkonfirmasi jadwal kunjungan Anda.</p>
            </div>
        `;
        
        // Log the data (in a real app, this would be sent to a server)
        console.log('Form submitted with the following data:', data);
    }, 1500);
}
