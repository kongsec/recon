/**
 * RECON SENTINEL - UI Module
 * Premium UI components, cursor effects, animations, and modal management
 */

const UI = {
    // State
    cursorTrails: [],
    maxTrails: 12,
    isAnimating: true,
    modals: {},
    toastQueue: [],
    isProcessingToast: false,

    /**
     * Initialize UI system
     */
    init() {
        this.initCursor();
        this.initModals();
        this.initTooltips();
        this.initRippleEffects();
        this.initPanelAnimations();
        this.initScrollEffects();
        this.initKeyboardShortcuts();
        this.initAccessibility();
        this.initClock();
        this.initSystemStatus();
        
        console.log('[UI] System initialized');
    },

    // ==================== CURSOR SYSTEM ====================

    /**
     * Initialize custom cursor with trailing effect
     */
    initCursor() {
        const cursor = document.querySelector('.cursor-main');
        const trails = document.querySelectorAll('.cursor-trail');
        
        if (!cursor) return;

        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            cursor.style.display = 'none';
            trails.forEach(t => t.style.display = 'none');
            document.body.style.cursor = 'auto';
            return;
        }

        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;

        // Track mouse position
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // Smooth cursor animation
        const animateCursor = () => {
            if (!this.isAnimating) return;

            // Smooth interpolation
            const ease = 0.15;
            cursorX += (mouseX - cursorX) * ease;
            cursorY += (mouseY - cursorY) * ease;

            cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;

            // Animate trails with delay
            trails.forEach((trail, i) => {
                const delay = (i + 1) * 0.08;
                const trailX = cursorX + Math.sin(Date.now() * 0.003 + i) * 2;
                const trailY = cursorY + Math.cos(Date.now() * 0.003 + i) * 2;
                
                setTimeout(() => {
                    trail.style.transform = `translate(${trailX}px, ${trailY}px)`;
                    trail.style.opacity = 1 - (i * 0.15);
                }, delay * 1000);
            });

            requestAnimationFrame(animateCursor);
        };

        animateCursor();

        // Cursor states for interactive elements
        this.initCursorInteractions();
    },

    /**
     * Initialize cursor interaction states
     */
    initCursorInteractions() {
        const cursor = document.querySelector('.cursor-main');
        if (!cursor) return;

        // Elements that trigger cursor expansion
        const interactiveElements = document.querySelectorAll(
            'button, a, input, select, textarea, .result-card, .preset-option, .modal-close'
        );

        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('cursor-hover');
            });

            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('cursor-hover');
            });
        });

        // Click effect
        document.addEventListener('mousedown', () => {
            cursor.classList.add('cursor-click');
        });

        document.addEventListener('mouseup', () => {
            cursor.classList.remove('cursor-click');
        });
    },

    // ==================== MODAL SYSTEM ====================

    /**
     * Initialize modal system
     */
    initModals() {
        // Register all modals
        const modalElements = document.querySelectorAll('.modal');
        modalElements.forEach(modal => {
            const id = modal.id;
            this.modals[id] = {
                element: modal,
                isOpen: false
            };

            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(id);
                }
            });

            // Close button
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeModal(id));
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    },

    /**
     * Open a modal by ID
     */
    openModal(id) {
        const modal = this.modals[id];
        if (!modal) {
            console.warn(`[UI] Modal not found: ${id}`);
            return;
        }

        modal.element.classList.add('active');
        modal.isOpen = true;
        document.body.style.overflow = 'hidden';

        // Animate content
        const content = modal.element.querySelector('.modal-content');
        if (content) {
            content.style.animation = 'zoomIn 0.3s ease-out';
        }

        // Focus first input
        setTimeout(() => {
            const firstInput = modal.element.querySelector('input, textarea, button');
            if (firstInput) firstInput.focus();
        }, 100);

        this.log(`Modal opened: ${id}`, 'info');
    },

    /**
     * Close a modal by ID
     */
    closeModal(id) {
        const modal = this.modals[id];
        if (!modal || !modal.isOpen) return;

        // Animate out
        const content = modal.element.querySelector('.modal-content');
        if (content) {
            content.style.animation = 'fadeScale 0.2s ease-out reverse';
        }

        setTimeout(() => {
            modal.element.classList.remove('active');
            modal.isOpen = false;
            
            // Restore body scroll if no modals open
            const anyOpen = Object.values(this.modals).some(m => m.isOpen);
            if (!anyOpen) {
                document.body.style.overflow = '';
            }
        }, 150);
    },

    /**
     * Close all open modals
     */
    closeAllModals() {
        Object.keys(this.modals).forEach(id => {
            if (this.modals[id].isOpen) {
                this.closeModal(id);
            }
        });
    },

    // ==================== TOAST NOTIFICATIONS ====================

    /**
     * Show a toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        this.toastQueue.push({ message, type, duration });
        this.processToastQueue();
    },

    /**
     * Process toast queue
     */
    processToastQueue() {
        if (this.isProcessingToast || this.toastQueue.length === 0) return;

        this.isProcessingToast = true;
        const { message, type, duration } = this.toastQueue.shift();

        const container = document.getElementById('toastContainer');
        if (!container) {
            this.isProcessingToast = false;
            return;
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Close">×</button>
        `;

        // Close button handler
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.dismissToast(toast);
        });

        container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('toast-show');
        });

        // Auto dismiss
        setTimeout(() => {
            this.dismissToast(toast);
        }, duration);
    },

    /**
     * Dismiss a toast
     */
    dismissToast(toast) {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.isProcessingToast = false;
            this.processToastQueue();
        }, 300);
    },

    // ==================== TERMINAL LOG ====================

    /**
     * Log message to terminal
     */
    log(message, type = 'info') {
        const terminal = document.getElementById('terminalLog');
        if (!terminal) return;

        const timestamp = new Date().toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const prefixes = {
            info: '[INFO]',
            success: '[SUCCESS]',
            warning: '[WARN]',
            error: '[ERROR]',
            system: '[SYSTEM]',
            hunt: '[HUNT]',
            analysis: '[ANALYSIS]'
        };

        const line = document.createElement('div');
        line.className = `log-line log-${type}`;
        line.innerHTML = `<span class="log-time">${timestamp}</span> <span class="log-prefix">${prefixes[type] || prefixes.info}</span> ${this.escapeHtml(message)}`;

        terminal.appendChild(line);
        
        // Auto-scroll
        terminal.scrollTop = terminal.scrollHeight;

        // Limit lines
        while (terminal.children.length > 100) {
            terminal.removeChild(terminal.firstChild);
        }
    },

    /**
     * Clear terminal
     */
    clearTerminal() {
        const terminal = document.getElementById('terminalLog');
        if (terminal) {
            terminal.innerHTML = '';
            this.log('Terminal cleared', 'system');
        }
    },

    // ==================== BUTTON EFFECTS ====================

    /**
     * Initialize ripple effects on buttons
     */
    initRippleEffects() {
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;

                btn.appendChild(ripple);

                setTimeout(() => ripple.remove(), 600);
            });
        });
    },

    // ==================== PANEL ANIMATIONS ====================

    /**
     * Initialize panel animations
     */
    initPanelAnimations() {
        const panels = document.querySelectorAll('.panel');
        
        // Stagger panel reveal
        panels.forEach((panel, index) => {
            panel.style.animationDelay = `${index * 0.1}s`;
        });
    },

    /**
     * Animate panel content update
     */
    animatePanelUpdate(panelSelector) {
        const panel = document.querySelector(panelSelector);
        if (!panel) return;

        panel.style.animation = 'none';
        panel.offsetHeight; // Trigger reflow
        panel.style.animation = 'glowPulse 0.5s ease-out';
    },

    // ==================== SCROLL EFFECTS ====================

    /**
     * Initialize scroll-based effects
     */
    initScrollEffects() {
        // Reveal elements on scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, {
            threshold: 0.1
        });

        document.querySelectorAll('.reveal-on-scroll').forEach(el => {
            observer.observe(el);
        });
    },

    // ==================== TOOLTIPS ====================

    /**
     * Initialize tooltip system
     */
    initTooltips() {
        document.querySelectorAll('[data-tooltip]').forEach(el => {
            el.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.dataset.tooltip);
            });

            el.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    },

    /**
     * Show tooltip
     */
    showTooltip(element, text) {
        let tooltip = document.getElementById('tooltip');
        
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'tooltip';
            tooltip.className = 'tooltip';
            document.body.appendChild(tooltip);
        }

        tooltip.textContent = text;
        tooltip.classList.add('tooltip-show');

        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        let top = rect.top - tooltipRect.height - 8;

        // Keep in viewport
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        if (top < 10) {
            top = rect.bottom + 8;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    },

    /**
     * Hide tooltip
     */
    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
            tooltip.classList.remove('tooltip-show');
        }
    },

    // ==================== KEYBOARD SHORTCUTS ====================

    /**
     * Initialize keyboard shortcuts
     */
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Ctrl/Cmd + K - Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const domainInput = document.getElementById('targetDomain');
                if (domainInput) domainInput.focus();
            }

            // Ctrl/Cmd + Enter - Start hunt
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                const huntBtn = document.getElementById('huntBtn');
                if (huntBtn && !huntBtn.disabled) huntBtn.click();
            }

            // Ctrl/Cmd + S - Open settings
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.openModal('settingsModal');
            }

            // ? - Show help
            if (e.key === '?' && !e.shiftKey) {
                this.openModal('helpModal');
            }
        });
    },

    // ==================== ACCESSIBILITY ====================

    /**
     * Initialize accessibility features
     */
    initAccessibility() {
        // Skip link
        const skipLink = document.createElement('a');
        skipLink.href = '#mainContent';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Focus visible
        document.body.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-nav');
            }
        });

        document.body.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-nav');
        });
    },

    // ==================== CLOCK & STATUS ====================

    /**
     * Initialize system clock
     */
    initClock() {
        const updateClock = () => {
            const clock = document.getElementById('systemClock');
            if (!clock) return;

            const now = new Date();
            const time = now.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            const date = now.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            clock.innerHTML = `<span class="clock-time">${time}</span><span class="clock-date">${date}</span>`;
        };

        updateClock();
        setInterval(updateClock, 1000);
    },

    /**
     * Initialize system status indicator
     */
    initSystemStatus() {
        const updateStatus = () => {
            const statusDot = document.querySelector('.status-dot');
            const statusText = document.querySelector('.status-text');
            
            if (!statusDot || !statusText) return;

            // Check API key presence
            const hasApiKey = !!Storage.getApiKey();
            
            statusDot.className = 'status-dot ' + (hasApiKey ? 'status-ready' : 'status-limited');
            statusText.textContent = hasApiKey ? 'READY' : 'LIMITED MODE';
        };

        updateStatus();
        
        // Update on storage changes
        window.addEventListener('storage', updateStatus);
    },

    /**
     * Update system status
     */
    updateSystemStatus(status, message) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (statusDot) {
            statusDot.className = `status-dot status-${status}`;
        }
        if (statusText) {
            statusText.textContent = message;
        }
    },

    // ==================== LOADING STATES ====================

    /**
     * Show loading state on element
     */
    showLoading(selector, message = 'Loading...') {
        const el = document.querySelector(selector);
        if (!el) return;

        el.classList.add('loading');
        el.dataset.originalContent = el.innerHTML;
        el.innerHTML = `
            <div class="loading-indicator">
                <div class="loading-spinner"></div>
                <span>${message}</span>
            </div>
        `;
    },

    /**
     * Hide loading state
     */
    hideLoading(selector) {
        const el = document.querySelector(selector);
        if (!el) return;

        el.classList.remove('loading');
        if (el.dataset.originalContent) {
            el.innerHTML = el.dataset.originalContent;
            delete el.dataset.originalContent;
        }
    },

    /**
     * Set button loading state
     */
    setButtonLoading(btn, isLoading, loadingText = 'Loading...') {
        if (typeof btn === 'string') {
            btn = document.querySelector(btn);
        }
        if (!btn) return;

        if (isLoading) {
            btn.disabled = true;
            btn.dataset.originalText = btn.innerHTML;
            btn.innerHTML = `<span class="btn-spinner"></span>${loadingText}`;
            btn.classList.add('btn-loading');
        } else {
            btn.disabled = false;
            if (btn.dataset.originalText) {
                btn.innerHTML = btn.dataset.originalText;
                delete btn.dataset.originalText;
            }
            btn.classList.remove('btn-loading');
        }
    },

    // ==================== PROGRESS BAR ====================

    /**
     * Update progress bar
     */
    updateProgress(percent, message = '') {
        const progressBar = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        if (progressBar) {
            progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
        if (progressText && message) {
            progressText.textContent = message;
        }
    },

    /**
     * Show progress container
     */
    showProgress() {
        const container = document.querySelector('.progress-container');
        if (container) {
            container.classList.add('active');
        }
    },

    /**
     * Hide progress container
     */
    hideProgress() {
        const container = document.querySelector('.progress-container');
        if (container) {
            container.classList.remove('active');
            this.updateProgress(0);
        }
    },

    // ==================== RESULT CARDS ====================

    /**
     * Create result card element
     */
    createResultCard(result, index = 0) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.style.animationDelay = `${index * 0.05}s`;
        card.dataset.uuid = result.uuid || result.id;

        const severity = result.severity || 'info';
        const time = result.time ? new Date(result.time).toLocaleString() : 'Unknown';

        card.innerHTML = `
            <div class="result-header">
                <span class="severity-badge severity-${severity}">${severity.toUpperCase()}</span>
                <span class="result-filename">${this.escapeHtml(result.filename || 'Unknown')}</span>
            </div>
            <div class="result-body">
                <div class="result-url" title="${this.escapeHtml(result.url || '')}">${this.escapeHtml(this.truncateUrl(result.url || '', 60))}</div>
                <div class="result-meta">
                    <span class="result-domain">${this.escapeHtml(result.domain || '')}</span>
                    <span class="result-time">${time}</span>
                </div>
            </div>
            <div class="result-actions">
                <button class="btn btn-sm btn-secondary" data-action="view" title="View on URLScan">
                    <span class="btn-icon">🔗</span> View
                </button>
                <button class="btn btn-sm btn-secondary" data-action="inspect" title="Inspect Response">
                    <span class="btn-icon">🔍</span> Inspect
                </button>
                <button class="btn btn-sm btn-primary" data-action="analyze" title="Analyze & Generate Report">
                    <span class="btn-icon">📋</span> Analyze
                </button>
            </div>
        `;

        return card;
    },

    /**
     * Render results to container
     */
    renderResults(results, containerSelector = '#resultsContainer') {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        container.innerHTML = '';

        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📡</div>
                    <h3>No Results Found</h3>
                    <p>Try different file keywords or check your domain spelling.</p>
                </div>
            `;
            return;
        }

        results.forEach((result, index) => {
            const card = this.createResultCard(result, index);
            container.appendChild(card);
        });

        // Update result count
        const countEl = document.getElementById('resultCount');
        if (countEl) {
            countEl.textContent = `${results.length} result${results.length !== 1 ? 's' : ''} found`;
        }
    },

    // ==================== UTILITY FUNCTIONS ====================

    /**
     * Escape HTML entities
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Truncate URL for display
     */
    truncateUrl(url, maxLength = 50) {
        if (url.length <= maxLength) return url;
        
        const start = url.substring(0, maxLength / 2);
        const end = url.substring(url.length - maxLength / 2);
        return `${start}...${end}`;
    },

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard!', 'success');
            return true;
        } catch (err) {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                document.execCommand('copy');
                this.showToast('Copied to clipboard!', 'success');
                return true;
            } catch (e) {
                this.showToast('Failed to copy', 'error');
                return false;
            } finally {
                document.body.removeChild(textarea);
            }
        }
    },

    /**
     * Download file
     */
    downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast(`Downloaded: ${filename}`, 'success');
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // ==================== ANIMATION HELPERS ====================

    /**
     * Animate element with class
     */
    animate(element, animationClass, duration = 1000) {
        return new Promise(resolve => {
            if (typeof element === 'string') {
                element = document.querySelector(element);
            }
            if (!element) {
                resolve();
                return;
            }

            element.classList.add(animationClass);

            setTimeout(() => {
                element.classList.remove(animationClass);
                resolve();
            }, duration);
        });
    },

    /**
     * Stagger animate children
     */
    staggerAnimate(containerSelector, childSelector, animationClass, delay = 50) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const children = container.querySelectorAll(childSelector);
        children.forEach((child, index) => {
            setTimeout(() => {
                child.classList.add(animationClass);
            }, index * delay);
        });
    },

    /**
     * Shake element (error feedback)
     */
    shake(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (!element) return;

        element.classList.add('shake');
        setTimeout(() => element.classList.remove('shake'), 500);
    },

    /**
     * Highlight element temporarily
     */
    highlight(element, color = 'var(--cyan)') {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        if (!element) return;

        const originalShadow = element.style.boxShadow;
        element.style.boxShadow = `0 0 20px ${color}`;
        element.style.transition = 'box-shadow 0.3s ease';

        setTimeout(() => {
            element.style.boxShadow = originalShadow;
        }, 500);
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}
