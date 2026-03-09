/**
 * RECON SENTINEL - Storage Module
 * Handles all localStorage operations for settings, history, and presets
 */

const Storage = {
    // Storage keys
    KEYS: {
        API_KEY: 'recon_api_key',
        SETTINGS: 'recon_settings',
        HISTORY: 'recon_history',
        SAVED_PRESETS: 'recon_saved_presets',
        CUSTOM_FILES: 'recon_custom_files',
        SAVED_REPORTS: 'recon_saved_reports',
        AUTH_ACCEPTED: 'recon_auth_accepted'
    },

    /**
     * Initialize storage with defaults
     */
    init() {
        // Set default settings if not exists
        if (!this.get(this.KEYS.SETTINGS)) {
            this.set(this.KEYS.SETTINGS, {
                animations: true,
                sound: false,
                autoSaveReports: true,
                defaultTemplate: 'generic',
                theme: 'dark'
            });
        }

        // Initialize empty arrays if not exists
        if (!this.get(this.KEYS.HISTORY)) {
            this.set(this.KEYS.HISTORY, []);
        }

        if (!this.get(this.KEYS.SAVED_REPORTS)) {
            this.set(this.KEYS.SAVED_REPORTS, []);
        }

        if (!this.get(this.KEYS.CUSTOM_FILES)) {
            this.set(this.KEYS.CUSTOM_FILES, []);
        }
    },

    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @returns {any} Parsed value or null
     */
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error(`Storage.get error for key ${key}:`, e);
            return null;
        }
    },

    /**
     * Set item in localStorage
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @returns {boolean} Success status
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`Storage.set error for key ${key}:`, e);
            return false;
        }
    },

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error(`Storage.remove error for key ${key}:`, e);
        }
    },

    /**
     * Clear all RECON SENTINEL data
     */
    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            this.remove(key);
        });
        this.init();
    },

    // ========================================
    // API Key Management
    // ========================================

    /**
     * Get stored API key
     * @returns {string|null} API key or null
     */
    getApiKey() {
        return this.get(this.KEYS.API_KEY);
    },

    /**
     * Set API key
     * @param {string} key - API key to store
     */
    setApiKey(key) {
        if (key && key.trim()) {
            this.set(this.KEYS.API_KEY, key.trim());
        } else {
            this.remove(this.KEYS.API_KEY);
        }
    },

    // ========================================
    // Settings Management
    // ========================================

    /**
     * Get all settings
     * @returns {object} Settings object
     */
    getSettings() {
        return this.get(this.KEYS.SETTINGS) || {
            animations: true,
            sound: false,
            autoSaveReports: true,
            defaultTemplate: 'generic',
            theme: 'dark'
        };
    },

    /**
     * Update settings
     * @param {object} newSettings - Partial settings to update
     */
    updateSettings(newSettings) {
        const current = this.getSettings();
        this.set(this.KEYS.SETTINGS, { ...current, ...newSettings });
    },

    // ========================================
    // History Management
    // ========================================

    /**
     * Get scan history
     * @returns {array} History array
     */
    getHistory() {
        return this.get(this.KEYS.HISTORY) || [];
    },

    /**
     * Add entry to history
     * @param {object} entry - History entry
     */
    addToHistory(entry) {
        const history = this.getHistory();
        const newEntry = {
            ...entry,
            id: this.generateId(),
            timestamp: new Date().toISOString()
        };
        
        // Keep last 50 entries
        history.unshift(newEntry);
        if (history.length > 50) {
            history.pop();
        }
        
        this.set(this.KEYS.HISTORY, history);
        return newEntry;
    },

    /**
     * Remove entry from history
     * @param {string} id - Entry ID
     */
    removeFromHistory(id) {
        const history = this.getHistory();
        const filtered = history.filter(item => item.id !== id);
        this.set(this.KEYS.HISTORY, filtered);
    },

    /**
     * Clear all history
     */
    clearHistory() {
        this.set(this.KEYS.HISTORY, []);
    },

    // ========================================
    // Custom Files Management
    // ========================================

    /**
     * Get custom file keywords
     * @returns {array} Custom files array
     */
    getCustomFiles() {
        return this.get(this.KEYS.CUSTOM_FILES) || [];
    },

    /**
     * Add custom file keyword
     * @param {string} filename - Filename to add
     */
    addCustomFile(filename) {
        const files = this.getCustomFiles();
        if (filename && !files.includes(filename)) {
            files.push(filename);
            this.set(this.KEYS.CUSTOM_FILES, files);
        }
    },

    /**
     * Remove custom file keyword
     * @param {string} filename - Filename to remove
     */
    removeCustomFile(filename) {
        const files = this.getCustomFiles();
        const filtered = files.filter(f => f !== filename);
        this.set(this.KEYS.CUSTOM_FILES, filtered);
    },

    // ========================================
    // Reports Management
    // ========================================

    /**
     * Get saved reports
     * @returns {array} Saved reports array
     */
    getSavedReports() {
        return this.get(this.KEYS.SAVED_REPORTS) || [];
    },

    /**
     * Save a report
     * @param {object} report - Report to save
     */
    saveReport(report) {
        const reports = this.getSavedReports();
        const newReport = {
            ...report,
            id: this.generateId(),
            savedAt: new Date().toISOString()
        };
        
        reports.unshift(newReport);
        if (reports.length > 100) {
            reports.pop();
        }
        
        this.set(this.KEYS.SAVED_REPORTS, reports);
        return newReport;
    },

    /**
     * Delete a saved report
     * @param {string} id - Report ID
     */
    deleteReport(id) {
        const reports = this.getSavedReports();
        const filtered = reports.filter(r => r.id !== id);
        this.set(this.KEYS.SAVED_REPORTS, filtered);
    },

    // ========================================
    // Authorization
    // ========================================

    /**
     * Check if user has accepted authorization
     * @returns {boolean} Accepted status
     */
    hasAcceptedAuth() {
        return this.get(this.KEYS.AUTH_ACCEPTED) === true;
    },

    /**
     * Set authorization accepted
     */
    setAuthAccepted() {
        this.set(this.KEYS.AUTH_ACCEPTED, true);
    },

    // ========================================
    // Utilities
    // ========================================

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Get storage usage info
     * @returns {object} Storage usage stats
     */
    getStorageInfo() {
        let totalSize = 0;
        const items = {};

        Object.values(this.KEYS).forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                const size = new Blob([item]).size;
                totalSize += size;
                items[key] = size;
            }
        });

        return {
            totalBytes: totalSize,
            totalKB: (totalSize / 1024).toFixed(2),
            items
        };
    },

    /**
     * Export all data as JSON
     * @returns {string} JSON string of all data
     */
    exportData() {
        const data = {};
        Object.entries(this.KEYS).forEach(([name, key]) => {
            // Don't export API key for security
            if (key !== this.KEYS.API_KEY) {
                data[name] = this.get(key);
            }
        });
        return JSON.stringify(data, null, 2);
    },

    /**
     * Import data from JSON
     * @param {string} jsonString - JSON data to import
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            Object.entries(data).forEach(([name, value]) => {
                const key = this.KEYS[name];
                if (key && key !== this.KEYS.API_KEY) {
                    this.set(key, value);
                }
            });
            return true;
        } catch (e) {
            console.error('Import error:', e);
            return false;
        }
    }
};

// Initialize storage on load
Storage.init();
