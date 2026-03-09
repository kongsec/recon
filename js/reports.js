/**
 * RECON SENTINEL - Report Generator Module
 * Generates professional responsible disclosure reports
 * 
 * IMPORTANT: Reports are DRAFTS requiring manual review.
 * All findings are POTENTIAL and not confirmed vulnerabilities.
 */

const Reports = {
    // Report templates
    templates: {
        generic: {
            name: 'Generic Responsible Disclosure',
            sections: ['title', 'summary', 'asset', 'evidence', 'findings', 'impact', 'reproduction', 'remediation', 'severity', 'notes']
        },
        hackerone: {
            name: 'HackerOne Style',
            sections: ['title', 'summary', 'severity', 'asset', 'evidence', 'findings', 'impact', 'reproduction', 'remediation', 'notes']
        },
        bugcrowd: {
            name: 'Bugcrowd Style',
            sections: ['title', 'severity', 'asset', 'summary', 'evidence', 'findings', 'reproduction', 'impact', 'remediation', 'notes']
        },
        yeswehack: {
            name: 'YesWeHack Style',
            sections: ['title', 'asset', 'severity', 'summary', 'evidence', 'findings', 'reproduction', 'impact', 'remediation', 'notes']
        }
    },

    // Severity mapping for reports
    severityMapping: {
        high: {
            cvss: '7.0 - 8.9',
            label: 'High',
            description: 'Significant potential impact if confirmed'
        },
        medium: {
            cvss: '4.0 - 6.9',
            label: 'Medium',
            description: 'Moderate potential impact'
        },
        low: {
            cvss: '0.1 - 3.9',
            label: 'Low',
            description: 'Limited potential impact'
        },
        info: {
            cvss: 'N/A',
            label: 'Informational',
            description: 'No direct security impact'
        }
    },

    /**
     * Generate a report from analysis data
     * @param {object} data - Report data
     * @param {string} template - Template name
     * @param {string} format - Output format (markdown/text)
     * @returns {string} Generated report
     */
    generate(data, template = 'generic', format = 'markdown') {
        const templateConfig = this.templates[template] || this.templates.generic;
        
        const reportData = this.prepareData(data);
        
        if (format === 'markdown') {
            return this.generateMarkdown(reportData, templateConfig);
        } else {
            return this.generateText(reportData, templateConfig);
        }
    },

    /**
     * Prepare and validate report data
     * @param {object} data - Raw data
     * @returns {object} Prepared data
     */
    prepareData(data) {
        const severityInfo = this.severityMapping[data.severity] || this.severityMapping.info;
        
        return {
            title: data.title || this.generateTitle(data),
            target: data.target || data.domain || 'Unknown',
            asset: data.asset || data.url || 'Unknown',
            company: data.company || '',
            program: data.program || '',
            evidenceUrl: data.evidenceUrl || data.resultUrl || '',
            filename: data.filename || '',
            findings: data.findings || [],
            severity: severityInfo,
            rawSeverity: data.severity || 'info',
            summary: data.summary || this.generateSummary(data),
            impact: data.impact || this.generateImpact(data),
            reproduction: this.generateReproduction(data),
            remediation: this.generateRemediation(data),
            notes: data.notes || '',
            generatedAt: new Date().toISOString(),
            disclaimer: this.getDisclaimer()
        };
    },

    /**
     * Generate report title
     * @param {object} data - Report data
     * @returns {string} Title
     */
    generateTitle(data) {
        const severity = (data.severity || 'info').toUpperCase();
        const domain = data.domain || data.target || 'Unknown Domain';
        const filename = data.filename || 'Configuration File';
        
        return `[${severity}] Potential Sensitive Data Exposure in ${filename} on ${domain}`;
    },

    /**
     * Generate summary text
     * @param {object} data - Report data
     * @returns {string} Summary
     */
    generateSummary(data) {
        const domain = data.domain || data.target || 'the target';
        const filename = data.filename || 'a configuration file';
        const findingCount = data.findings?.length || 0;
        
        let summary = `During passive reconnaissance using publicly available urlscan.io data, `;
        summary += `a potentially sensitive file (${filename}) was observed on ${domain}. `;
        
        if (findingCount > 0) {
            summary += `Analysis of the publicly visible content revealed ${findingCount} pattern(s) `;
            summary += `that may indicate sensitive data exposure. `;
        }
        
        summary += `This finding requires manual verification to confirm its security impact.`;
        
        return summary;
    },

    /**
     * Generate impact assessment
     * @param {object} data - Report data
     * @returns {string} Impact text
     */
    generateImpact(data) {
        const findings = data.findings || [];
        const impacts = [];

        // Check for specific finding categories
        const hasSecrets = findings.some(f => 
            f.categoryKey === 'potentialSecrets' || f.categoryKey === 'databaseStrings'
        );
        const hasCloudConfig = findings.some(f => 
            f.categoryKey === 'cloudConfigs' || f.categoryKey === 'firebaseConfig'
        );
        const hasInternalInfo = findings.some(f => 
            f.categoryKey === 'internalHostnames' || f.categoryKey === 'privateIPs'
        );
        const hasApiEndpoints = findings.some(f => 
            f.categoryKey === 'apiEndpoints' || f.categoryKey === 'webhookURLs'
        );

        if (hasSecrets) {
            impacts.push('Potential exposure of credentials or API keys could lead to unauthorized access');
        }
        if (hasCloudConfig) {
            impacts.push('Cloud service configurations may allow unauthorized access to backend resources');
        }
        if (hasInternalInfo) {
            impacts.push('Internal infrastructure details may aid further reconnaissance');
        }
        if (hasApiEndpoints) {
            impacts.push('Exposed API endpoints may be targeted for unauthorized operations');
        }

        if (impacts.length === 0) {
            impacts.push('The exposed information may provide reconnaissance value to attackers');
        }

        let impact = 'If the detected patterns represent actual sensitive data, the potential impact includes:\n\n';
        impact += impacts.map(i => `• ${i}`).join('\n');
        impact += '\n\n**Note:** This assessment is based on pattern matching only. ';
        impact += 'Actual impact depends on whether the detected patterns represent real credentials or sensitive data.';

        return impact;
    },

    /**
     * Generate reproduction steps
     * @param {object} data - Report data
     * @returns {string} Reproduction steps
     */
    generateReproduction(data) {
        const steps = [
            '1. Navigate to urlscan.io',
            `2. Search for: page.domain:"${data.domain || '[target]'}" AND filename:"${data.filename || '[filename]'}"`,
            '3. Review the search results for matching scans',
            `4. Open the scan result: ${data.evidenceUrl || data.resultUrl || '[result URL]'}`,
            '5. Navigate to the HTTP Transactions tab',
            `6. Locate the response for ${data.filename || 'the target file'}`,
            '7. Review the response content for the patterns described in this report'
        ];

        return steps.join('\n');
    },

    /**
     * Generate remediation recommendations
     * @param {object} data - Report data
     * @returns {string} Remediation text
     */
    generateRemediation(data) {
        const recommendations = [
            'Review the file contents to determine if sensitive data is actually exposed',
            'If sensitive data is confirmed, immediately rotate any exposed credentials',
            'Remove or restrict access to configuration files containing sensitive data',
            'Implement proper access controls to prevent unauthorized file access',
            'Consider using environment variables or secure vaults for sensitive configuration',
            'Add the file path to robots.txt and implement proper authentication',
            'Review build processes to ensure sensitive data is not bundled into public assets',
            'Set up monitoring for access to sensitive files'
        ];

        return recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n');
    },

    /**
     * Get standard disclaimer
     * @returns {string} Disclaimer text
     */
    getDisclaimer() {
        return `DISCLAIMER: This report was generated through passive analysis of publicly available data from urlscan.io. No active scanning, exploitation, or unauthorized access was performed. The findings represent POTENTIAL issues based on pattern matching and require manual verification. The researcher makes no claims of confirmed vulnerability without proper validation.`;
    },

    /**
     * Generate Markdown formatted report
     * @param {object} data - Prepared report data
     * @param {object} template - Template configuration
     * @returns {string} Markdown report
     */
    generateMarkdown(data, template) {
        const sections = [];

        // Header
        sections.push(`# ${data.title}\n`);
        sections.push(`**Generated:** ${new Date(data.generatedAt).toLocaleString()}`);
        sections.push(`**Tool:** RECON SENTINEL - Passive Reconnaissance Platform\n`);
        sections.push('---\n');

        // Build sections based on template order
        template.sections.forEach(section => {
            switch (section) {
                case 'title':
                    // Already added above
                    break;
                    
                case 'summary':
                    sections.push('## Summary\n');
                    sections.push(data.summary + '\n');
                    break;
                    
                case 'severity':
                    sections.push('## Severity Assessment\n');
                    sections.push(`**Suggested Severity:** ${data.severity.label}`);
                    sections.push(`**CVSS Range:** ${data.severity.cvss}`);
                    sections.push(`**Note:** ${data.severity.description}\n`);
                    break;
                    
                case 'asset':
                    sections.push('## Affected Asset\n');
                    sections.push(`**Target:** ${data.target}`);
                    if (data.company) sections.push(`**Company:** ${data.company}`);
                    if (data.program) sections.push(`**Program:** ${data.program}`);
                    sections.push(`**Affected File:** ${data.filename}`);
                    sections.push(`**Asset URL:** ${data.asset}\n`);
                    break;
                    
                case 'evidence':
                    sections.push('## Evidence Source\n');
                    sections.push(`**URLScan Result:** ${data.evidenceUrl}`);
                    sections.push('**Type:** Publicly Available Scan Data\n');
                    break;
                    
                case 'findings':
                    sections.push('## Observed Patterns\n');
                    if (data.findings && data.findings.length > 0) {
                        sections.push('The following patterns were detected in the publicly visible file content:\n');
                        data.findings.forEach((finding, i) => {
                            sections.push(`### Finding ${i + 1}: ${finding.category}`);
                            sections.push(`**Severity:** ${finding.severity.toUpperCase()}`);
                            sections.push(`**Pattern:** \`${finding.match}\``);
                            sections.push(`**Reason:** ${finding.reason}\n`);
                        });
                    } else {
                        sections.push('No specific patterns were automatically detected. Manual review recommended.\n');
                    }
                    break;
                    
                case 'impact':
                    sections.push('## Potential Impact\n');
                    sections.push(data.impact + '\n');
                    break;
                    
                case 'reproduction':
                    sections.push('## Steps to Reproduce (Passive Only)\n');
                    sections.push(data.reproduction + '\n');
                    break;
                    
                case 'remediation':
                    sections.push('## Recommended Remediation\n');
                    sections.push(data.remediation + '\n');
                    break;
                    
                case 'notes':
                    if (data.notes) {
                        sections.push('## Additional Notes\n');
                        sections.push(data.notes + '\n');
                    }
                    break;
            }
        });

        // Disclaimer
        sections.push('---\n');
        sections.push('## Disclaimer\n');
        sections.push(data.disclaimer);

        return sections.join('\n');
    },

    /**
     * Generate plain text formatted report
     * @param {object} data - Prepared report data
     * @param {object} template - Template configuration
     * @returns {string} Plain text report
     */
    generateText(data, template) {
        const lines = [];
        const divider = '='.repeat(60);
        const subDivider = '-'.repeat(40);

        // Header
        lines.push(divider);
        lines.push(data.title.toUpperCase());
        lines.push(divider);
        lines.push('');
        lines.push(`Generated: ${new Date(data.generatedAt).toLocaleString()}`);
        lines.push('Tool: RECON SENTINEL - Passive Reconnaissance Platform');
        lines.push('');
        lines.push(divider);
        lines.push('');

        // Build sections based on template order
        template.sections.forEach(section => {
            switch (section) {
                case 'title':
                    break;
                    
                case 'summary':
                    lines.push('SUMMARY');
                    lines.push(subDivider);
                    lines.push(data.summary);
                    lines.push('');
                    break;
                    
                case 'severity':
                    lines.push('SEVERITY ASSESSMENT');
                    lines.push(subDivider);
                    lines.push(`Suggested Severity: ${data.severity.label}`);
                    lines.push(`CVSS Range: ${data.severity.cvss}`);
                    lines.push(`Note: ${data.severity.description}`);
                    lines.push('');
                    break;
                    
                case 'asset':
                    lines.push('AFFECTED ASSET');
                    lines.push(subDivider);
                    lines.push(`Target: ${data.target}`);
                    if (data.company) lines.push(`Company: ${data.company}`);
                    if (data.program) lines.push(`Program: ${data.program}`);
                    lines.push(`Affected File: ${data.filename}`);
                    lines.push(`Asset URL: ${data.asset}`);
                    lines.push('');
                    break;
                    
                case 'evidence':
                    lines.push('EVIDENCE SOURCE');
                    lines.push(subDivider);
                    lines.push(`URLScan Result: ${data.evidenceUrl}`);
                    lines.push('Type: Publicly Available Scan Data');
                    lines.push('');
                    break;
                    
                case 'findings':
                    lines.push('OBSERVED PATTERNS');
                    lines.push(subDivider);
                    if (data.findings && data.findings.length > 0) {
                        lines.push('The following patterns were detected:');
                        lines.push('');
                        data.findings.forEach((finding, i) => {
                            lines.push(`[${i + 1}] ${finding.category}`);
                            lines.push(`    Severity: ${finding.severity.toUpperCase()}`);
                            lines.push(`    Pattern: ${finding.match}`);
                            lines.push(`    Reason: ${finding.reason}`);
                            lines.push('');
                        });
                    } else {
                        lines.push('No specific patterns automatically detected.');
                        lines.push('');
                    }
                    break;
                    
                case 'impact':
                    lines.push('POTENTIAL IMPACT');
                    lines.push(subDivider);
                    lines.push(data.impact.replace(/\*\*/g, '').replace(/•/g, '-'));
                    lines.push('');
                    break;
                    
                case 'reproduction':
                    lines.push('STEPS TO REPRODUCE (PASSIVE ONLY)');
                    lines.push(subDivider);
                    lines.push(data.reproduction);
                    lines.push('');
                    break;
                    
                case 'remediation':
                    lines.push('RECOMMENDED REMEDIATION');
                    lines.push(subDivider);
                    lines.push(data.remediation);
                    lines.push('');
                    break;
                    
                case 'notes':
                    if (data.notes) {
                        lines.push('ADDITIONAL NOTES');
                        lines.push(subDivider);
                        lines.push(data.notes);
                        lines.push('');
                    }
                    break;
            }
        });

        // Disclaimer
        lines.push(divider);
        lines.push('DISCLAIMER');
        lines.push(divider);
        lines.push('');
        lines.push(data.disclaimer);

        return lines.join('\n');
    },

    /**
     * Export findings as JSON
     * @param {object} data - Report data
     * @returns {string} JSON string
     */
    exportJSON(data) {
        const exportData = {
            meta: {
                tool: 'RECON SENTINEL',
                version: '1.0.0',
                exportedAt: new Date().toISOString(),
                type: 'passive_reconnaissance'
            },
            target: {
                domain: data.domain || data.target,
                company: data.company || null,
                program: data.program || null
            },
            finding: {
                title: data.title || this.generateTitle(data),
                severity: data.severity,
                filename: data.filename,
                url: data.url || data.asset,
                evidenceUrl: data.evidenceUrl || data.resultUrl
            },
            analysis: {
                findings: data.findings || [],
                summary: data.summary || this.generateSummary(data)
            },
            disclaimer: this.getDisclaimer()
        };

        return JSON.stringify(exportData, null, 2);
    },

    /**
     * Get available templates
     * @returns {array} Template list
     */
    getTemplates() {
        return Object.entries(this.templates).map(([key, value]) => ({
            id: key,
            name: value.name
        }));
    },

    /**
     * Download report as file
     * @param {string} content - Report content
     * @param {string} filename - Filename
     * @param {string} type - MIME type
     */
    download(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Copy report to clipboard
     * @param {string} content - Content to copy
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard(content) {
        try {
            await navigator.clipboard.writeText(content);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = content;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textarea);
                return true;
            } catch {
                document.body.removeChild(textarea);
                return false;
            }
        }
    }
};
