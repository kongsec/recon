/**
 * RECON SENTINEL - Main Application Controller
 * Orchestrates all modules, handles events, and manages hunt flow
 */

const App = {
    // Application state
    state: {
        isInitialized: false,
        isHunting: false,
        currentDomain: '',
        currentResults: [],
        selectedResult: null,
        currentAnalysis: null,
        currentReport: null,
        selectedFiles: new Set(),
        customFiles: []
    },

    // File presets organized by category
    presets: {
        'Config Files': [
            'config.js', 'config.json', 'app.config.js', 'client-config.js',
            'public-config.js', 'site-config.js', 'web-config.json'
        ],
        'Environment': [
            'env.js', 'env.json', '.env.js', 'environment.js', 'constants.js'
        ],
        'API & Endpoints': [
            'api.js', 'api-config.js', 'endpoints.js', 'routes.js', 'services.js'
        ],
        'Cloud & Firebase': [
            'firebase-config.js', 'aws-exports.js', 'cloud-config.js', 'gcp-config.js'
        ],
        'Build Artifacts': [
            'main.js', 'app.js', 'bundle.js', 'vendor.js', 'runtime.js', 'chunk.js'
        ],
        'Framework Configs': [
            'nuxt.config.js', 'next.config.js', 'vite.config.js', 'webpack.config.js'
        ],
        'Sensitive Patterns': [
            'secrets.js', 'credentials.js', 'auth.js', 'keys.js', 'tokens.js'
        ],
        'Manifests': [
            'manifest.json', 'package.json', 'metadata.json', 'settings.json'
        ],
        'Initialization': [
            'init.js', 'bootstrap.js', 'startup.js', 'setup.js', 'index.js'
        ]
    },

    /**
     * Initialize the application
     */
    async init() {
        console.log('[App] Initializing RECON SENTINEL...');

        try {
            // Show boot sequence
            await this.playBootSequence();

            // Check authorization
            if (!Storage.isAuthAccepted()) {
                this.showAuthGate();
            } else {
                this.hideAuthGate();
                this.showMainInterface();
            }

            // Initialize UI
            UI.init();

            // Setup event listeners
            this.setupEventListeners();

            // Load settings
            this.loadSettings();

            // Load custom files
            this.loadCustomFiles();

            // Render presets
            this.renderPresets();

            // Check for API key
            this.checkApiKey();

            // Mark as initialized
            this.state.isInitialized = true;

            UI.log('RECON SENTINEL initialized', 'system');
            UI.log('Ready for authorized security research', 'info');

        } catch (error) {
            console.error('[App] Initialization error:', error);
            UI.showToast('Initialization error. Please refresh.', 'error');
        }
    },

    /**
     * Play boot sequence animation
     */
    async playBootSequence() {
        const bootOverlay = document.getElementById('bootSequence');
        if (!bootOverlay) return;

        const progressBar = bootOverlay.querySelector('.boot-progress-fill');
        const statusText = bootOverlay.querySelector('.boot-status');
        const logContainer = bootOverlay.querySelector('.boot-log');

        const bootSteps = [
            { progress: 10, status: 'Initializing core systems...', log: '[BOOT] Core systems online' },
            { progress: 25, status: 'Loading heuristics engine...', log: '[BOOT] Heuristics engine loaded' },
            { progress: 40, status: 'Configuring URLScan interface...', log: '[BOOT] URLScan API interface ready' },
            { progress: 55, status: 'Loading report templates...', log: '[BOOT] Report generator online' },
            { progress: 70, status: 'Initializing UI components...', log: '[BOOT] UI components loaded' },
            { progress: 85, status: 'Running security checks...', log: '[BOOT] Security validation passed' },
            { progress: 95, status: 'Finalizing startup...', log: '[BOOT] All systems nominal' },
            { progress: 100, status: 'RECON SENTINEL ONLINE', log: '[BOOT] Startup complete' }
        ];

        for (const step of bootSteps) {
            await this.delay(250 + Math.random() * 150);

            if (progressBar) {
                progressBar.style.width = `${step.progress}%`;
            }
            if (statusText) {
                statusText.textContent = step.status;
            }
            if (logContainer) {
                const logLine = document.createElement('div');
                logLine.className = 'boot-log-line';
                logLine.textContent = step.log;
                logContainer.appendChild(logLine);
                logContainer.scrollTop = logContainer.scrollHeight;
            }
        }

        // Fade out boot sequence
        await this.delay(500);
        bootOverlay.classList.add('boot-complete');
        
        await this.delay(500);
        bootOverlay.style.display = 'none';
    },

    /**
     * Show authorization gate
     */
    showAuthGate() {
        const authGate = document.getElementById('authGate');
        if (authGate) {
            authGate.classList.add('active');
        }
    },

    /**
     * Hide authorization gate
     */
    hideAuthGate() {
        const authGate = document.getElementById('authGate');
        if (authGate) {
            authGate.classList.remove('active');
        }
    },

    /**
     * Show main interface
     */
    showMainInterface() {
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.classList.add('active');
        }
    },

    /**
     * Accept authorization
     */
    acceptAuthorization() {
        const checkbox = document.getElementById('authConfirm');
        if (!checkbox || !checkbox.checked) {
            UI.shake('#authConfirm');
            UI.showToast('Please confirm you understand the terms', 'warning');
            return;
        }

        Storage.setAuthAccepted(true);
        this.hideAuthGate();
        this.showMainInterface();
        
        UI.log('Authorization accepted - Tool activated', 'success');
        UI.showToast('Welcome to RECON SENTINEL', 'success');
    },

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Authorization gate
        const authBtn = document.getElementById('authAcceptBtn');
        if (authBtn) {
            authBtn.addEventListener('click', () => this.acceptAuthorization());
        }

        // Hunt button
        const huntBtn = document.getElementById('huntBtn');
        if (huntBtn) {
            huntBtn.addEventListener('click', () => this.startHunt());
        }

        // Clear button
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearHunt());
        }

        // Domain input
        const domainInput = document.getElementById('targetDomain');
        if (domainInput) {
            domainInput.addEventListener('input', UI.debounce((e) => {
                this.validateDomain(e.target.value);
            }, 300));

            domainInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.startHunt();
                }
            });
        }

        // Custom file input
        const customFileInput = document.getElementById('customFile');
        const addCustomFileBtn = document.getElementById('addCustomFileBtn');
        if (customFileInput && addCustomFileBtn) {
            addCustomFileBtn.addEventListener('click', () => {
                this.addCustomFile(customFileInput.value);
                customFileInput.value = '';
            });

            customFileInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addCustomFile(customFileInput.value);
                    customFileInput.value = '';
                }
            });
        }

        // Select/deselect all
        const selectAllBtn = document.getElementById('selectAllBtn');
        const deselectAllBtn = document.getElementById('deselectAllBtn');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.selectAllFiles());
        }
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => this.deselectAllFiles());
        }

        // Results container - delegated events
        const resultsContainer = document.getElementById('resultsContainer');
        if (resultsContainer) {
            resultsContainer.addEventListener('click', (e) => {
                const card = e.target.closest('.result-card');
                if (!card) return;

                const action = e.target.closest('[data-action]');
                if (action) {
                    const actionType = action.dataset.action;
                    const uuid = card.dataset.uuid;
                    this.handleResultAction(actionType, uuid);
                }
            });
        }

        // Navigation buttons
        document.querySelectorAll('[data-nav]').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.nav;
                this.navigateTo(target);
            });
        });

        // Modal triggers
        document.querySelectorAll('[data-modal]').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.modal;
                UI.openModal(modalId);
            });
        });

        // Settings form
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }

        // API key input
        const apiKeyInput = document.getElementById('apiKeyInput');
        const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
        if (apiKeyInput && saveApiKeyBtn) {
            saveApiKeyBtn.addEventListener('click', () => {
                this.saveApiKey(apiKeyInput.value);
            });
        }

        // Clear API key
        const clearApiKeyBtn = document.getElementById('clearApiKeyBtn');
        if (clearApiKeyBtn) {
            clearApiKeyBtn.addEventListener('click', () => {
                this.clearApiKey();
            });
        }

        // Report generation
        const generateReportBtn = document.getElementById('generateReportBtn');
        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', () => this.generateReport());
        }

        // Report actions
        const copyReportBtn = document.getElementById('copyReportBtn');
        const downloadMdBtn = document.getElementById('downloadMdBtn');
        const downloadTxtBtn = document.getElementById('downloadTxtBtn');
        const downloadJsonBtn = document.getElementById('downloadJsonBtn');

        if (copyReportBtn) {
            copyReportBtn.addEventListener('click', () => this.copyReport());
        }
        if (downloadMdBtn) {
            downloadMdBtn.addEventListener('click', () => this.downloadReport('md'));
        }
        if (downloadTxtBtn) {
            downloadTxtBtn.addEventListener('click', () => this.downloadReport('txt'));
        }
        if (downloadJsonBtn) {
            downloadJsonBtn.addEventListener('click', () => this.downloadReport('json'));
        }

        // Report template selection
        const templateSelect = document.getElementById('reportTemplate');
        if (templateSelect) {
            templateSelect.addEventListener('change', () => {
                if (this.state.currentAnalysis) {
                    this.generateReport();
                }
            });
        }

        // History actions
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        }

        // Query copy
        const copyQueriesBtn = document.getElementById('copyQueriesBtn');
        if (copyQueriesBtn) {
            copyQueriesBtn.addEventListener('click', () => this.copyAllQueries());
        }

        // Inspector modal close
        const inspectorModal = document.getElementById('inspectorModal');
        if (inspectorModal) {
            const closeBtn = inspectorModal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => UI.closeModal('inspectorModal'));
            }
        }
    },

    /**
     * Render file presets
     */
    renderPresets() {
        const container = document.getElementById('presetsContainer');
        if (!container) return;

        container.innerHTML = '';

        // Render each category
        Object.entries(this.presets).forEach(([category, files]) => {
            const categoryEl = document.createElement('div');
            categoryEl.className = 'preset-category';

            categoryEl.innerHTML = `
                <div class="preset-category-header">
                    <span class="preset-category-name">${category}</span>
                    <span class="preset-category-count">${files.length}</span>
                </div>
                <div class="preset-category-files">
                    ${files.map(file => `
                        <label class="preset-option">
                            <input type="checkbox" value="${file}" ${this.state.selectedFiles.has(file) ? 'checked' : ''}>
                            <span class="preset-checkbox"></span>
                            <span class="preset-filename">${file}</span>
                        </label>
                    `).join('')}
                </div>
            `;

            // Toggle category
            const header = categoryEl.querySelector('.preset-category-header');
            header.addEventListener('click', () => {
                categoryEl.classList.toggle('collapsed');
            });

            // Handle checkbox changes
            categoryEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.addEventListener('change', () => {
                    if (cb.checked) {
                        this.state.selectedFiles.add(cb.value);
                    } else {
                        this.state.selectedFiles.delete(cb.value);
                    }
                    this.updateSelectedCount();
                    this.updateQueries();
                });
            });

            container.appendChild(categoryEl);
        });

        // Render custom files if any
        this.renderCustomFiles();
    },

    /**
     * Render custom files section
     */
    renderCustomFiles() {
        const container = document.getElementById('customFilesContainer');
        if (!container) return;

        container.innerHTML = '';

        if (this.state.customFiles.length === 0) {
            container.innerHTML = '<div class="empty-custom">No custom files added</div>';
            return;
        }

        this.state.customFiles.forEach(file => {
            const fileEl = document.createElement('div');
            fileEl.className = 'custom-file-item';
            fileEl.innerHTML = `
                <label class="preset-option">
                    <input type="checkbox" value="${file}" ${this.state.selectedFiles.has(file) ? 'checked' : ''}>
                    <span class="preset-checkbox"></span>
                    <span class="preset-filename">${file}</span>
                </label>
                <button class="btn btn-icon btn-sm" data-remove="${file}" title="Remove">×</button>
            `;

            // Handle checkbox
            const cb = fileEl.querySelector('input[type="checkbox"]');
            cb.addEventListener('change', () => {
                if (cb.checked) {
                    this.state.selectedFiles.add(cb.value);
                } else {
                    this.state.selectedFiles.delete(cb.value);
                }
                this.updateSelectedCount();
                this.updateQueries();
            });

            // Handle remove
            const removeBtn = fileEl.querySelector('[data-remove]');
            removeBtn.addEventListener('click', () => {
                this.removeCustomFile(file);
            });

            container.appendChild(fileEl);
        });
    },

    /**
     * Add custom file
     */
    addCustomFile(filename) {
        filename = filename.trim();
        if (!filename) return;

        // Validate filename
        if (!/^[\w\-\.]+$/.test(filename)) {
            UI.showToast('Invalid filename format', 'error');
            return;
        }

        if (this.state.customFiles.includes(filename)) {
            UI.showToast('File already exists', 'warning');
            return;
        }

        this.state.customFiles.push(filename);
        this.state.selectedFiles.add(filename);
        Storage.addCustomFile(filename);

        this.renderCustomFiles();
        this.updateSelectedCount();
        this.updateQueries();

        UI.log(`Custom file added: ${filename}`, 'info');
        UI.showToast(`Added: ${filename}`, 'success');
    },

    /**
     * Remove custom file
     */
    removeCustomFile(filename) {
        this.state.customFiles = this.state.customFiles.filter(f => f !== filename);
        this.state.selectedFiles.delete(filename);
        Storage.removeCustomFile(filename);

        this.renderCustomFiles();
        this.updateSelectedCount();
        this.updateQueries();

        UI.log(`Custom file removed: ${filename}`, 'info');
    },

    /**
     * Load custom files from storage
     */
    loadCustomFiles() {
        this.state.customFiles = Storage.getCustomFiles();
    },

    /**
     * Select all files
     */
    selectAllFiles() {
        document.querySelectorAll('#presetsContainer input[type="checkbox"]').forEach(cb => {
            cb.checked = true;
            this.state.selectedFiles.add(cb.value);
        });

        this.state.customFiles.forEach(f => this.state.selectedFiles.add(f));

        this.renderCustomFiles();
        this.updateSelectedCount();
        this.updateQueries();
    },

    /**
     * Deselect all files
     */
    deselectAllFiles() {
        document.querySelectorAll('#presetsContainer input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });

        this.state.selectedFiles.clear();
        this.renderCustomFiles();
        this.updateSelectedCount();
        this.updateQueries();
    },

    /**
     * Update selected files count
     */
    updateSelectedCount() {
        const countEl = document.getElementById('selectedCount');
        if (countEl) {
            countEl.textContent = `${this.state.selectedFiles.size} selected`;
        }
    },

    /**
     * Update query preview
     */
    updateQueries() {
        const domain = document.getElementById('targetDomain')?.value.trim() || 'example.com';
        const urlKeyword = document.getElementById('urlKeyword')?.value.trim() || '';
        const container = document.getElementById('queryPreview');

        if (!container) return;

        if (this.state.selectedFiles.size === 0) {
            container.innerHTML = '<div class="empty-queries">Select files to generate queries</div>';
            return;
        }

        const queries = URLScan.generateQueries(domain, Array.from(this.state.selectedFiles), urlKeyword);
        
        container.innerHTML = queries.map(q => `
            <div class="query-item">
                <code class="query-text">${UI.escapeHtml(q.query)}</code>
                <button class="btn btn-icon btn-sm" data-copy="${q.query}" title="Copy">📋</button>
            </div>
        `).join('');

        // Handle copy buttons
        container.querySelectorAll('[data-copy]').forEach(btn => {
            btn.addEventListener('click', () => {
                UI.copyToClipboard(btn.dataset.copy);
            });
        });
    },

    /**
     * Copy all queries
     */
    copyAllQueries() {
        const domain = document.getElementById('targetDomain')?.value.trim() || '';
        const urlKeyword = document.getElementById('urlKeyword')?.value.trim() || '';

        if (!domain) {
            UI.showToast('Please enter a target domain', 'warning');
            return;
        }

        const queries = URLScan.generateQueries(domain, Array.from(this.state.selectedFiles), urlKeyword);
        const queryText = queries.map(q => q.query).join('\n');

        UI.copyToClipboard(queryText);
    },

    /**
     * Validate domain input
     */
    validateDomain(domain) {
        const input = document.getElementById('targetDomain');
        const feedback = document.getElementById('domainFeedback');
        
        if (!domain) {
            input?.classList.remove('valid', 'invalid');
            if (feedback) feedback.textContent = '';
            return false;
        }

        // Basic domain validation
        const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
        const isValid = domainRegex.test(domain);

        if (input) {
            input.classList.toggle('valid', isValid);
            input.classList.toggle('invalid', !isValid);
        }

        if (feedback) {
            feedback.textContent = isValid ? '✓ Valid domain' : '✕ Invalid domain format';
            feedback.className = `input-feedback ${isValid ? 'valid' : 'invalid'}`;
        }

        return isValid;
    },

    /**
     * Start the hunt
     */
    async startHunt() {
        const domain = document.getElementById('targetDomain')?.value.trim();
        const urlKeyword = document.getElementById('urlKeyword')?.value.trim();

        // Validate
        if (!domain) {
            UI.showToast('Please enter a target domain', 'warning');
            UI.shake('#targetDomain');
            return;
        }

        if (!this.validateDomain(domain)) {
            UI.showToast('Please enter a valid domain', 'error');
            return;
        }

        if (this.state.selectedFiles.size === 0) {
            UI.showToast('Please select at least one file pattern', 'warning');
            return;
        }

        if (this.state.isHunting) {
            UI.showToast('Hunt already in progress', 'warning');
            return;
        }

        // Start hunt
        this.state.isHunting = true;
        this.state.currentDomain = domain;
        this.state.currentResults = [];

        const huntBtn = document.getElementById('huntBtn');
        UI.setButtonLoading(huntBtn, true, 'Hunting...');
        UI.showProgress();
        UI.updateSystemStatus('hunting', 'HUNTING');

        UI.log(`Starting hunt on: ${domain}`, 'hunt');
        UI.log(`Searching for ${this.state.selectedFiles.size} file patterns`, 'hunt');

        try {
            const results = await URLScan.hunt(
                domain,
                Array.from(this.state.selectedFiles),
                urlKeyword,
                (progress) => {
                    UI.updateProgress(progress.percent, progress.message);
                    UI.log(progress.message, 'hunt');
                }
            );

            this.state.currentResults = results;

            // Add to history
            Storage.addToHistory({
                domain,
                files: Array.from(this.state.selectedFiles),
                urlKeyword,
                resultCount: results.length,
                timestamp: new Date().toISOString()
            });

            // Render results
            UI.renderResults(results);

            // Log completion
            UI.log(`Hunt complete: ${results.length} results found`, 'success');
            UI.showToast(`Found ${results.length} results`, results.length > 0 ? 'success' : 'info');

            // Auto-analyze first result if any
            if (results.length > 0) {
                this.analyzeResult(results[0].uuid || results[0].id);
            }

        } catch (error) {
            console.error('[App] Hunt error:', error);
            UI.log(`Hunt error: ${error.message}`, 'error');
            UI.showToast('Hunt failed. Check console for details.', 'error');

            // Show CORS fallback info
            if (error.message.includes('CORS')) {
                this.showCORSFallback();
            }
        } finally {
            this.state.isHunting = false;
            UI.setButtonLoading(huntBtn, false);
            UI.hideProgress();
            UI.updateSystemStatus('ready', 'READY');
        }
    },

    /**
     * Show CORS fallback message
     */
    showCORSFallback() {
        const container = document.getElementById('resultsContainer');
        if (!container) return;

        const domain = this.state.currentDomain;
        const files = Array.from(this.state.selectedFiles);
        const manualLinks = files.map(file => {
            const url = URLScan.getSearchUrl(domain, file);
            return `<a href="${url}" target="_blank" rel="noopener">${file}</a>`;
        }).join(' | ');

        container.innerHTML = `
            <div class="cors-fallback">
                <h3>⚠️ Direct API Access Blocked</h3>
                <p>Due to CORS restrictions, direct URLScan API access is limited from browsers.</p>
                <p><strong>Manual Search Links:</strong></p>
                <div class="manual-links">${manualLinks}</div>
                <p class="tip">💡 Tip: Add your URLScan API key in Settings for better access, or use the manual links above.</p>
            </div>
        `;
    },

    /**
     * Clear hunt results
     */
    clearHunt() {
        this.state.currentResults = [];
        this.state.selectedResult = null;
        this.state.currentAnalysis = null;
        this.state.currentReport = null;

        document.getElementById('targetDomain').value = '';
        document.getElementById('urlKeyword').value = '';
        
        const resultsContainer = document.getElementById('resultsContainer');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎯</div>
                    <h3>Ready to Hunt</h3>
                    <p>Enter a target domain and select file patterns to begin.</p>
                </div>
            `;
        }

        this.clearAnalysis();
        this.clearReport();
        this.updateQueries();

        UI.log('Hunt cleared', 'info');
    },

    /**
     * Handle result card actions
     */
    handleResultAction(action, uuid) {
        const result = this.state.currentResults.find(r => (r.uuid || r.id) === uuid);
        if (!result) {
            UI.showToast('Result not found', 'error');
            return;
        }

        switch (action) {
            case 'view':
                this.viewResult(result);
                break;
            case 'inspect':
                this.inspectResult(result);
                break;
            case 'analyze':
                this.analyzeResult(uuid);
                break;
            default:
                console.warn('[App] Unknown action:', action);
        }
    },

    /**
     * View result on URLScan
     */
    viewResult(result) {
        const url = `https://urlscan.io/result/${result.uuid || result.id}/`;
        window.open(url, '_blank', 'noopener,noreferrer');
        UI.log(`Opened URLScan result: ${result.uuid || result.id}`, 'info');
    },

    /**
     * Inspect result response data
     */
    async inspectResult(result) {
        UI.openModal('inspectorModal');

        const contentEl = document.getElementById('inspectorContent');
        const loadingEl = document.getElementById('inspectorLoading');

        if (contentEl) contentEl.style.display = 'none';
        if (loadingEl) loadingEl.style.display = 'flex';

        try {
            // Try to fetch response data
            const responseData = await URLScan.getHttpData(result.uuid || result.id);

            if (loadingEl) loadingEl.style.display = 'none';
            if (contentEl) {
                contentEl.style.display = 'block';

                if (responseData) {
                    // Analyze the content
                    const analysis = Heuristics.analyze(responseData);
                    
                    contentEl.innerHTML = `
                        <div class="inspector-meta">
                            <div><strong>URL:</strong> ${UI.escapeHtml(result.url || 'N/A')}</div>
                            <div><strong>File:</strong> ${UI.escapeHtml(result.filename || 'N/A')}</div>
                            <div><strong>Findings:</strong> ${analysis.totalFindings}</div>
                        </div>
                        <div class="inspector-findings">
                            ${this.renderFindings(analysis.findings)}
                        </div>
                        <div class="inspector-raw">
                            <h4>Raw Content Preview</h4>
                            <pre class="code-block">${UI.escapeHtml(responseData.substring(0, 5000))}${responseData.length > 5000 ? '\n... (truncated)' : ''}</pre>
                        </div>
                    `;
                } else {
                    contentEl.innerHTML = `
                        <div class="inspector-notice">
                            <h4>⚠️ Content Not Available</h4>
                            <p>Response content could not be fetched directly due to CORS restrictions.</p>
                            <p>View the full result on URLScan:</p>
                            <a href="https://urlscan.io/result/${result.uuid || result.id}/" target="_blank" class="btn btn-primary">
                                Open on URLScan
                            </a>
                        </div>
                    `;
                }
            }
        } catch (error) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (contentEl) {
                contentEl.style.display = 'block';
                contentEl.innerHTML = `
                    <div class="inspector-error">
                        <h4>Error Loading Content</h4>
                        <p>${UI.escapeHtml(error.message)}</p>
                        <a href="https://urlscan.io/result/${result.uuid || result.id}/" target="_blank" class="btn btn-primary">
                            View on URLScan
                        </a>
                    </div>
                `;
            }
        }
    },

    /**
     * Render findings HTML
     */
    renderFindings(findings) {
        if (!findings || findings.length === 0) {
            return '<div class="no-findings">No sensitive patterns detected</div>';
        }

        return findings.map(f => `
            <div class="finding-item finding-${f.severity}">
                <div class="finding-header">
                    <span class="severity-badge severity-${f.severity}">${f.severity.toUpperCase()}</span>
                    <span class="finding-category">${f.category}</span>
                </div>
                <div class="finding-match">${UI.escapeHtml(f.match)}</div>
                <div class="finding-context">${UI.escapeHtml(f.context)}</div>
                <div class="finding-reason">${UI.escapeHtml(f.reason)}</div>
            </div>
        `).join('');
    },

    /**
     * Analyze a result
     */
    async analyzeResult(uuid) {
        const result = this.state.currentResults.find(r => (r.uuid || r.id) === uuid);
        if (!result) {
            UI.showToast('Result not found', 'error');
            return;
        }

        this.state.selectedResult = result;
        UI.log(`Analyzing result: ${result.filename || 'Unknown'}`, 'analysis');

        // Mark card as selected
        document.querySelectorAll('.result-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.uuid === uuid);
        });

        // Show analysis panel content
        const analysisContent = document.getElementById('analysisContent');
        const analysisLoading = document.getElementById('analysisLoading');

        if (analysisContent) analysisContent.style.display = 'none';
        if (analysisLoading) analysisLoading.style.display = 'flex';

        try {
            // Try to get content for analysis
            let content = result.content || '';
            
            if (!content) {
                try {
                    content = await URLScan.getHttpData(uuid);
                } catch (e) {
                    // CORS blocked - use demo analysis
                    content = '';
                }
            }

            let analysis;
            if (content) {
                analysis = Heuristics.analyze(content);
            } else {
                // Demo analysis when content unavailable
                analysis = {
                    findings: [],
                    summary: { high: 0, medium: 0, low: 0, info: 0 },
                    overallSeverity: 'info',
                    totalFindings: 0,
                    note: 'Content not available for analysis. Visit URLScan to view.'
                };
            }

            this.state.currentAnalysis = {
                result,
                analysis,
                timestamp: new Date().toISOString()
            };

            // Render analysis
            this.renderAnalysis();

            // Auto-generate report
            this.generateReport();

            UI.log(`Analysis complete: ${analysis.totalFindings} potential findings`, 'analysis');

        } catch (error) {
            console.error('[App] Analysis error:', error);
            UI.log(`Analysis error: ${error.message}`, 'error');
            
            if (analysisLoading) analysisLoading.style.display = 'none';
            if (analysisContent) {
                analysisContent.style.display = 'block';
                analysisContent.innerHTML = `
                    <div class="analysis-error">
                        <p>Error analyzing content: ${UI.escapeHtml(error.message)}</p>
                    </div>
                `;
            }
        }
    },

    /**
     * Render analysis results
     */
    renderAnalysis() {
        const content = document.getElementById('analysisContent');
        const loading = document.getElementById('analysisLoading');
        
        if (loading) loading.style.display = 'none';
        if (!content) return;

        const { result, analysis } = this.state.currentAnalysis || {};
        if (!result || !analysis) return;

        content.style.display = 'block';
        content.innerHTML = `
            <div class="analysis-header">
                <h4>${UI.escapeHtml(result.filename || 'Unknown File')}</h4>
                <span class="severity-badge severity-${analysis.overallSeverity}">${analysis.overallSeverity.toUpperCase()}</span>
            </div>
            <div class="analysis-url">${UI.escapeHtml(result.url || 'N/A')}</div>
            
            <div class="analysis-summary">
                <div class="summary-stat high">
                    <span class="stat-value">${analysis.summary.high}</span>
                    <span class="stat-label">High</span>
                </div>
                <div class="summary-stat medium">
                    <span class="stat-value">${analysis.summary.medium}</span>
                    <span class="stat-label">Medium</span>
                </div>
                <div class="summary-stat low">
                    <span class="stat-value">${analysis.summary.low}</span>
                    <span class="stat-label">Low</span>
                </div>
                <div class="summary-stat info">
                    <span class="stat-value">${analysis.summary.info}</span>
                    <span class="stat-label">Info</span>
                </div>
            </div>

            ${analysis.note ? `<div class="analysis-note">${UI.escapeHtml(analysis.note)}</div>` : ''}

            <div class="analysis-findings">
                ${this.renderFindings(analysis.findings.slice(0, 10))}
                ${analysis.findings.length > 10 ? `<div class="findings-more">+ ${analysis.findings.length - 10} more findings</div>` : ''}
            </div>
        `;
    },

    /**
     * Clear analysis panel
     */
    clearAnalysis() {
        this.state.currentAnalysis = null;
        const content = document.getElementById('analysisContent');
        if (content) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔬</div>
                    <p>Select a result to analyze</p>
                </div>
            `;
        }
    },

    /**
     * Generate report
     */
    generateReport() {
        if (!this.state.currentAnalysis) {
            UI.showToast('No analysis to report', 'warning');
            return;
        }

        const templateSelect = document.getElementById('reportTemplate');
        const template = templateSelect?.value || 'generic';
        const format = 'markdown';

        const { result, analysis } = this.state.currentAnalysis;

        const reportData = {
            target: this.state.currentDomain,
            result,
            analysis,
            companyName: document.getElementById('companyName')?.value || '',
            programName: document.getElementById('programName')?.value || ''
        };

        const report = Reports.generate(reportData, template, format);
        this.state.currentReport = report;

        // Render report preview
        const preview = document.getElementById('reportPreview');
        if (preview) {
            preview.innerHTML = `<pre class="report-content">${UI.escapeHtml(report)}</pre>`;
        }

        // Enable report actions
        document.querySelectorAll('.report-actions .btn').forEach(btn => {
            btn.disabled = false;
        });

        UI.log('Report generated', 'success');
    },

    /**
     * Clear report
     */
    clearReport() {
        this.state.currentReport = null;
        const preview = document.getElementById('reportPreview');
        if (preview) {
            preview.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📄</div>
                    <p>Report will appear here</p>
                </div>
            `;
        }

        // Disable report actions
        document.querySelectorAll('.report-actions .btn').forEach(btn => {
            btn.disabled = true;
        });
    },

    /**
     * Copy report to clipboard
     */
    copyReport() {
        if (!this.state.currentReport) {
            UI.showToast('No report to copy', 'warning');
            return;
        }

        UI.copyToClipboard(this.state.currentReport);
        UI.log('Report copied to clipboard', 'success');
    },

    /**
     * Download report
     */
    downloadReport(format) {
        if (!this.state.currentReport) {
            UI.showToast('No report to download', 'warning');
            return;
        }

        const { result } = this.state.currentAnalysis || {};
        const timestamp = new Date().toISOString().split('T')[0];
        const domain = this.state.currentDomain.replace(/\./g, '_');

        let filename, content, mimeType;

        switch (format) {
            case 'md':
                filename = `recon_sentinel_report_${domain}_${timestamp}.md`;
                content = this.state.currentReport;
                mimeType = 'text/markdown';
                break;
            case 'txt':
                filename = `recon_sentinel_report_${domain}_${timestamp}.txt`;
                content = Reports.generate(
                    { target: this.state.currentDomain, result, analysis: this.state.currentAnalysis?.analysis },
                    document.getElementById('reportTemplate')?.value || 'generic',
                    'text'
                );
                mimeType = 'text/plain';
                break;
            case 'json':
                filename = `recon_sentinel_report_${domain}_${timestamp}.json`;
                content = Reports.exportJSON({
                    target: this.state.currentDomain,
                    result,
                    analysis: this.state.currentAnalysis?.analysis
                });
                mimeType = 'application/json';
                break;
            default:
                return;
        }

        UI.downloadFile(content, filename, mimeType);
        UI.log(`Report downloaded: ${filename}`, 'success');
    },

    /**
     * Navigate to section
     */
    navigateTo(target) {
        switch (target) {
            case 'settings':
                UI.openModal('settingsModal');
                break;
            case 'history':
                this.showHistory();
                UI.openModal('historyModal');
                break;
            case 'help':
                UI.openModal('helpModal');
                break;
            default:
                console.warn('[App] Unknown nav target:', target);
        }
    },

    /**
     * Show history modal
     */
    showHistory() {
        const container = document.getElementById('historyList');
        if (!container) return;

        const history = Storage.getHistory();

        if (history.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📜</div>
                    <p>No hunt history yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = history.map(entry => `
            <div class="history-item">
                <div class="history-domain">${UI.escapeHtml(entry.domain)}</div>
                <div class="history-meta">
                    <span>${entry.files?.length || 0} files</span>
                    <span>${entry.resultCount || 0} results</span>
                    <span>${new Date(entry.timestamp).toLocaleString()}</span>
                </div>
                <button class="btn btn-sm btn-secondary" data-rerun='${JSON.stringify(entry)}'>Re-run</button>
            </div>
        `).join('');

        // Handle re-run buttons
        container.querySelectorAll('[data-rerun]').forEach(btn => {
            btn.addEventListener('click', () => {
                const entry = JSON.parse(btn.dataset.rerun);
                this.rerunHunt(entry);
                UI.closeModal('historyModal');
            });
        });
    },

    /**
     * Re-run a hunt from history
     */
    rerunHunt(entry) {
        document.getElementById('targetDomain').value = entry.domain;
        if (entry.urlKeyword) {
            document.getElementById('urlKeyword').value = entry.urlKeyword;
        }

        // Select the files
        this.deselectAllFiles();
        entry.files?.forEach(file => {
            this.state.selectedFiles.add(file);
        });
        this.renderPresets();
        this.updateSelectedCount();
        this.updateQueries();

        // Start hunt
        this.startHunt();
    },

    /**
     * Clear history
     */
    clearHistory() {
        Storage.clearHistory();
        this.showHistory();
        UI.showToast('History cleared', 'success');
        UI.log('Hunt history cleared', 'info');
    },

    /**
     * Load settings
     */
    loadSettings() {
        const settings = Storage.getSettings();

        // Apply settings to form
        const animationsToggle = document.getElementById('settingAnimations');
        const soundToggle = document.getElementById('settingSound');
        const autoSaveToggle = document.getElementById('settingAutoSave');
        const templateSelect = document.getElementById('settingTemplate');

        if (animationsToggle) animationsToggle.checked = settings.animations;
        if (soundToggle) soundToggle.checked = settings.sound;
        if (autoSaveToggle) autoSaveToggle.checked = settings.autoSave;
        if (templateSelect) templateSelect.value = settings.template;

        // Apply animation setting
        if (!settings.animations) {
            document.body.classList.add('reduce-motion');
        }
    },

    /**
     * Save settings
     */
    saveSettings() {
        const settings = {
            animations: document.getElementById('settingAnimations')?.checked ?? true,
            sound: document.getElementById('settingSound')?.checked ?? false,
            autoSave: document.getElementById('settingAutoSave')?.checked ?? true,
            template: document.getElementById('settingTemplate')?.value || 'generic'
        };

        Storage.setSettings(settings);

        // Apply animation setting
        document.body.classList.toggle('reduce-motion', !settings.animations);

        UI.showToast('Settings saved', 'success');
        UI.log('Settings updated', 'info');
        UI.closeModal('settingsModal');
    },

    /**
     * Check API key status
     */
    checkApiKey() {
        const apiKey = Storage.getApiKey();
        const indicator = document.getElementById('apiKeyIndicator');

        if (indicator) {
            indicator.className = `api-key-indicator ${apiKey ? 'has-key' : 'no-key'}`;
            indicator.textContent = apiKey ? '🔑 API Key Set' : '⚠️ No API Key';
        }
    },

    /**
     * Save API key
     */
    saveApiKey(key) {
        key = key.trim();
        
        if (!key) {
            UI.showToast('Please enter an API key', 'warning');
            return;
        }

        // Basic validation (URLScan keys are UUIDs)
        if (!/^[a-f0-9-]{36}$/i.test(key)) {
            UI.showToast('Invalid API key format', 'error');
            return;
        }

        Storage.setApiKey(key);
        this.checkApiKey();
        
        UI.showToast('API key saved', 'success');
        UI.log('URLScan API key configured', 'success');
        UI.updateSystemStatus('ready', 'READY');

        // Clear input
        document.getElementById('apiKeyInput').value = '';
    },

    /**
     * Clear API key
     */
    clearApiKey() {
        Storage.setApiKey('');
        this.checkApiKey();
        
        UI.showToast('API key removed', 'info');
        UI.log('URLScan API key cleared', 'info');
        UI.updateSystemStatus('limited', 'LIMITED MODE');
    },

    /**
     * Utility: Delay promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
