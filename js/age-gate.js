/**
 * Dabs Age Gate & Email Capture
 * Ensures compliance with cannabis marketing regulations
 */

// ===================================
// Configuration
// ===================================

const AGE_GATE_CONFIG = {
    // How long before showing age gate again (in days)
    COOKIE_EXPIRY_DAYS: 30,  // 30 days = 1 month
    
    // Google Sheets Configuration for Email Capture
    USE_GOOGLE_SHEETS: false,  // Set to true once configured
    SHEET_ID: 'YOUR_EMAIL_SHEET_ID',
    API_KEY: 'YOUR_GOOGLE_API_KEY',
    SHEET_NAME: 'EmailSubscribers',
    
    // Alternative: Webhook URL (recommended for production)
    USE_WEBHOOK: false,
    WEBHOOK_URL: 'YOUR_WEBHOOK_URL',  // e.g., Zapier, Make, n8n
    
    // Main site URL (change this to your actual main page)
    MAIN_SITE_URL: 'main.html',  // or 'index.html' depending on your setup
    
    // Cookie names
    COOKIE_AGE_VERIFIED: 'dabs_age_verified',
    COOKIE_EMAIL_CAPTURED: 'dabs_email_captured'
};

// ===================================
// Cookie Management
// ===================================

function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

// ===================================
// Age Gate Logic
// ===================================

class AgeGate {
    constructor() {
        this.ageGateOverlay = document.getElementById('ageGate');
        this.ageStep = document.getElementById('ageStep');
        this.emailStep = document.getElementById('emailStep');
        this.underAgeModal = document.getElementById('underAgeModal');

        this.yesButton = document.getElementById('ageGateYes');
        this.noButton = document.getElementById('ageGateNo');

        this.init();
    }

    init() {
        // Check if user has already verified age
        const ageVerified = getCookie(AGE_GATE_CONFIG.COOKIE_AGE_VERIFIED);

        if (ageVerified === 'true') {
            // User has verified, go directly to main site
            this.loadMainSite();
        } else {
            // Show age gate
            this.showAgeGate();
        }

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Yes button - user is 21+
        this.yesButton.addEventListener('click', () => this.handleYes());

        // No button - user is under 21
        this.noButton.addEventListener('click', () => this.handleNo());

        // Keyboard accessibility (only on age step)
        document.addEventListener('keydown', (e) => {
            if (this.ageGateOverlay.classList.contains('hidden')) return;
            if (!this.ageStep.classList.contains('active')) return;

            if (e.key === 'y' || e.key === 'Y') {
                this.handleYes();
            } else if (e.key === 'n' || e.key === 'N') {
                this.handleNo();
            }
        });
    }

    handleYes() {
        console.log('User confirmed 21+ age');

        // Set cookie for age verification
        setCookie(
            AGE_GATE_CONFIG.COOKIE_AGE_VERIFIED,
            'true',
            AGE_GATE_CONFIG.COOKIE_EXPIRY_DAYS
        );

        // Check if we should show email capture
        // Only read the functional cookie if consent allows it
        const functionalAllowed = window.cookieConsent && window.cookieConsent.isAllowed('functional');
        const emailCaptured = functionalAllowed ? getCookie(AGE_GATE_CONFIG.COOKIE_EMAIL_CAPTURED) : null;

        if (!emailCaptured) {
            // Swap to email step
            this.showEmailStep();
        } else {
            // Go directly to main site
            this.loadMainSite();
        }
    }

    handleNo() {
        console.log('User is under 21');
        this.hideAgeGate();
        this.showUnderAge();
    }

    showAgeGate() {
        this.ageGateOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    hideAgeGate() {
        this.ageGateOverlay.classList.add('hidden');
    }

    showEmailStep() {
        // Swap steps with animation
        this.ageStep.classList.remove('active');
        this.emailStep.classList.add('active');
    }

    showUnderAge() {
        this.underAgeModal.classList.add('active');
    }

    loadMainSite() {
        window.location.href = AGE_GATE_CONFIG.MAIN_SITE_URL;
    }
}

// ===================================
// Email Capture Logic
// ===================================

class EmailCapture {
    constructor() {
        this.form = document.getElementById('emailCaptureForm');
        this.continueButton = document.getElementById('continueToSiteBtn');
        this.submitButton = document.querySelector('.email-inline-submit');

        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Enter Site button (skip)
        this.continueButton.addEventListener('click', () => this.skipCapture());
    }

    async handleSubmit(e) {
        e.preventDefault();

        const email = document.getElementById('userEmail').value;
        const consentMarketing = document.getElementById('consentMarketing').checked;

        if (!email) {
            alert('Please enter your email address.');
            return;
        }

        if (!consentMarketing) {
            alert('Please check the consent box to subscribe.');
            return;
        }

        // Disable submit button
        this.submitButton.disabled = true;
        this.submitButton.textContent = 'Sending...';

        try {
            const success = await this.saveEmail({
                email: email,
                consentMarketing: consentMarketing,
                consentAge: true,
                timestamp: new Date().toISOString(),
                source: 'age_gate'
            });

            if (success) {
                // Only set functional cookie if consent allows
                if (window.cookieConsent && window.cookieConsent.isAllowed('functional')) {
                    setCookie(
                        AGE_GATE_CONFIG.COOKIE_EMAIL_CAPTURED,
                        'true',
                        AGE_GATE_CONFIG.COOKIE_EXPIRY_DAYS
                    );
                }

                this.showSuccess();

                setTimeout(() => {
                    window.location.href = AGE_GATE_CONFIG.MAIN_SITE_URL;
                }, 1500);
            } else {
                throw new Error('Failed to save email');
            }

        } catch (error) {
            console.error('Error submitting email:', error);
            alert('Sorry, there was an error. Please try again or continue to site.');
            this.submitButton.disabled = false;
            this.submitButton.textContent = 'Subscribe';
        }
    }
    
    async saveEmail(data) {
        // Choose saving method based on configuration
        
        if (AGE_GATE_CONFIG.USE_WEBHOOK) {
            // Method 1: Send to Webhook (RECOMMENDED)
            return await this.saveToWebhook(data);
            
        } else if (AGE_GATE_CONFIG.USE_GOOGLE_SHEETS) {
            // Method 2: Save to Google Sheets
            return await this.saveToGoogleSheets(data);
            
        } else {
            // Development mode - just log to console
            console.log('Email captured (dev mode):', data);
            return true;
        }
    }
    
    async saveToWebhook(data) {
        try {
            const response = await fetch(AGE_GATE_CONFIG.WEBHOOK_URL, {
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
    
    async saveToGoogleSheets(data) {
        // Note: This requires Google Apps Script or backend proxy
        // Direct Google Sheets API from browser has CORS limitations
        
        try {
            // You'll need to create a Google Apps Script endpoint
            // See documentation for setup instructions
            
            const scriptUrl = 'YOUR_GOOGLE_APPS_SCRIPT_URL';
            
            const response = await fetch(scriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            return response.ok;
        } catch (error) {
            console.error('Google Sheets error:', error);
            return false;
        }
    }
    
    showSuccess() {
        this.form.innerHTML = `
            <div style="text-align: center; padding: 1rem 0;">
                <p style="font-size: 1.1rem; font-weight: 800; color: #000;">
                    You're subscribed! Redirecting...
                </p>
            </div>
        `;
        // Hide the Enter Site button since we're redirecting
        this.continueButton.style.display = 'none';
    }
    
    skipCapture() {
        // User chose to skip email capture
        console.log('User skipped email capture or continued to site');

        // Only set functional cookie if consent allows
        if (window.cookieConsent && window.cookieConsent.isAllowed('functional')) {
            setCookie(
                AGE_GATE_CONFIG.COOKIE_EMAIL_CAPTURED,
                'skipped',
                AGE_GATE_CONFIG.COOKIE_EXPIRY_DAYS
            );
        }

        // Go to main site
        window.location.href = AGE_GATE_CONFIG.MAIN_SITE_URL;
    }
}

// ===================================
// Initialize on Page Load
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Age Gate
    const ageGate = new AgeGate();
    
    // Initialize Email Capture
    const emailCapture = new EmailCapture();
    
    console.log('🔒 Dabs Age Gate initialized');
    console.log('Main site URL:', AGE_GATE_CONFIG.MAIN_SITE_URL);
});

// ===================================
// Utility Functions for Testing
// ===================================

// Reset all cookies (for testing)
window.resetAgeGate = function() {
    deleteCookie(AGE_GATE_CONFIG.COOKIE_AGE_VERIFIED);
    deleteCookie(AGE_GATE_CONFIG.COOKIE_EMAIL_CAPTURED);
    console.log('Age gate cookies cleared. Refresh to see age gate again.');
    location.reload();
};

// Check current cookie status
window.checkAgeGateStatus = function() {
    console.log('Age Verified:', getCookie(AGE_GATE_CONFIG.COOKIE_AGE_VERIFIED));
    console.log('Email Captured:', getCookie(AGE_GATE_CONFIG.COOKIE_EMAIL_CAPTURED));
    console.log('Will redirect to:', AGE_GATE_CONFIG.MAIN_SITE_URL);
};