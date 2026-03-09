# RECON SENTINEL

<div align="center">

![RECON SENTINEL](https://img.shields.io/badge/RECON-SENTINEL-00d4ff?style=for-the-badge&labelColor=0a0a0a)
![Version](https://img.shields.io/badge/version-1.0.0-ff6b35?style=for-the-badge&labelColor=0a0a0a)
![License](https://img.shields.io/badge/license-MIT-00ff88?style=for-the-badge&labelColor=0a0a0a)

**Futuristic Bug Bounty Intelligence Platform**

*A premium static website for authorized security researchers to analyze public URLScan.io data and generate professional responsible disclosure reports.*

[Live Demo](#deployment) • [Features](#features) • [Setup](#setup) • [Usage](#usage) • [API](#urlscan-api)

</div>

---

## ⚠️ IMPORTANT DISCLAIMER

**This tool is for AUTHORIZED SECURITY RESEARCH ONLY.**

- ✅ Only analyzes publicly visible URLScan.io data
- ✅ Passive reconnaissance only - NO active scanning
- ✅ NO exploitation, fuzzing, or brute forcing
- ✅ Generates responsible disclosure drafts, NOT exploit code
- ❌ Do NOT use on targets you don't have explicit authorization to assess
- ❌ Do NOT use findings to exploit or harm systems

**By using this tool, you agree to use it responsibly and ethically for authorized security research purposes only.**

---

## Features

### 🎯 Core Capabilities

- **Domain Intelligence** - Enter a target domain and search for exposed configuration files
- **Smart Presets** - Pre-configured lists of sensitive file patterns organized by category
- **Custom Files** - Add your own file patterns to search for
- **Query Builder** - Automatically generates URLScan.io search queries
- **Results Dashboard** - View and filter search results with severity indicators
- **Response Inspector** - Analyze response content for sensitive patterns
- **Heuristics Engine** - Automatic detection of potentially sensitive data patterns
- **Report Generator** - Professional bug bounty report templates

### 🔬 Heuristics Detection

The built-in heuristics engine detects:

| Category | Severity | Examples |
|----------|----------|----------|
| Cloud Configs | High | AWS keys, S3 URLs, Firebase configs |
| Database Strings | High | MongoDB, PostgreSQL connection strings |
| Potential Secrets | High | API keys, tokens, credentials patterns |
| API Endpoints | Medium | REST endpoints, base URLs |
| Internal Hostnames | Medium | .internal, .local, .corp domains |
| Auth References | Medium | OAuth configs, token URLs |
| Webhook URLs | Medium | Callback URLs, webhook endpoints |
| Firebase Config | Medium | Firebase initialization objects |
| Private IPs | Low | RFC1918 addresses (10.x, 192.168.x) |
| Environment Indicators | Low | Staging, dev, test references |
| Debug Flags | Low | Debug=true, verbose mode |
| Admin Paths | Low | /admin, /dashboard paths |
| Source Maps | Info | .map file references |
| Email Addresses | Info | Email patterns in code |

### 📝 Report Templates

- **Generic** - Standard responsible disclosure format
- **HackerOne** - Optimized for HackerOne submissions
- **Bugcrowd** - Formatted for Bugcrowd platform
- **YesWeHack** - YesWeHack-compatible format

### 💾 Export Options

- Copy to clipboard
- Download as Markdown (.md)
- Download as plain text (.txt)
- Export findings as JSON

### 🎨 Premium UI

- Terminator-AI inspired dark theme
- Glassmorphism panels with glowing borders
- Custom animated cursor with trails
- Scanline overlay effects
- Animated grid background
- Smooth panel transitions
- Terminal-style logging
- Boot sequence animation

---

## Setup

### Requirements

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection (for URLScan.io API access)
- No server required - runs entirely in browser

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/recon-sentinel.git
   cd recon-sentinel
   ```

2. **Open directly in browser:**
   ```bash
   # Simply open index.html in your browser
   open index.html        # macOS
   start index.html       # Windows
   xdg-open index.html    # Linux
   ```

3. **Or use a local server (recommended):**
   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js
   npx serve .

   # PHP
   php -S localhost:8000
   ```

4. **Navigate to:**
   ```
   http://localhost:8000
   ```

---

## Deployment

### GitHub Pages

1. **Fork or push this repository to GitHub**

2. **Enable GitHub Pages:**
   - Go to repository Settings
   - Navigate to "Pages" section
   - Source: Deploy from a branch
   - Branch: `main` (or `master`)
   - Folder: `/ (root)`
   - Click Save

3. **Access your site:**
   ```
   https://yourusername.github.io/recon-sentinel/
   ```

### Other Static Hosting

This site works on any static hosting platform:

- **Netlify** - Drag and drop the folder
- **Vercel** - Import from Git
- **Cloudflare Pages** - Connect to repository
- **AWS S3** - Upload files to bucket with static hosting
- **Firebase Hosting** - Deploy with CLI

---

## Usage

### Basic Workflow

1. **Accept Authorization** - Confirm you understand the terms of use

2. **Enter Target Domain** - Input the domain you're authorized to assess
   ```
   example.com
   ```

3. **Select File Patterns** - Choose from presets or add custom patterns
   - Config Files: `config.js`, `config.json`
   - Environment: `env.js`, `.env.js`
   - API: `api.js`, `endpoints.js`
   - Cloud: `aws-exports.js`, `firebase-config.js`

4. **Start Hunt** - Click "INITIATE HUNT" to search URLScan.io

5. **Review Results** - Examine found files for sensitive data

6. **Analyze & Report** - Generate professional disclosure reports

### Query Examples

The tool builds URLScan.io queries like:

```
page.domain:"example.com" AND filename:"config.js"
page.domain:"example.com" AND filename:"env.js"
page.domain:"example.com" AND filename:"aws-exports.js"
```

With optional URL keyword filter:
```
page.domain:"example.com" AND filename:"config.js" AND page.url:"api"
```

---

## URLScan API

### Rate Limits

| Mode | Searches/Min | Notes |
|------|--------------|-------|
| No API Key | ~2 | Public rate limit, may hit CORS |
| With API Key | ~10 | Higher limits, better access |

### Getting an API Key

1. Create a free account at [URLScan.io](https://urlscan.io)
2. Go to Profile → API
3. Copy your API key
4. Paste in RECON SENTINEL Settings

**Note:** API keys are stored ONLY in your browser's localStorage and are NEVER sent anywhere except URLScan.io.

### CORS Handling

When direct API access is blocked by CORS, the tool provides:

- Manual search links to open directly on URLScan.io
- Instructions for using the API key
- Graceful fallbacks with helpful guidance

---

## File Structure

```
recon-sentinel/
├── index.html              # Main HTML structure
├── README.md               # This file
├── css/
│   ├── styles.css          # Core styles
│   └── animations.css      # Animation library
├── js/
│   ├── app.js              # Main application controller
│   ├── ui.js               # UI components & effects
│   ├── urlscan.js          # URLScan.io API module
│   ├── heuristics.js       # Sensitivity detection engine
│   ├── reports.js          # Report generation
│   └── storage.js          # localStorage management
└── assets/                 # (optional) Images/icons
```

---

## Heuristics Logic

The sensitivity detection engine uses pattern matching with context awareness:

### Detection Flow

1. **Pattern Matching** - Regex patterns per category
2. **Context Extraction** - 50 chars surrounding match
3. **Severity Assignment** - High/Medium/Low/Info
4. **Sanitization** - Redacts middle of sensitive strings
5. **Deduplication** - Removes duplicate findings

### Example Patterns

```javascript
// Cloud Configs (High)
/AKIA[0-9A-Z]{16}/               // AWS Access Key ID
/s3\.amazonaws\.com/             // S3 URLs
/\.blob\.core\.windows\.net/     // Azure Blob

// Database Strings (High)
/mongodb(\+srv)?:\/\//           // MongoDB URI
/postgres(ql)?:\/\//             // PostgreSQL URI

// API Endpoints (Medium)
/["']\/api\/v[0-9]+/             // API versioned paths
/baseUrl["'\s]*[:=]/             // Base URL configs

// Private IPs (Low)
/\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/    // 10.x.x.x
/\b192\.168\.\d{1,3}\.\d{1,3}\b/       // 192.168.x.x
```

---

## Sample Report Output

```markdown
# Security Finding Report

## Summary
**Target:** example.com
**Asset:** https://example.com/static/js/config.js
**Severity:** Medium
**Category:** Configuration Exposure

## Description
During authorized passive reconnaissance using public URLScan.io data,
a potentially sensitive configuration file was identified.

## Evidence
- **Source:** URLScan.io (Public)
- **URL:** https://example.com/static/js/config.js
- **Observed Patterns:**
  - API Endpoints detected (3 instances)
  - Internal hostname reference (1 instance)

## Potential Impact
Exposed configuration files may reveal:
- Internal API structure
- Development/staging environments
- Authentication endpoints

## Reproduction Steps (Passive Only)
1. Navigate to: https://urlscan.io/search/#page.domain...
2. Observe the publicly cached response data
3. Review the highlighted patterns

## Recommendations
1. Review the exposed file for sensitive data
2. Consider restricting access or removing from production
3. Audit similar configuration files
4. Implement Content-Security-Policy headers

## Disclaimer
This finding is based solely on publicly visible data from URLScan.io.
No active scanning, exploitation, or unauthorized access was performed.
```

---

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome 90+ | ✅ Full |
| Firefox 88+ | ✅ Full |
| Edge 90+ | ✅ Full |
| Safari 14+ | ✅ Full |
| Mobile Browsers | ✅ Responsive |

---

## Security Considerations

- **No Backend** - All processing happens in your browser
- **API Keys Local** - Stored only in localStorage, never transmitted except to URLScan.io
- **No Tracking** - No analytics or telemetry
- **Open Source** - Full code visibility

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [URLScan.io](https://urlscan.io) - Public scanning platform
- Security research community
- Bug bounty programs for making the internet safer

---

<div align="center">

**Built for the security research community** 🔐

*Use responsibly. Hunt ethically.*

</div>
