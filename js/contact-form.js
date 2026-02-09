/**
 * Dabs Contact Form
 * Handles contact form submissions and sends emails
 */

// ===================================
// Configuration
// ===================================

const CONTACT_CONFIG = {
    // Email Notification Settings
    
    // Option 1: Webhook (RECOMMENDED - works with Zapier, Make, etc.)
    USE_WEBHOOK: false,
    WEBHOOK_URL: 'YOUR_WEBHOOK_URL',  // e.g., Zapier webhook
    
    // Option 2: Email Service API (like EmailJS, SendGrid, etc.)
    USE_EMAIL_SERVICE: true,
    EMAIL_SERVICE_URL: 'YOUR_EMAIL_SERVICE_URL',
    
    // Your email address to receive contact form submissions
    RECIPIENT_EMAIL: 'info@dabscannabis.com',
    
    // Auto-reply to customer
    SEND_AUTO_REPLY: true
};

// ===================================
// Contact Form Class
// ===================================

class ContactForm {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.submitButton = document.querySelector('.contact-submit-btn');
        
        this.init();
    }
    
    init() {
        if (!this.form) return;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            name: document.getElementById('contactName').value.trim(),
            email: document.getElementById('contactEmail').value.trim(),
            phone: document.getElementById('contactPhone').value.trim() || 'Not provided',
            subject: document.getElementById('contactSubject').value,
            message: document.getElementById('contactMessage').value.trim(),
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleString(),
            page: 'Main Website Contact Form'
        };
        
        // Validate
        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            alert('Please fill in all required fields.');
            return;
        }
        
        // Disable submit button
        this.submitButton.disabled = true;
        this.submitButton.textContent = 'Sending...';
        
        try {
            // Submit the form
            const success = await this.submitForm(formData);
            
            if (success) {
                this.showSuccess();
                
                // Reset form after 3 seconds
                setTimeout(() => {
                    this.form.reset();
                    this.submitButton.disabled = false;
                    this.submitButton.textContent = 'Send Message';
                    this.hideSuccess();
                }, 3000);
            } else {
                throw new Error('Failed to send message');
            }
            
        } catch (error) {
            console.error('Error submitting contact form:', error);
            alert('Sorry, there was an error sending your message. Please try emailing us directly at ' + CONTACT_CONFIG.RECIPIENT_EMAIL);
            this.submitButton.disabled = false;
            this.submitButton.textContent = 'Send Message';
        }
    }
    
    async submitForm(data) {
        // Choose submission method based on configuration
        
        if (CONTACT_CONFIG.USE_WEBHOOK) {
            // Method 1: Send to Webhook (RECOMMENDED)
            return await this.sendToWebhook(data);
            
        } else if (CONTACT_CONFIG.USE_EMAIL_SERVICE) {
            // Method 2: Send via Email Service
            return await this.sendViaEmailService(data);
            
        } else {
            // Development mode - just log to console
            console.log('Contact form submission (dev mode):', data);
            console.log('\n--- EMAIL TO YOU ---');
            console.log(`To: ${CONTACT_CONFIG.RECIPIENT_EMAIL}`);
            console.log(`From: ${data.email}`);
            console.log(`Subject: Contact Form: ${data.subject}`);
            console.log('\nMessage:');
            console.log(`Name: ${data.name}`);
            console.log(`Email: ${data.email}`);
            console.log(`Phone: ${data.phone}`);
            console.log(`Subject: ${data.subject}`);
            console.log(`Message: ${data.message}`);
            console.log(`Submitted: ${data.date}`);
            return true;
        }
    }
    
    async sendToWebhook(data) {
        try {
            const response = await fetch(CONTACT_CONFIG.WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            return response.ok;
        } catch (error) {
            console.error('Webhook error:', error);
            return false;
        }
    }
    
    async sendViaEmailService(data) {
       try {
           emailjs.init('5gcl-lNvVgOL16lNV');
           
           const result = await emailjs.send(
               'service_lhwiszo',
               'template_zeajr9o',
               {
                   from_name: data.name,
                   from_email: data.email,
                   phone: data.phone,
                   subject: data.subject,
                   message: data.message,
                   date: data.date
               }
           );
           
           return result.status === 200;
       } catch (error) {
           console.error('EmailJS error:', error);
           return false;
       }
   }
    
    generateEmailHTML(data) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #FFB700; color: #000; padding: 20px; text-align: center; }
                    .content { background: #f9f9f9; padding: 30px; margin: 20px 0; }
                    .field { margin-bottom: 15px; }
                    .label { font-weight: bold; color: #FFB700; }
                    .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>New Contact Form Submission</h1>
                        <p>From: Dabs Website</p>
                    </div>
                    
                    <div class="content">
                        <div class="field">
                            <span class="label">Name:</span> ${data.name}
                        </div>
                        
                        <div class="field">
                            <span class="label">Email:</span> 
                            <a href="mailto:${data.email}">${data.email}</a>
                        </div>
                        
                        <div class="field">
                            <span class="label">Phone:</span> ${data.phone}
                        </div>
                        
                        <div class="field">
                            <span class="label">Subject:</span> ${data.subject}
                        </div>
                        
                        <div class="field">
                            <span class="label">Message:</span><br>
                            <p style="white-space: pre-wrap; background: white; padding: 15px; border-left: 4px solid #FFB700;">
                                ${data.message}
                            </p>
                        </div>
                        
                        <div class="field">
                            <span class="label">Submitted:</span> ${data.date}
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>This message was sent from the Dabs contact form</p>
                        <p>Reply directly to this email to respond to the customer</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
    
    showSuccess() {
        // Replace form with success message
        this.form.innerHTML = `
            <div style="text-align: center; padding: 3rem 2rem;">
                <div style="font-size: 5rem; margin-bottom: 1.5rem;">✅</div>
                <h3 style="font-size: 2rem; font-weight: 800; color: var(--color-secondary); margin-bottom: 1rem;">
                    Message Sent!
                </h3>
                <p style="color: rgba(255, 255, 255, 0.8); font-size: 1.1rem; line-height: 1.6;">
                    Thank you for contacting us. We'll get back to you within 24-48 hours.
                </p>
            </div>
        `;
    }
    
    hideSuccess() {
        // This would restore the form, but since we reset it, we don't need to do anything
        // The form is already reset by the time this is called
    }
}

// ===================================
// Initialize Contact Form
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = new ContactForm();
    console.log('📧 Contact form initialized');
});

// ===================================
// Smooth Scroll to Contact Section
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Handle navigation links to contact section
    const contactLinks = document.querySelectorAll('a[href="#contact"]');
    
    contactLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const contactSection = document.getElementById('contact');
            if (contactSection) {
                contactSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});