/**
 * RECON SENTINEL - URLScan Module
 * Handles urlscan.io API interactions
 * 
 * NOTE: This module works within static site constraints.
 * Direct API calls may be limited by CORS and rate limits.
 * The app provides fallback mechanisms for manual searches.
 */

const URLScan = {
    // API Configuration
    config: {
        baseUrl: 'https://urlscan.io/api/v1',
        searchUrl: 'https://urlscan.io/api/v1/search/',
        resultUrl: 'https://urlscan.io/result/',
        httpUrl: 'https://urlscan.io/responses/',
        rateLimit: 60, // requests per minute for free tier
        retryDelay: 2000
    },

    // State
    state: {
        requestCount: 0,
        lastRequestTime: null,
        isRateLimited: false
    },

    /**
     * Get API key from storage
     * @returns {string|null} API key
     */
    getApiKey() {
        return Storage.getApiKey();
    },

    /**
     * Build search query string
     * @param {string} domain - Target domain
     * @param {string} filename - File keyword
     * @param {string} urlKeyword - Optional URL keyword
     * @returns {string} Search query
     */
    buildQuery(domain, filename, urlKeyword = null) {
        let query = `page.domain:"${domain}" AND filename:"${filename}"`;
        
        if (urlKeyword && urlKeyword.trim()) {
            query += ` AND page.url:"${urlKeyword.trim()}"`;
        }
        
        return query;
    },

    /**
     * Generate multiple queries for a domain and file list
     * @param {string} domain - Target domain
     * @param {array} files - Array of filenames
     * @param {string} urlKeyword - Optional URL keyword
     * @returns {array} Array of query objects
     */
    generateQueries(domain, files, urlKeyword = null) {
        if (!domain || !files || files.length === 0) {
            return [];
        }

        return files.map(filename => ({
            query: this.buildQuery(domain, filename, urlKeyword),
            domain: domain,
            filename: filename,
            urlKeyword: urlKeyword,
            searchUrl: this.getSearchUrl(domain, filename, urlKeyword)
        }));
    },

    /**
     * Get urlscan.io search URL for manual searching
     * @param {string} domain - Target domain
     * @param {string} filename - File keyword
     * @param {string} urlKeyword - Optional URL keyword
     * @returns {string} Search URL
     */
    getSearchUrl(domain, filename, urlKeyword = null) {
        const query = this.buildQuery(domain, filename, urlKeyword);
        return `https://urlscan.io/search/#${encodeURIComponent(query)}`;
    },

    /**
     * Search urlscan.io API
     * @param {string} query - Search query
     * @param {number} size - Number of results (max 100)
     * @returns {Promise<object>} Search results
     */
    async search(query, size = 20) {
        const apiKey = this.getApiKey();
        
        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            // Add API key if available
            if (apiKey) {
                headers['API-Key'] = apiKey;
            }

            const url = `${this.config.searchUrl}?q=${encodeURIComponent(query)}&size=${size}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            if (response.status === 429) {
                this.state.isRateLimited = true;
                throw new Error('Rate limited by urlscan.io. Please try again later or add an API key.');
            }

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            this.state.requestCount++;
            this.state.lastRequestTime = Date.now();

            return {
                success: true,
                results: data.results || [],
                total: data.total || 0,
                took: data.took || 0,
                hasMore: data.has_more || false
            };

        } catch (error) {
            // CORS or network error - fall back to manual mode
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                return {
                    success: false,
                    error: 'CORS_ERROR',
                    message: 'Direct API access blocked. Use the manual search link.',
                    manualUrl: this.getSearchUrl(query.match(/page\.domain:"([^"]+)"/)?.[1] || '', '')
                };
            }

            return {
                success: false,
                error: error.message,
                message: error.message
            };
        }
    },

    /**
     * Get detailed result from urlscan.io
     * @param {string} uuid - Scan UUID
     * @returns {Promise<object>} Detailed result
     */
    async getResult(uuid) {
        try {
            const response = await fetch(`${this.config.baseUrl}/result/${uuid}/`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch result: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Get HTTP transaction data (responses) from a scan
     * @param {string} uuid - Scan UUID
     * @returns {Promise<object>} HTTP data
     */
    async getHttpData(uuid) {
        try {
            // This typically requires direct access which may be CORS blocked
            const response = await fetch(`${this.config.httpUrl}${uuid}/`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch HTTP data: ${response.status}`);
            }

            return await response.text();
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'HTTP data not directly accessible. View on urlscan.io.'
            };
        }
    },

    /**
     * Parse search result into standardized format
     * @param {object} result - Raw search result
     * @returns {object} Parsed result
     */
    parseResult(result) {
        return {
            id: result._id || '',
            uuid: result.task?.uuid || '',
            url: result.page?.url || '',
            domain: result.page?.domain || '',
            ip: result.page?.ip || '',
            country: result.page?.country || '',
            server: result.page?.server || '',
            mimeType: result.page?.mimeType || '',
            status: result.page?.status || '',
            title: result.page?.title || '',
            time: result.task?.time || '',
            visibility: result.task?.visibility || '',
            reportUrl: result.result || '',
            screenshotUrl: result.screenshot || '',
            matchedFilename: null, // Will be set by caller
            analysis: null // Will be set after content analysis
        };
    },

    /**
     * Extract filename from URL
     * @param {string} url - URL to parse
     * @returns {string|null} Filename
     */
    extractFilename(url) {
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            const parts = path.split('/');
            const filename = parts[parts.length - 1];
            return filename || null;
        } catch {
            return null;
        }
    },

    /**
     * Generate result page URL
     * @param {string} uuid - Scan UUID
     * @returns {string} Result URL
     */
    getResultPageUrl(uuid) {
        return `${this.config.resultUrl}${uuid}/`;
    },

    /**
     * Generate HTTP transactions URL
     * @param {string} uuid - Scan UUID
     * @returns {string} HTTP transactions URL
     */
    getHttpTransactionsUrl(uuid) {
        return `${this.config.resultUrl}${uuid}/#transactions`;
    },

    /**
     * Check if API key is configured
     * @returns {boolean} Has API key
     */
    hasApiKey() {
        return !!this.getApiKey();
    },

    /**
     * Get rate limit status
     * @returns {object} Rate limit info
     */
    getRateLimitStatus() {
        return {
            isLimited: this.state.isRateLimited,
            requestCount: this.state.requestCount,
            lastRequest: this.state.lastRequestTime,
            hasApiKey: this.hasApiKey()
        };
    },

    /**
     * Reset rate limit state
     */
    resetRateLimit() {
        this.state.isRateLimited = false;
        this.state.requestCount = 0;
    },

    /**
     * Perform a hunt operation with multiple queries
     * @param {string} domain - Target domain
     * @param {array} files - Array of filenames
     * @param {string} urlKeyword - Optional URL keyword
     * @param {function} onProgress - Progress callback
     * @returns {Promise<object>} Hunt results
     */
    async hunt(domain, files, urlKeyword = null, onProgress = null) {
        const queries = this.generateQueries(domain, files, urlKeyword);
        const results = [];
        const errors = [];
        let directAccessBlocked = false;

        for (let i = 0; i < queries.length; i++) {
            const queryInfo = queries[i];
            
            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: queries.length,
                    filename: queryInfo.filename,
                    status: 'searching'
                });
            }

            try {
                const searchResult = await this.search(queryInfo.query, 10);
                
                if (searchResult.success) {
                    // Add filename to each result
                    const parsedResults = searchResult.results.map(r => {
                        const parsed = this.parseResult(r);
                        parsed.matchedFilename = queryInfo.filename;
                        return parsed;
                    });
                    
                    results.push(...parsedResults);
                } else if (searchResult.error === 'CORS_ERROR') {
                    directAccessBlocked = true;
                    errors.push({
                        filename: queryInfo.filename,
                        error: 'CORS blocked',
                        manualUrl: queryInfo.searchUrl
                    });
                } else {
                    errors.push({
                        filename: queryInfo.filename,
                        error: searchResult.message
                    });
                }

                // Add delay between requests to avoid rate limiting
                if (i < queries.length - 1) {
                    await this.delay(500);
                }

            } catch (error) {
                errors.push({
                    filename: queryInfo.filename,
                    error: error.message
                });
            }
        }

        return {
            success: results.length > 0 || !directAccessBlocked,
            results: this.deduplicateResults(results),
            errors,
            totalQueries: queries.length,
            directAccessBlocked,
            queries // Include queries for manual fallback
        };
    },

    /**
     * Deduplicate results by UUID
     * @param {array} results - Array of results
     * @returns {array} Deduplicated results
     */
    deduplicateResults(results) {
        const seen = new Set();
        return results.filter(result => {
            const key = result.uuid || result.url;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    },

    /**
     * Delay helper
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Delay promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Simulate search results for demo/fallback mode
     * @param {string} domain - Target domain
     * @param {string} filename - Filename
     * @returns {object} Simulated result
     */
    createDemoResult(domain, filename) {
        const uuid = `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return {
            id: uuid,
            uuid: uuid,
            url: `https://${domain}/${filename}`,
            domain: domain,
            ip: '0.0.0.0',
            country: 'XX',
            server: 'Demo Server',
            mimeType: 'application/javascript',
            status: 200,
            title: `${domain} - ${filename}`,
            time: new Date().toISOString(),
            visibility: 'public',
            reportUrl: `https://urlscan.io/result/${uuid}/`,
            screenshotUrl: '',
            matchedFilename: filename,
            isDemo: true,
            analysis: null
        };
    }
};
