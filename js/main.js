/**
 * Dabs Cannabis Brand Website - Main JavaScript
 * Handles animations, interactions, and mobile menu functionality
 */

// ===================================
// Utility Functions
// ===================================

/**
 * Debounce function to limit function calls
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Check if element is in viewport
 */
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// ===================================
// Mobile Menu Toggle
// ===================================

const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
        
        // Animate menu icon
        const spans = mobileMenuToggle.querySelectorAll('span');
        if (mobileMenuToggle.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
}

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            navLinks.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
            const spans = mobileMenuToggle.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
});

// ===================================
// Smooth Scroll for Navigation Links
// ===================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = targetElement.offsetTop - navbarHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===================================
// Navbar Background on Scroll
// ===================================

const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', debounce(() => {
    const currentScroll = window.pageYOffset;
    
    // Add solid background when scrolled
    if (currentScroll > 100) {
        navbar.style.background = 'rgba(0, 0, 0, 0.98)';
        navbar.style.boxShadow = '0 5px 20px rgba(255, 183, 0, 0.2)';
    } else {
        navbar.style.background = 'rgba(0, 0, 0, 0.95)';
        navbar.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
}, 10));

// ===================================
// Intersection Observer for Animations
// ===================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Apply fade-in animation to sections
document.querySelectorAll('.product-card, .section-title, .highlight-content').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    fadeInObserver.observe(el);
});

// ===================================
// Product Card Interactions
// ===================================

const productCards = document.querySelectorAll('.product-card');

productCards.forEach(card => {
    // Add tilt effect on mouse move
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
    
    // Add click ripple effect
    card.addEventListener('click', function(e) {
        const ripple = document.createElement('div');
        ripple.classList.add('ripple');
        this.appendChild(ripple);
        
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 183, 0, 0.4)';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'rippleEffect 0.6s ease-out';
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// Add ripple animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes rippleEffect {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    @media (max-width: 768px) {
        .nav-links {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.98);
            flex-direction: column;
            padding: 2rem;
            gap: 1.5rem;
            transform: translateY(-100%);
            opacity: 0;
            pointer-events: none;
            transition: all 0.3s ease-out;
        }
        
        .nav-links.active {
            transform: translateY(0);
            opacity: 1;
            pointer-events: all;
        }
    }
`;
document.head.appendChild(style);

// ===================================
// CTA Button Interaction
// ===================================

const ctaButtons = document.querySelectorAll('.cta-button:not(:disabled)');

ctaButtons.forEach(button => {
    button.addEventListener('click', function(e) {
        // Check if this is the "Get Dabs" button in hero section
        if (this.textContent.includes('Get Dabs')) {
            e.preventDefault();
            
            // Scroll to store locator section
            const storesSection = document.getElementById('stores');
            if (storesSection) {
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = storesSection.offsetTop - navbarHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// ===================================
// Dynamic Particle Generation
// ===================================

function createParticles() {
    const particlesContainer = document.querySelector('.particles');
    if (!particlesContainer) return;
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 8 + 2 + 'px';
        particle.style.height = particle.style.width;
        particle.style.borderRadius = '50%';
        particle.style.background = 'var(--color-secondary)';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.opacity = Math.random() * 0.3 + 0.1;
        particle.style.animation = `float ${Math.random() * 5 + 5}s infinite ease-in-out`;
        particle.style.animationDelay = Math.random() * 3 + 's';
        
        particlesContainer.appendChild(particle);
    }
}

// Initialize particles on load
window.addEventListener('load', createParticles);

// ===================================
// Scroll Progress Indicator (Optional)
// ===================================

function updateScrollProgress() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    
    // You can add a progress bar element if desired
    // For now, we'll just log it
    // console.log('Scroll progress:', scrolled + '%');
}

window.addEventListener('scroll', debounce(updateScrollProgress, 50));

// ===================================
// Image Lazy Loading Enhancement
// ===================================

if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
        img.src = img.src;
    });
} else {
    // Fallback for browsers that don't support lazy loading
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(script);
}

// ===================================
// Console Easter Egg
// ===================================

console.log('%c🔥 Dabs - High-Potency Cannabis Extract 🔥', 
    'font-size: 20px; font-weight: bold; color: #FFB700; background: #000; padding: 10px;'
);
console.log('%cLooking for a career in cannabis tech? Hit us up!', 
    'font-size: 14px; color: #FFB700;'
);

// ===================================
// Performance Monitoring
// ===================================

window.addEventListener('load', () => {
    // Log page load time
    const loadTime = window.performance.timing.domContentLoadedEventEnd - 
                    window.performance.timing.navigationStart;
    console.log(`Page loaded in ${loadTime}ms`);
});

// ===================================
// Age Verification (Optional - for production)
// ===================================

function showAgeVerification() {
    // Check if user has already verified age
    const ageVerified = localStorage.getItem('ageVerified');
    
    if (!ageVerified) {
        // In production, implement a proper age gate modal
        // For now, just a simple confirmation
        const over21 = confirm('This website is for adults 21+ only. Are you 21 or older?');
        
        if (over21) {
            localStorage.setItem('ageVerified', 'true');
        } else {
            // Redirect to age restriction page
            document.body.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 2rem;"><div><h1 style="color: var(--color-secondary); margin-bottom: 1rem;">You must be 21+ to view this site</h1><p>Come back when you\'re older!</p></div></div>';
        }
    }
}

// Uncomment the line below to enable age verification in production
// showAgeVerification();

// ===================================
// Product Modal Functionality
// ===================================

// Product data with details for each product
const productData = {
    'live-rosin': {
        title: 'Live Rosin',
        badge: 'Premium Extract',
        description: 'Our signature Live Rosin is crafted from fresh-frozen cannabis flowers, preserving the full spectrum of cannabinoids and terpenes. Experience unmatched flavor and potency in every dab.',
        features: [
            'Fresh-frozen whole plant extraction',
            'Solventless process - no chemicals',
            'Full-spectrum cannabinoid profile',
            'Rich terpene preservation',
            'Available in multiple strains',
            'Lab-tested for purity and potency'
        ],
        images: [
            'assets/images/live_rosin.png',
            'assets/images/dabs_packaging.png'
        ]
    },
    'all-in-ones': {
        title: 'All-In-Ones',
        badge: 'Convenient & Portable',
        description: 'Premium live rosin in a convenient all-in-one vape. No setup, no mess - just pure, potent vapor on the go. Perfect for those who want quality without compromise.',
        features: [
            'Pre-filled with live rosin concentrate',
            'Rechargeable battery included',
            'Draw-activated - no buttons',
            'Discreet and portable design',
            '1 gram capacity',
            'Multiple strain options available'
        ],
        images: [
            'assets/images/aio.png'
        ]
    },
    'baller-jars': {
        title: 'Live Rosin Baller Jars 14G',
        badge: 'Bulk Premium',
        description: 'For the serious concentrate connoisseur. Our 14-gram baller jars offer exceptional value without sacrificing quality. Stock up on your favorite strains and experience consistent, premium live rosin.',
        features: [
            'Bulk 14-gram quantity',
            'Best value for regular consumers',
            'Same premium quality as smaller sizes',
            'Airtight preservation container',
            'Perfect for sharing or extended use',
            'Multiple strain selections'
        ],
        images: [
            'assets/images/live_rosin2.png',
            'assets/images/dabs_packaging.png'
        ]
    }
};

// Initialize modal functionality
function initProductModal() {
    // Get modal elements
    const modal = document.getElementById('productModal');
    
    if (!modal) {
        console.error('Product modal not found');
        return;
    }
    
    const modalOverlay = modal.querySelector('.modal-overlay');
    const modalClose = modal.querySelector('.modal-close');
    const modalTitle = document.getElementById('modalTitle');
    const modalBadge = document.getElementById('modalBadge');
    const modalDescription = document.getElementById('modalDescription');
    const modalFeatures = document.getElementById('modalFeatures');
    const modalImageGallery = document.getElementById('modalImageGallery');
    
    // Function to open modal with product data
    function openProductModal(productType) {
        const product = productData[productType];
        
        if (!product) {
            console.error('Product not found:', productType);
            return;
        }
        
        console.log('Opening modal for:', productType);
        
        // Populate modal content
        modalTitle.textContent = product.title;
        modalBadge.textContent = product.badge;
        modalDescription.textContent = product.description;
        
        // Clear and populate features
        modalFeatures.innerHTML = '';
        product.features.forEach(feature => {
            const li = document.createElement('li');
            li.textContent = feature;
            modalFeatures.appendChild(li);
        });
        
        // Clear and populate image gallery
        modalImageGallery.innerHTML = '';
        product.images.forEach(imagePath => {
            const img = document.createElement('img');
            img.src = imagePath;
            img.alt = product.title;
            img.loading = 'lazy';
            modalImageGallery.appendChild(img);
        });
        
        // Show modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    
    // Function to close modal
    function closeProductModal() {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
    
    // Get all product cards
    const allProductCards = document.querySelectorAll('.product-card');
    console.log('Found product cards:', allProductCards.length);
    
    // Add click event to all product cards
    allProductCards.forEach(card => {
        card.style.cursor = 'pointer'; // Make sure cursor shows it's clickable
        
        card.addEventListener('click', function(e) {
            e.preventDefault();
            const productType = this.getAttribute('data-product');
            console.log('Card clicked:', productType);
            openProductModal(productType);
        });
        
        // Add keyboard accessibility
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `View details for ${this.querySelector('.card-title').textContent}`);
        
        card.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const productType = this.getAttribute('data-product');
                openProductModal(productType);
            }
        });
    });
    
    // Close modal on X button click
    if (modalClose) {
        modalClose.addEventListener('click', closeProductModal);
    }
    
    // Close modal on overlay click
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeProductModal);
    }
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeProductModal();
        }
    });
    
    // Prevent modal content clicks from closing modal
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

// Initialize modal when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductModal);
} else {
    initProductModal();
}

// ===================================
// Export for potential module use
// ===================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        debounce,
        isInViewport
    };
}