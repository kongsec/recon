/**
 * RECON SENTINEL - Heuristics Engine
 * Safe pattern matching for potentially sensitive public data
 * 
 * IMPORTANT: This engine flags POTENTIAL findings only.
 * All detections require manual verification.
 * No certainty claims are made about security issues.
 */

const Heuristics = {
    // Severity levels
    SEVERITY: {
        HIGH: 'high',
        MEDIUM: 'medium',
        LOW: 'low',
        INFO: 'info'
    },

    // Pattern categories with rules
    patterns: {
        // API Endpoints
        apiEndpoints: {
            name: 'API Endpoints',
            severity: 'medium',
            patterns: [
                /["']\/api\/v[0-9]+\/[a-zA-Z]+["']/gi,
                /["']https?:\/\/api\.[a-zA-Z0-9.-]+["']/gi,
                /["']\/graphql["']/gi,
                /["']\/rest\/[a-zA-Z]+["']/gi,
                /apiUrl\s*[:=]\s*["'][^"']+["']/gi,
                /baseUrl\s*[:=]\s*["'][^"']+["']/gi,
                /endpoint\s*[:=]\s*["'][^"']+["']/gi
            ],
            reason: 'API endpoint URLs may reveal internal service architecture'
        },

        // Internal Hostnames
        internalHostnames: {
            name: 'Internal Hostnames',
            severity: 'medium',
            patterns: [
                /["'][a-zA-Z0-9-]+\.(internal|local|corp|lan|intranet|private)\.[a-zA-Z]+["']/gi,
                /["']https?:\/\/[a-zA-Z0-9-]+\.(internal|local|corp|lan|intranet)["']/gi,
                /["']localhost(:[0-9]+)?["']/gi,
                /["']127\.0\.0\.1(:[0-9]+)?["']/gi
            ],
            reason: 'Internal hostnames may indicate development/staging infrastructure'
        },

        // Private IP Addresses (RFC1918)
        privateIPs: {
            name: 'Private/Internal IPs',
            severity: 'low',
            patterns: [
                /["']10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:[0-9]+)?["']/g,
                /["']172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}(:[0-9]+)?["']/g,
                /["']192\.168\.\d{1,3}\.\d{1,3}(:[0-9]+)?["']/g
            ],
            reason: 'Private IP addresses may indicate internal network structure'
        },

        // Environment Indicators
        environmentIndicators: {
            name: 'Environment Indicators',
            severity: 'low',
            patterns: [
                /["'](staging|stage|dev|development|test|testing|qa|uat|preprod|sandbox)["']/gi,
                /environment\s*[:=]\s*["'](staging|dev|test|qa)["']/gi,
                /ENV\s*[:=]\s*["'](staging|dev|test|qa)["']/gi,
                /NODE_ENV\s*[:=]\s*["'](development|test)["']/gi
            ],
            reason: 'Environment identifiers may indicate non-production configurations'
        },

        // Cloud Service Configs
        cloudConfigs: {
            name: 'Cloud Service Configurations',
            severity: 'high',
            patterns: [
                /["']AKIA[A-Z0-9]{16}["']/g, // AWS Access Key pattern
                /["'][a-zA-Z0-9-]+\.s3\.amazonaws\.com["']/gi,
                /["'][a-zA-Z0-9-]+\.s3-[a-z0-9-]+\.amazonaws\.com["']/gi,
                /["']https?:\/\/[a-zA-Z0-9-]+\.blob\.core\.windows\.net["']/gi,
                /["']https?:\/\/storage\.googleapis\.com\/[a-zA-Z0-9-]+["']/gi,
                /["'][a-zA-Z0-9-]+\.firebaseio\.com["']/gi,
                /["'][a-zA-Z0-9-]+\.firebaseapp\.com["']/gi
            ],
            reason: 'Cloud service URLs may indicate storage buckets or database endpoints'
        },

        // Firebase Configuration
        firebaseConfig: {
            name: 'Firebase Configuration',
            severity: 'medium',
            patterns: [
                /apiKey\s*[:=]\s*["']AIza[a-zA-Z0-9_-]{35}["']/g,
                /authDomain\s*[:=]\s*["'][^"']+\.firebaseapp\.com["']/g,
                /databaseURL\s*[:=]\s*["']https:\/\/[^"']+\.firebaseio\.com["']/g,
                /storageBucket\s*[:=]\s*["'][^"']+\.appspot\.com["']/g,
                /messagingSenderId\s*[:=]\s*["']\d+["']/g
            ],
            reason: 'Firebase configuration may indicate database and auth setup'
        },

        // Authentication References
        authReferences: {
            name: 'Authentication References',
            severity: 'medium',
            patterns: [
                /["']\/auth\/[a-zA-Z]+["']/gi,
                /["']\/oauth\/[a-zA-Z]+["']/gi,
                /["']\/login["']/gi,
                /["']\/token["']/gi,
                /authEndpoint\s*[:=]\s*["'][^"']+["']/gi,
                /tokenUrl\s*[:=]\s*["'][^"']+["']/gi,
                /client_id\s*[:=]\s*["'][^"']+["']/gi,
                /client_secret\s*[:=]\s*["'][^"']+["']/gi
            ],
            reason: 'Authentication endpoints and client configurations may be sensitive'
        },

        // Webhook URLs
        webhookURLs: {
            name: 'Webhook URLs',
            severity: 'medium',
            patterns: [
                /["']https?:\/\/[^"']*webhook[^"']*["']/gi,
                /["']https?:\/\/hooks\.[^"']+["']/gi,
                /["']https?:\/\/[^"']*\/callback[^"']*["']/gi,
                /webhookUrl\s*[:=]\s*["'][^"']+["']/gi,
                /callbackUrl\s*[:=]\s*["'][^"']+["']/gi
            ],
            reason: 'Webhook URLs may allow unauthorized triggering of actions'
        },

        // Debug Flags
        debugFlags: {
            name: 'Debug Configuration',
            severity: 'low',
            patterns: [
                /debug\s*[:=]\s*true/gi,
                /DEBUG\s*[:=]\s*["']?true["']?/gi,
                /verbose\s*[:=]\s*true/gi,
                /logging\s*[:=]\s*["']?(verbose|debug)["']?/gi,
                /devMode\s*[:=]\s*true/gi
            ],
            reason: 'Debug flags may indicate verbose error output in production'
        },

        // Source Maps
        sourceMaps: {
            name: 'Source Map References',
            severity: 'info',
            patterns: [
                /\/\/[#@]\s*sourceMappingURL\s*=\s*[^\s]+/gi,
                /["'][^"']+\.map["']/gi,
                /sourceMapUrl\s*[:=]\s*["'][^"']+["']/gi
            ],
            reason: 'Source maps may expose original source code'
        },

        // Email Addresses
        emailAddresses: {
            name: 'Email Addresses',
            severity: 'info',
            patterns: [
                /["'][a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}["']/g
            ],
            reason: 'Email addresses may indicate contact points or admin accounts'
        },

        // Potential Secrets (conservative matching)
        potentialSecrets: {
            name: 'Potential Secrets/Keys',
            severity: 'high',
            patterns: [
                /api[_-]?key\s*[:=]\s*["'][a-zA-Z0-9_-]{20,}["']/gi,
                /secret[_-]?key\s*[:=]\s*["'][a-zA-Z0-9_-]{20,}["']/gi,
                /access[_-]?token\s*[:=]\s*["'][a-zA-Z0-9_-]{20,}["']/gi,
                /private[_-]?key\s*[:=]\s*["'][^"']{20,}["']/gi,
                /password\s*[:=]\s*["'][^"']{8,}["']/gi,
                /["']sk_live_[a-zA-Z0-9]+["']/g, // Stripe live key pattern
                /["']pk_live_[a-zA-Z0-9]+["']/g, // Stripe public live key
                /["']ghp_[a-zA-Z0-9]+["']/g, // GitHub personal token
                /["']gho_[a-zA-Z0-9]+["']/g  // GitHub OAuth token
            ],
            reason: 'Patterns resembling API keys or secrets detected (requires verification)'
        },

        // Database Connection Strings
        databaseStrings: {
            name: 'Database Connection Patterns',
            severity: 'high',
            patterns: [
                /mongodb(\+srv)?:\/\/[^"'\s]+/gi,
                /postgres(ql)?:\/\/[^"'\s]+/gi,
                /mysql:\/\/[^"'\s]+/gi,
                /redis:\/\/[^"'\s]+/gi,
                /databaseUrl\s*[:=]\s*["'][^"']+["']/gi,
                /connectionString\s*[:=]\s*["'][^"']+["']/gi
            ],
            reason: 'Database connection patterns may expose credentials'
        },

        // Admin/Internal Paths
        adminPaths: {
            name: 'Admin/Internal Paths',
            severity: 'low',
            patterns: [
                /["']\/admin[\/"]?["']/gi,
                /["']\/dashboard[\/"]?["']/gi,
                /["']\/internal[\/"]?["']/gi,
                /["']\/backoffice[\/"]?["']/gi,
                /["']\/management[\/"]?["']/gi,
                /["']\/_[a-zA-Z]+[\/"]?["']/gi
            ],
            reason: 'Admin paths may indicate management interfaces'
        }
    },

    /**
     * Analyze content for potentially sensitive patterns
     * @param {string} content - Content to analyze
     * @returns {object} Analysis results
     */
    analyze(content) {
        if (!content || typeof content !== 'string') {
            return {
                findings: [],
                summary: { high: 0, medium: 0, low: 0, info: 0 },
                overallSeverity: null
            };
        }

        const findings = [];
        const summary = { high: 0, medium: 0, low: 0, info: 0 };

        // Iterate through each pattern category
        Object.entries(this.patterns).forEach(([categoryKey, category]) => {
            category.patterns.forEach(pattern => {
                const matches = content.match(pattern);
                if (matches) {
                    // Deduplicate matches
                    const uniqueMatches = [...new Set(matches)];
                    
                    uniqueMatches.forEach(match => {
                        // Check if we already have this exact match
                        const exists = findings.some(f => 
                            f.match === match && f.category === category.name
                        );

                        if (!exists) {
                            findings.push({
                                category: category.name,
                                categoryKey: categoryKey,
                                severity: category.severity,
                                match: this.sanitizeMatch(match),
                                rawMatch: match,
                                reason: category.reason,
                                context: this.getContext(content, match)
                            });

                            summary[category.severity]++;
                        }
                    });
                }
            });
        });

        // Determine overall severity
        let overallSeverity = null;
        if (summary.high > 0) overallSeverity = this.SEVERITY.HIGH;
        else if (summary.medium > 0) overallSeverity = this.SEVERITY.MEDIUM;
        else if (summary.low > 0) overallSeverity = this.SEVERITY.LOW;
        else if (summary.info > 0) overallSeverity = this.SEVERITY.INFO;

        return {
            findings,
            summary,
            overallSeverity,
            totalFindings: findings.length
        };
    },

    /**
     * Sanitize/redact potentially sensitive parts of a match
     * @param {string} match - Original match
     * @returns {string} Sanitized match
     */
    sanitizeMatch(match) {
        // Partially redact potential secrets/keys
        if (match.length > 20) {
            // Show first and last 4 characters, redact middle
            const visibleStart = match.substring(0, 8);
            const visibleEnd = match.substring(match.length - 4);
            return `${visibleStart}[REDACTED]${visibleEnd}`;
        }
        return match;
    },

    /**
     * Get surrounding context for a match
     * @param {string} content - Full content
     * @param {string} match - Match to find context for
     * @returns {string} Context snippet
     */
    getContext(content, match) {
        const index = content.indexOf(match);
        if (index === -1) return '';

        const contextLength = 50;
        const start = Math.max(0, index - contextLength);
        const end = Math.min(content.length, index + match.length + contextLength);

        let context = content.substring(start, end);
        
        // Add ellipsis if truncated
        if (start > 0) context = '...' + context;
        if (end < content.length) context = context + '...';

        return context;
    },

    /**
     * Get severity label with styling info
     * @param {string} severity - Severity level
     * @returns {object} Severity info
     */
    getSeverityInfo(severity) {
        const info = {
            high: {
                label: 'HIGH',
                description: 'Potentially sensitive data requiring immediate review',
                cssClass: 'severity-high'
            },
            medium: {
                label: 'MEDIUM',
                description: 'Data that may be sensitive in certain contexts',
                cssClass: 'severity-medium'
            },
            low: {
                label: 'LOW',
                description: 'Minor information exposure, context-dependent',
                cssClass: 'severity-low'
            },
            info: {
                label: 'INFO',
                description: 'Informational finding, likely not sensitive',
                cssClass: 'severity-info'
            }
        };

        return info[severity] || info.info;
    },

    /**
     * Filter findings by severity
     * @param {array} findings - Array of findings
     * @param {string} severity - Severity to filter by
     * @returns {array} Filtered findings
     */
    filterBySeverity(findings, severity) {
        if (severity === 'all') return findings;
        return findings.filter(f => f.severity === severity);
    },

    /**
     * Group findings by category
     * @param {array} findings - Array of findings
     * @returns {object} Grouped findings
     */
    groupByCategory(findings) {
        return findings.reduce((groups, finding) => {
            const key = finding.categoryKey;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(finding);
            return groups;
        }, {});
    },

    /**
     * Generate a summary report of findings
     * @param {object} analysis - Analysis results
     * @returns {string} Summary text
     */
    generateSummary(analysis) {
        if (analysis.totalFindings === 0) {
            return 'No potentially sensitive patterns detected.';
        }

        const parts = [];
        
        if (analysis.summary.high > 0) {
            parts.push(`${analysis.summary.high} high-severity`);
        }
        if (analysis.summary.medium > 0) {
            parts.push(`${analysis.summary.medium} medium-severity`);
        }
        if (analysis.summary.low > 0) {
            parts.push(`${analysis.summary.low} low-severity`);
        }
        if (analysis.summary.info > 0) {
            parts.push(`${analysis.summary.info} informational`);
        }

        return `Detected ${analysis.totalFindings} potential findings: ${parts.join(', ')}.`;
    },

    /**
     * Check if a specific pattern category exists in content
     * @param {string} content - Content to check
     * @param {string} categoryKey - Category key to check
     * @returns {boolean} Whether pattern was found
     */
    hasPattern(content, categoryKey) {
        const category = this.patterns[categoryKey];
        if (!category) return false;

        return category.patterns.some(pattern => pattern.test(content));
    },

    /**
     * Get all available pattern categories
     * @returns {array} Array of category info
     */
    getCategories() {
        return Object.entries(this.patterns).map(([key, value]) => ({
            key,
            name: value.name,
            severity: value.severity,
            reason: value.reason
        }));
    }
};
