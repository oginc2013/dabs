/**
 * Dabs Strain Carousel
 * Displays all available strains in a swipeable carousel with infinite loop
 */

// ===================================
// Configuration
// ===================================

const CAROUSEL_CONFIG = {
    // Folder where strain images are stored
    STRAINS_FOLDER: 'assets/images/strains/',
    
    // List of strain images (filename = strain name)
    // Add your actual strain images here
    STRAINS: [
        'Hawaiian Sweet Roll',
        'Heat Peaches x Mystery Meat',
        'Honey Icing',
        'Horchata Papaya',
        'Lemon Horchata',
        'Lemon Papaya Banana',
        'Lemon Zprite',
        'Peach Smoothie',
        'Strawberry Peach Pie',
        'Zkittles'
    ],
    
    // Carousel settings
    CARDS_PER_VIEW: 3,
    AUTO_PLAY: true,
    AUTO_PLAY_INTERVAL: 3000, // 3 seconds
    TOUCH_ENABLED: true
};

// ===================================
// Strain Carousel Class
// ===================================

class StrainCarousel {
    constructor() {
        this.track = document.getElementById('strainCarousel');
        this.prevButton = document.querySelector('.carousel-prev');
        this.nextButton = document.querySelector('.carousel-next');
        
        this.currentIndex = 0;
        this.cardWidth = 0;
        this.autoPlayInterval = null;
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.isTransitioning = false;
        
        this.init();
    }
    
    init() {
        // Load strains with clones for infinite scroll
        this.loadStrains();
        
        // Calculate dimensions
        this.calculateDimensions();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start at the first real card (after clones)
        this.currentIndex = CAROUSEL_CONFIG.STRAINS.length;
        this.updateCarousel(false);
        
        // Start auto-play if enabled
        if (CAROUSEL_CONFIG.AUTO_PLAY) {
            this.startAutoPlay();
        }
    }
    
    loadStrains() {
        // Clear existing content
        this.track.innerHTML = '';
        
        // Clone last few cards and add to beginning (for infinite loop)
        const cloneCount = CAROUSEL_CONFIG.CARDS_PER_VIEW;
        for (let i = CAROUSEL_CONFIG.STRAINS.length - cloneCount; i < CAROUSEL_CONFIG.STRAINS.length; i++) {
            const card = this.createStrainCard(CAROUSEL_CONFIG.STRAINS[i], i, true);
            this.track.appendChild(card);
        }
        
        // Add all real cards
        CAROUSEL_CONFIG.STRAINS.forEach((strainName, index) => {
            const card = this.createStrainCard(strainName, index, false);
            this.track.appendChild(card);
        });
        
        // Clone first few cards and add to end (for infinite loop)
        for (let i = 0; i < cloneCount; i++) {
            const card = this.createStrainCard(CAROUSEL_CONFIG.STRAINS[i], i, true);
            this.track.appendChild(card);
        }
    }
    
    createStrainCard(strainName, index, isClone) {
        const card = document.createElement('div');
        card.className = 'strain-card';
        card.setAttribute('data-strain-index', index);
        if (isClone) card.setAttribute('data-clone', 'true');
        
        // Determine strain type (you can customize this logic)
        const types = ['Indica', 'Sativa', 'Hybrid'];
        const strainType = types[Math.floor(Math.random() * types.length)];
        
        // Create image filename from strain name
        const imageFilename = strainName.replace(/ /g, '_') + '.png';
        const imagePath = CAROUSEL_CONFIG.STRAINS_FOLDER + imageFilename;
        
        card.innerHTML = `
            <div class="strain-card-image">
                <img 
                    src="${imagePath}" 
                    alt="${strainName}" 
                    onerror="this.src='assets/images/dabs_packaging.png'"
                >
            </div>
            <h3 class="strain-name">${strainName}</h3>
            <p class="strain-type">${strainType}</p>
        `;
        
        // Add click handler
        card.addEventListener('click', () => this.handleStrainClick(strainName, strainType));
        
        return card;
    }
    
    handleStrainClick(strainName, strainType) {
        // Optional: Show strain details modal
        console.log(`Clicked on ${strainName} (${strainType})`);
        
        // You can add a modal here to show more strain details
    }
    
    calculateDimensions() {
        const cards = this.track.querySelectorAll('.strain-card');
        if (cards.length > 0) {
            const firstCard = cards[0];
            const cardStyle = window.getComputedStyle(firstCard);
            const gap = parseFloat(window.getComputedStyle(this.track).gap);
            
            this.cardWidth = firstCard.offsetWidth + gap;
        }
    }
    
    setupEventListeners() {
        // Previous button
        this.prevButton.addEventListener('click', () => this.prev());
        
        // Next button
        this.nextButton.addEventListener('click', () => this.next());
        
        // Touch events for mobile swipe
        if (CAROUSEL_CONFIG.TOUCH_ENABLED) {
            this.track.addEventListener('touchstart', (e) => this.handleTouchStart(e), {passive: true});
            this.track.addEventListener('touchend', (e) => this.handleTouchEnd(e), {passive: true});
        }
        
        // Listen for transition end to handle infinite loop
        this.track.addEventListener('transitionend', () => this.handleTransitionEnd());
        
        // Recalculate on window resize
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.calculateDimensions();
                this.updateCarousel(false);
            }, 250);
        });
        
        // Pause auto-play on hover
        this.track.addEventListener('mouseenter', () => this.pauseAutoPlay());
        this.track.addEventListener('mouseleave', () => {
            if (CAROUSEL_CONFIG.AUTO_PLAY) {
                this.startAutoPlay();
            }
        });
    }
    
    updateCarousel(animate = true) {
        const offset = -(this.currentIndex * this.cardWidth);
        
        if (!animate) {
            this.track.style.transition = 'none';
        }
        
        this.track.style.transform = `translateX(${offset}px)`;
        
        if (!animate) {
            // Force reflow
            this.track.offsetHeight;
            this.track.style.transition = '';
        }
    }
    
    handleTransitionEnd() {
        this.isTransitioning = false;
        
        const totalCards = CAROUSEL_CONFIG.STRAINS.length;
        const cloneCount = CAROUSEL_CONFIG.CARDS_PER_VIEW;
        
        // If we're at the cloned cards at the end, jump to the real beginning
        if (this.currentIndex >= totalCards + cloneCount) {
            this.currentIndex = cloneCount;
            this.updateCarousel(false);
        }
        
        // If we're at the cloned cards at the beginning, jump to the real end
        if (this.currentIndex < cloneCount) {
            this.currentIndex = totalCards + (this.currentIndex - cloneCount);
            this.updateCarousel(false);
        }
    }
    
    next() {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        this.currentIndex++;
        this.updateCarousel(true);
    }
    
    prev() {
        if (this.isTransitioning) return;
        
        this.isTransitioning = true;
        this.currentIndex--;
        this.updateCarousel(true);
    }
    
    handleTouchStart(e) {
        this.touchStartX = e.changedTouches[0].screenX;
    }
    
    handleTouchEnd(e) {
        this.touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe();
    }
    
    handleSwipe() {
        const swipeThreshold = 50; // Minimum swipe distance
        const diff = this.touchStartX - this.touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swiped left - go to next
                this.next();
            } else {
                // Swiped right - go to previous
                this.prev();
            }
        }
    }
    
    startAutoPlay() {
        this.pauseAutoPlay(); // Clear any existing interval
        this.autoPlayInterval = setInterval(() => {
            this.next();
        }, CAROUSEL_CONFIG.AUTO_PLAY_INTERVAL);
    }
    
    pauseAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
}

// ===================================
// Initialize Carousel
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    const carousel = new StrainCarousel();
    console.log('🎠 Strain Carousel initialized');
});