/**
 * Dabs Store Locator - Google Sheets Integration
 * Connects to Google Sheets to display store locations on an interactive map
 */

// ===================================
// Configuration
// ===================================

const STORE_CONFIG = {
    // REPLACE THIS with your actual Google Sheets configuration
    // Sheet ID is stored securely in Vercel environment variables
    // Data is fetched through /api/stores endpoint
    SHEET_NAME: 'Stores',              // Name of the sheet tab
    
    // How often to refresh data (in milliseconds) - 5 minutes
    REFRESH_INTERVAL: 5 * 60 * 1000,
    
    // Default map center (Albuquerque, NM)
    DEFAULT_CENTER: [35.0844, -106.6504],
    DEFAULT_ZOOM: 7
};

// ===================================
// State Management
// ===================================

let storeData = [];
let map = null;
let markers = [];
let userLocation = null;

// ===================================
// Initialize Store Locator
// ===================================

async function initStoreLocator() {
    console.log('Initializing Dabs Store Locator...');
    
    // Initialize the map
    initMap();
    
    // Load stores from Google Sheets
    await loadStoresFromSheet();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up auto-refresh
    setInterval(loadStoresFromSheet, STORE_CONFIG.REFRESH_INTERVAL);
    
    // Try to get user's location
    getUserLocation();
}

// ===================================
// Map Initialization
// ===================================

function initMap() {
    const mapContainer = document.getElementById('storeMap');
    
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }
    
    // Create the map centered on New Mexico
    map = L.map('storeMap').setView(STORE_CONFIG.DEFAULT_CENTER, STORE_CONFIG.DEFAULT_ZOOM);
    
    // Add tile layer (map visuals)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);
    
    // Custom marker icon (yellow to match brand)
    window.customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
            <div class="marker-pin">
                <svg viewBox="0 0 24 24" fill="#FFB700" stroke="#000000" stroke-width="1">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3" fill="#000000"></circle>
                </svg>
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });
    
    // Remove loading state
    const loadingEl = mapContainer.querySelector('.map-loading');
    if (loadingEl) {
        setTimeout(() => loadingEl.remove(), 500);
    }
}

// ===================================
// Google Sheets Integration
// ===================================

async function loadStoresFromSheet() {
    try {
        console.log('Loading stores from Google Sheet...');
        
        // For demonstration, we'll use sample data
        // REPLACE THIS with actual Google Sheets API call
        const sampleData = await fetchGoogleSheetData();
        
        if (sampleData && sampleData.length > 0) {
            storeData = sampleData;
            displayStores(storeData);
            updateStoreCount(storeData.length);
        }
        
    } catch (error) {
        console.error('Error loading stores:', error);
        showError('Unable to load store locations. Please try again later.');
    }
}

async function fetchGoogleSheetData() {
  const response = await fetch(
    '/api/stores'
  );

  if (!response.ok) {
    throw new Error('Failed to load stores');
  }

  return await response.json();
}


// ===================================
// Display Stores on Map and List
// ===================================

function displayStores(stores) {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Clear existing store cards
    const storeCardsContainer = document.getElementById('storeCards');
    if (storeCardsContainer) {
        storeCardsContainer.innerHTML = '';
    }
    
    // Add markers and cards for each store
    stores.forEach((store, index) => {
        // Add map marker
        const marker = L.marker([store.lat, store.lng], { icon: customIcon })
            .addTo(map)
            .bindPopup(createPopupContent(store));
        
        markers.push(marker);
        
        // Add click handler to marker
        marker.on('click', () => {
            highlightStore(index);
        });
        
        // Add store card to list
        if (storeCardsContainer) {
            const card = createStoreCard(store, index);
            storeCardsContainer.appendChild(card);
        }
    });
    
    // Fit map to show all markers if there are any
    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// ===================================
// Create Popup Content
// ===================================

function createPopupContent(store) {
    return `
        <div class="store-popup">
            <h3>${store.name}</h3>
            <div class="popup-details">
                <p class="popup-address">
                    <strong>📍</strong> ${store.address}<br>
                    ${store.city}, ${store.state} ${store.zip}
                </p>
                <p class="popup-phone">
                    <strong>📞</strong> <a href="tel:${store.phone.replace(/\D/g, '')}">${store.phone}</a>
                </p>
            </div>
            <div class="popup-actions">
                <a href="https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}" 
                   target="_blank" 
                   class="directions-btn">
                    Get Directions →
                </a>
            </div>
        </div>
    `;
}

// ===================================
// Create Store Card
// ===================================

function createStoreCard(store, index) {
    const card = document.createElement('div');
    card.className = 'store-card';
    card.setAttribute('data-index', index);
    
    // Calculate distance if user location is available
    let distanceHtml = '';
    if (userLocation) {
        const distance = calculateDistance(
            userLocation.lat, 
            userLocation.lng, 
            store.lat, 
            store.lng
        );
        distanceHtml = `<span class="store-distance">${distance.toFixed(1)} miles away</span>`;
    }
    
    card.innerHTML = `
        <div class="store-card-header">
            <h3>${store.name}</h3>
            ${distanceHtml}
        </div>
        <div class="store-card-body">
            <p class="store-address">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                ${store.address}<br>
                ${store.city}, ${store.state} ${store.zip}
            </p>
            <p class="store-phone">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <a href="tel:${store.phone.replace(/\D/g, '')}">${store.phone}</a>
            </p>
        </div>
        <div class="store-card-actions">
            <button class="view-on-map-btn" onclick="viewStoreOnMap(${index})">
                View on Map
            </button>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}" 
               target="_blank" 
               class="get-directions-btn">
                Get Directions
            </a>
        </div>
    `;
    
    return card;
}

// ===================================
// Store Interaction Functions
// ===================================

function viewStoreOnMap(index) {
    if (index >= 0 && index < markers.length) {
        const marker = markers[index];
        const store = storeData[index];
        
        // Center map on marker and zoom in
        map.setView([store.lat, store.lng], 15, {
            animate: true,
            duration: 1
        });
        
        // Open popup
        marker.openPopup();
        
        // Highlight the card
        highlightStore(index);
        
        // Scroll to map
        document.getElementById('storeMap').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
}

function highlightStore(index) {
    // Remove previous highlights
    document.querySelectorAll('.store-card').forEach(card => {
        card.classList.remove('highlighted');
    });
    
    // Add highlight to selected card
    const card = document.querySelector(`.store-card[data-index="${index}"]`);
    if (card) {
        card.classList.add('highlighted');
        
        // Scroll card into view if needed
        setTimeout(() => {
            card.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        }, 300);
    }
}

// ===================================
// Filter and Search Functions
// ===================================

function filterByState(state) {
    let filtered = storeData;
    
    if (state) {
        filtered = storeData.filter(store => store.state === state);
    }
    
    displayStores(filtered);
    updateStoreCount(filtered.length);
}

function searchByZip(zip) {
    if (!zip || zip.length !== 5) {
        alert('Please enter a valid 5-digit ZIP code');
        return;
    }
    
    // In a real implementation, you would geocode the ZIP to coordinates
    // For now, we'll filter by exact ZIP match
    const filtered = storeData.filter(store => store.zip === zip);
    
    if (filtered.length === 0) {
        alert('No stores found in that ZIP code. Showing all stores.');
        displayStores(storeData);
        updateStoreCount(storeData.length);
    } else {
        displayStores(filtered);
        updateStoreCount(filtered.length);
        
        // Center map on results
        if (filtered.length > 0) {
            map.setView([filtered[0].lat, filtered[0].lng], 12);
        }
    }
}

// ===================================
// Event Listeners
// ===================================

function setupEventListeners() {
    // State filter
    const stateFilter = document.getElementById('stateFilter');
    if (stateFilter) {
        stateFilter.addEventListener('change', (e) => {
            filterByState(e.target.value);
        });
    }
    
    // ZIP search
    const zipSearchBtn = document.getElementById('zipSearchBtn');
    const zipSearch = document.getElementById('zipSearch');
    
    if (zipSearchBtn && zipSearch) {
        zipSearchBtn.addEventListener('click', () => {
            searchByZip(zipSearch.value.trim());
        });
        
        zipSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchByZip(zipSearch.value.trim());
            }
        });
        
        // Only allow numbers in ZIP input
        zipSearch.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }
}

// ===================================
// Geolocation
// ===================================

function getUserLocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                console.log('User location obtained:', userLocation);
                
                // Refresh display to show distances
                displayStores(storeData);
                
                // Add user marker to map
                L.marker([userLocation.lat, userLocation.lng], {
                    icon: L.divIcon({
                        className: 'user-marker',
                        html: '<div class="user-marker-dot"></div>',
                        iconSize: [20, 20]
                    })
                }).addTo(map).bindPopup('Your Location');
            },
            (error) => {
                console.log('Geolocation error:', error.message);
            }
        );
    }
}

// ===================================
// Utility Functions
// ===================================

function calculateDistance(lat1, lng1, lat2, lng2) {
    // Haversine formula to calculate distance between two points
    const R = 3959; // Earth's radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

function updateStoreCount(count) {
    const countEl = document.getElementById('storeCount');
    if (countEl) {
        countEl.textContent = `${count} store${count !== 1 ? 's' : ''}`;
    }
}

function showError(message) {
    const storeCardsContainer = document.getElementById('storeCards');
    if (storeCardsContainer) {
        storeCardsContainer.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
            </div>
        `;
    }
}

// ===================================
// Initialize when DOM is ready
// ===================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStoreLocator);
} else {
    initStoreLocator();
}

// Make viewStoreOnMap globally accessible
window.viewStoreOnMap = viewStoreOnMap;