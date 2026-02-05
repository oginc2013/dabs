/**
 * Dabs Request System
 * Allows customers to request products at stores near them
 */

// ===================================
// Configuration
// ===================================

const REQUEST_CONFIG = {
    // Vercel API endpoint — all secrets stay in env vars
    API_ENDPOINT: '/api/request'
};

// ===================================
// Request Dabs Modal Class
// ===================================

class RequestDabsModal {
    constructor() {
        this.modal = document.getElementById('requestDabsModal');
        this.openButton = document.getElementById('requestDabsBtn');
        this.closeButton = document.querySelector('.request-modal-close');
        this.form = document.getElementById('requestDabsForm');
        this.submitButton = document.querySelector('.request-submit-btn');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Open modal
        if (this.openButton) {
            this.openButton.addEventListener('click', () => this.open());
        }
        
        // Close modal
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.close());
        }
        
        // Close on overlay click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
        
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    
    open() {
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            city: document.getElementById('requestCity').value.trim(),
            store: document.getElementById('requestStore').value.trim(),
            product: document.getElementById('requestProduct').value,
            email: document.getElementById('requestEmail').value.trim() || 'Not provided',
            instagram: document.getElementById('requestIG').value.trim() || 'Not provided',
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString(),
            status: 'New'
        };
        
        // Validate required fields
        if (!formData.city || !formData.store || !formData.product) {
            alert('Please fill in all required fields (marked with *)');
            return;
        }
        
        // Disable submit button
        this.submitButton.disabled = true;
        this.submitButton.textContent = 'Sending Request...';
        
        try {
            // Submit request
            const success = await this.submitRequest(formData);
            
            if (success) {
                this.showSuccess();
                
                // Reset form after 2 seconds
                setTimeout(() => {
                    this.form.reset();
                    this.close();
                    this.submitButton.disabled = false;
                    this.submitButton.textContent = 'Send Request';
                }, 2500);
            } else {
                throw new Error('Failed to submit request');
            }
            
        } catch (error) {
            console.error('Error submitting request:', error);
            alert('Sorry, there was an error submitting your request. Please try again.');
            this.submitButton.disabled = false;
            this.submitButton.textContent = 'Send Request';
        }
    }
    
    async submitRequest(data) {
        // Local dev fallback — no Vercel API available on file:// or localhost
        const isLocal = location.hostname === '' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        if (isLocal) {
            console.log('DEV MODE — request would be sent to /api/request:', data);
            return true;
        }

        try {
            const response = await fetch(REQUEST_CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            return response.ok;
        } catch (error) {
            console.error('Request submission error:', error);
            return false;
        }
    }
    
    showSuccess() {
        // Replace form with success message
        this.form.innerHTML = `
            <div style="text-align: center; padding: 3rem 2rem;">
                <div style="font-size: 5rem; margin-bottom: 1.5rem;">✅</div>
                <h3 style="font-size: 2rem; font-weight: 800; color: var(--color-secondary); margin-bottom: 1rem;">
                    Request Sent!
                </h3>
                <p style="color: rgba(255, 255, 255, 0.8); font-size: 1.1rem; line-height: 1.6;">
                    Thank you! We'll reach out to the store on your behalf.
                </p>
                <p style="color: rgba(255, 255, 255, 0.6); font-size: 0.95rem; margin-top: 1rem;">
                    We'll notify you when Dabs is available in your area.
                </p>
            </div>
        `;
    }
}

// ===================================
// Request Analytics (Owner Dashboard Data)
// ===================================

class RequestAnalytics {
    constructor() {
        this.requests = [];
    }
    
    async loadRequests() {
        // This would load from your Google Sheet or database
        // For now, we'll return empty array
        return [];
    }
    
    getRequestsByStore() {
        const storeMap = {};
        
        this.requests.forEach(request => {
            const key = `${request.store} - ${request.city}`;
            if (!storeMap[key]) {
                storeMap[key] = 0;
            }
            storeMap[key]++;
        });
        
        return storeMap;
    }
    
    getRequestsByCity() {
        const cityMap = {};
        
        this.requests.forEach(request => {
            if (!cityMap[request.city]) {
                cityMap[request.city] = 0;
            }
            cityMap[request.city]++;
        });
        
        return cityMap;
    }
    
    getMostRequestedProducts() {
        const productMap = {};
        
        this.requests.forEach(request => {
            if (!productMap[request.product]) {
                productMap[request.product] = 0;
            }
            productMap[request.product]++;
        });
        
        // Sort by count
        return Object.entries(productMap)
            .sort((a, b) => b[1] - a[1])
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});
    }
    
    getRequestsThisMonth() {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        
        return this.requests.filter(request => {
            const requestDate = new Date(request.timestamp);
            return requestDate >= firstDay;
        }).length;
    }
}

// ===================================
// Initialize Request System
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Request Modal
    const requestModal = new RequestDabsModal();
    
    // Initialize Analytics (for owner dashboard)
    window.requestAnalytics = new RequestAnalytics();
    
    console.log('📋 Request Dabs system initialized');
});

// ===================================
// Export for dashboard use
// ===================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        RequestAnalytics
    };
}