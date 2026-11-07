## 2025-02-04 - Fix XSS Vulnerability in Subject Builder

**Vulnerability:** Found a Cross-Site Scripting (XSS) vulnerability in `src/components/subject-builder-client.jsx` where user-controlled content (`block.content`) was rendered using `dangerouslySetInnerHTML` without any sanitization.
**Learning:** In a Next.js application, fixing XSS with standard `dompurify` can lead to Server-Side Rendering (SSR) issues (`window is not defined`), since `dompurify` relies on the DOM.
**Prevention:** Always use `isomorphic-dompurify` (or a secure wrapper that checks for `typeof window !== 'undefined'`) when sanitizing HTML input for `dangerouslySetInnerHTML` in Next.js/React applications to avoid SSR errors.
