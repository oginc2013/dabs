/**
 * Cookie Consent Manager
 * Handles GDPR / CCPA / ePrivacy compliance for cookie usage.
 *
 * Cookie categories:
 *   - necessary:   Age verification, cookie consent choice (always on, cannot be disabled)
 *   - functional:  Email capture preference, UI preferences
 *   - analytics:   Analytics & tracking (if added in future)
 *
 * The consent state is stored in a single cookie: dabs_cookie_consent
 * Value is a JSON string: { necessary: true, functional: true|false, analytics: true|false }
 */

const COOKIE_CONSENT_CONFIG = {
    COOKIE_NAME: 'dabs_cookie_consent',
    COOKIE_DAYS: 365
};

class CookieConsent {
    constructor() {
        this.banner = document.getElementById('cookieBanner');
        this.modal = document.getElementById('cookieModal');
        this.consent = this.loadConsent();

        this.init();
    }

    init() {
        if (!this.consent) {
            // No consent recorded yet — show banner
            setTimeout(() => this.showBanner(), 600);
        }
        this.setupEventListeners();
    }

    // ---------------------------
    // Consent persistence
    // ---------------------------

    loadConsent() {
        const raw = this.getRawCookie(COOKIE_CONSENT_CONFIG.COOKIE_NAME);
        if (!raw) return null;
        try {
            return JSON.parse(decodeURIComponent(raw));
        } catch {
            return null;
        }
    }

    saveConsent(consent) {
        this.consent = consent;
        const val = encodeURIComponent(JSON.stringify(consent));
        const date = new Date();
        date.setTime(date.getTime() + COOKIE_CONSENT_CONFIG.COOKIE_DAYS * 86400000);
        document.cookie = `${COOKIE_CONSENT_CONFIG.COOKIE_NAME}=${val};expires=${date.toUTCString()};path=/;SameSite=Strict`;
    }

    getRawCookie(name) {
        const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
        return match ? match[1] : null;
    }

    // ---------------------------
    // Public API
    // ---------------------------

    /** Check whether a category has been consented to */
    isAllowed(category) {
        if (category === 'necessary') return true; // always allowed
        if (!this.consent) return false;
        return !!this.consent[category];
    }

    // ---------------------------
    // UI
    // ---------------------------

    showBanner() {
        this.banner.classList.add('visible');
    }

    hideBanner() {
        this.banner.classList.remove('visible');
    }

    showModal() {
        // Sync toggles with current state
        const funcToggle = document.getElementById('toggleFunctional');
        const analyticsToggle = document.getElementById('toggleAnalytics');
        if (funcToggle) funcToggle.checked = this.consent ? this.consent.functional : true;
        if (analyticsToggle) analyticsToggle.checked = this.consent ? this.consent.analytics : false;

        this.modal.classList.add('visible');
    }

    hideModal() {
        this.modal.classList.remove('visible');
    }

    // ---------------------------
    // Actions
    // ---------------------------

    acceptAll() {
        this.saveConsent({ necessary: true, functional: true, analytics: true });
        this.hideBanner();
        this.hideModal();
    }

    rejectNonEssential() {
        this.saveConsent({ necessary: true, functional: false, analytics: false });
        this.hideBanner();
        this.hideModal();
        this.removeNonEssentialCookies();
    }

    savePreferences() {
        const funcToggle = document.getElementById('toggleFunctional');
        const analyticsToggle = document.getElementById('toggleAnalytics');
        this.saveConsent({
            necessary: true,
            functional: funcToggle ? funcToggle.checked : false,
            analytics: analyticsToggle ? analyticsToggle.checked : false
        });
        this.hideBanner();
        this.hideModal();

        if (!this.consent.functional) {
            this.removeNonEssentialCookies();
        }
    }

    removeNonEssentialCookies() {
        // Remove functional cookies if consent was withdrawn
        const nonEssential = ['dabs_email_captured'];
        nonEssential.forEach(name => {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
        });
    }

    // ---------------------------
    // Events
    // ---------------------------

    setupEventListeners() {
        // Banner buttons
        const acceptBtn = document.getElementById('cookieAcceptAll');
        const rejectBtn = document.getElementById('cookieRejectAll');
        const manageBtn = document.getElementById('cookieManage');

        if (acceptBtn) acceptBtn.addEventListener('click', () => this.acceptAll());
        if (rejectBtn) rejectBtn.addEventListener('click', () => this.rejectNonEssential());
        if (manageBtn) manageBtn.addEventListener('click', () => this.showModal());

        // Modal buttons
        const modalSave = document.getElementById('cookieModalSave');
        const modalAccept = document.getElementById('cookieModalAcceptAll');

        if (modalSave) modalSave.addEventListener('click', () => this.savePreferences());
        if (modalAccept) modalAccept.addEventListener('click', () => this.acceptAll());

        // Close modal on overlay click
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.hideModal();
            });
        }
    }
}

// ---------------------------
// Singleton — accessible from other scripts via window.cookieConsent
// ---------------------------
document.addEventListener('DOMContentLoaded', () => {
    window.cookieConsent = new CookieConsent();
});
