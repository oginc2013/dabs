/**
 * Dabs Product Requests Dashboard
 * Fetches request data from Google Sheets via Vercel API
 */

class Dashboard {
    constructor() {
        this.requests = [];
        this.filteredRequests = [];
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadData();
    }

    bindEvents() {
        document.getElementById('refreshData').addEventListener('click', () => this.loadData());
        document.getElementById('searchRequests').addEventListener('input', () => this.applyFilters());
        document.getElementById('filterCity').addEventListener('change', () => this.applyFilters());
        document.getElementById('filterProduct').addEventListener('change', () => this.applyFilters());
    }

    async loadData() {
        const refreshBtn = document.getElementById('refreshData');
        refreshBtn.disabled = true;
        refreshBtn.querySelector('svg').style.animation = 'spin 1s linear infinite';

        try {
            const isLocal = location.hostname === '' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';

            if (isLocal) {
                // Demo data for local development
                this.requests = this.getDemoData();
                console.log('DEV MODE — using demo data');
            } else {
                const response = await fetch('/api/requests');
                if (!response.ok) throw new Error('Failed to fetch');
                this.requests = await response.json();
            }

            this.filteredRequests = [...this.requests];
            this.updateStats();
            this.updateCharts();
            this.populateFilters();
            this.renderTable();
            this.updateEmailPreview();
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            document.getElementById('requestsTableBody').innerHTML =
                '<tr><td colspan="6" class="empty-state">Failed to load data. Try refreshing.</td></tr>';
        } finally {
            refreshBtn.disabled = false;
            refreshBtn.querySelector('svg').style.animation = '';
        }
    }

    // ===================================
    // Stats
    // ===================================

    updateStats() {
        const data = this.requests;
        document.getElementById('totalRequests').textContent = data.length;

        // This month
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonth = data.filter(r => {
            const d = new Date(r.timestamp || r.date);
            return d >= firstOfMonth;
        }).length;
        document.getElementById('thisMonthRequests').textContent = thisMonth;

        // Unique stores
        const stores = new Set(data.map(r => r.store));
        document.getElementById('uniqueStores').textContent = stores.size;

        // Unique cities
        const cities = new Set(data.map(r => r.city));
        document.getElementById('uniqueCities').textContent = cities.size;
    }

    // ===================================
    // Charts (CSS bar charts)
    // ===================================

    updateCharts() {
        this.renderBarChart('storeChart', this.countBy('store'));
        this.renderBarChart('cityChart', this.countBy('city'));
        this.renderBarChart('productChart', this.countBy('product'));
    }

    countBy(field) {
        const counts = {};
        this.requests.forEach(r => {
            const key = r[field] || 'Unknown';
            counts[key] = (counts[key] || 0) + 1;
        });
        // Sort descending
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }

    renderBarChart(containerId, data) {
        const container = document.getElementById(containerId);

        if (data.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No data yet</p></div>';
            return;
        }

        const max = data[0][1];
        const html = data.slice(0, 10).map(([label, count]) => {
            const width = Math.max((count / max) * 100, 8);
            return `
                <div class="chart-bar">
                    <div class="chart-bar-label">
                        <span>${this.escapeHtml(label)}</span>
                        <span>${count}</span>
                    </div>
                    <div class="chart-bar-fill" style="width: ${width}%"></div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    // ===================================
    // Filters
    // ===================================

    populateFilters() {
        const cities = [...new Set(this.requests.map(r => r.city))].sort();
        const products = [...new Set(this.requests.map(r => r.product))].sort();

        const citySelect = document.getElementById('filterCity');
        const productSelect = document.getElementById('filterProduct');

        // Preserve current selection
        const currentCity = citySelect.value;
        const currentProduct = productSelect.value;

        citySelect.innerHTML = '<option value="">All Cities</option>' +
            cities.map(c => `<option value="${this.escapeHtml(c)}">${this.escapeHtml(c)}</option>`).join('');

        productSelect.innerHTML = '<option value="">All Products</option>' +
            products.map(p => `<option value="${this.escapeHtml(p)}">${this.escapeHtml(p)}</option>`).join('');

        citySelect.value = currentCity;
        productSelect.value = currentProduct;
    }

    applyFilters() {
        const search = document.getElementById('searchRequests').value.toLowerCase();
        const city = document.getElementById('filterCity').value;
        const product = document.getElementById('filterProduct').value;

        this.filteredRequests = this.requests.filter(r => {
            if (city && r.city !== city) return false;
            if (product && r.product !== product) return false;
            if (search) {
                const haystack = `${r.city} ${r.store} ${r.product} ${r.email} ${r.instagram} ${r.date}`.toLowerCase();
                if (!haystack.includes(search)) return false;
            }
            return true;
        });

        this.renderTable();
    }

    // ===================================
    // Table
    // ===================================

    renderTable() {
        const tbody = document.getElementById('requestsTableBody');

        if (this.filteredRequests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><div class="empty-state-icon">📭</div><p>No requests found</p></td></tr>';
            return;
        }

        // Sort newest first
        const sorted = [...this.filteredRequests].sort((a, b) => {
            return new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date);
        });

        tbody.innerHTML = sorted.map(r => {
            const contact = this.formatContact(r.email, r.instagram);
            const statusClass = r.status === 'New' ? 'status-new' : 'status-contacted';
            return `
                <tr>
                    <td>${this.escapeHtml(r.date)}</td>
                    <td>${this.escapeHtml(r.city)}</td>
                    <td>${this.escapeHtml(r.store)}</td>
                    <td>${this.escapeHtml(r.product)}</td>
                    <td>${contact}</td>
                    <td><span class="status-badge ${statusClass}">${this.escapeHtml(r.status)}</span></td>
                </tr>
            `;
        }).join('');
    }

    formatContact(email, instagram) {
        const parts = [];
        if (email && email !== 'Not provided') {
            parts.push(`<span class="contact-email">${this.escapeHtml(email)}</span>`);
        }
        if (instagram && instagram !== 'Not provided') {
            parts.push(`<span class="contact-ig">@${this.escapeHtml(instagram.replace('@', ''))}</span>`);
        }
        return parts.length > 0 ? parts.join('<br>') : '<span class="contact-none">—</span>';
    }

    // ===================================
    // Email Preview (dynamic)
    // ===================================

    updateEmailPreview() {
        const productCounts = this.countBy('product');
        const list = document.getElementById('emailProductList');
        if (!list) return;

        if (productCounts.length === 0) {
            list.innerHTML = '<li>No requests yet</li>';
            return;
        }

        list.innerHTML = productCounts.slice(0, 5).map(([name, count]) =>
            `<li>${this.escapeHtml(name)} - ${count} request${count !== 1 ? 's' : ''}</li>`
        ).join('');

        // Update the count in the email body
        const countEl = document.querySelector('.highlight-count');
        if (countEl) {
            const now = new Date();
            const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const thisMonth = this.requests.filter(r => new Date(r.timestamp || r.date) >= firstOfMonth).length;
            countEl.textContent = thisMonth;
        }
    }

    // ===================================
    // Demo data for local development
    // ===================================

    getDemoData() {
        const now = new Date();
        return [
            { timestamp: now.toISOString(), city: 'Portland', store: 'Green Leaf Dispensary', product: 'Live Rosin', email: 'demo@test.com', instagram: 'user1', date: now.toLocaleDateString(), status: 'New' },
            { timestamp: now.toISOString(), city: 'Portland', store: 'Green Leaf Dispensary', product: 'All-In-One Vapes', email: 'Not provided', instagram: 'user2', date: now.toLocaleDateString(), status: 'New' },
            { timestamp: now.toISOString(), city: 'Eugene', store: 'Herbal Connection', product: 'Live Rosin', email: 'demo2@test.com', instagram: 'Not provided', date: now.toLocaleDateString(), status: 'New' },
            { timestamp: now.toISOString(), city: 'Bend', store: 'Mountain High', product: 'Badder', email: 'Not provided', instagram: 'dabfan', date: now.toLocaleDateString(), status: 'Contacted' },
            { timestamp: now.toISOString(), city: 'Portland', store: 'Rose City Cannabis', product: 'Live Rosin', email: 'fan@test.com', instagram: 'Not provided', date: now.toLocaleDateString(), status: 'New' },
        ];
    }

    // ===================================
    // Utility
    // ===================================

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Spin animation for refresh button
const style = document.createElement('style');
style.textContent = `
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .status-badge { padding: 0.3rem 0.75rem; border-radius: 50px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-new { background: var(--color-secondary); color: var(--color-primary); }
    .status-contacted { background: rgba(76, 175, 80, 0.2); color: #4CAF50; border: 1px solid rgba(76, 175, 80, 0.4); }
    .contact-email { font-size: 0.85rem; }
    .contact-ig { font-size: 0.85rem; color: var(--color-secondary); }
    .contact-none { color: rgba(255,255,255,0.3); }
`;
document.head.appendChild(style);

// Initialize dashboard
const dashboard = new Dashboard();
