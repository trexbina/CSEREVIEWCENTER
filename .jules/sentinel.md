## 2026-10-27 - Implement Content Security Policy in Next.js
**Vulnerability:** Absence of Content Security Policy and other important security headers (X-Frame-Options, X-Content-Type-Options) in the Next.js frontend, opening up risks to clickjacking and varied XSS attacks.
**Learning:** Using next.config.mjs to inject default security headers on all `/(.*)` routes is a clean way to ensure broad protection across all pages, API endpoints, and images. I had to accommodate existing image domains and basic script sources.
**Prevention:** Ensure new Next.js projects inherently have a standard set of headers enabled at the configuration level right from creation.
