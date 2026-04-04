# PDF Viewer Strategy and Tuning Guide

## Purpose
This guide documents architecture choices and tuning recommendations for secure PDF delivery in the student dashboard, with a focus on balancing:

- intellectual property protection,
- visual quality,
- user device performance,
- maintainability.

## Current Recommended Approach (Implemented)
Student PDF viewing is rendered with React-PDF using canvas pages (not native iframe PDF plugin), with:

- `renderTextLayer={false}`
- `renderAnnotationLayer={false}`
- context-menu/copy/select prevention in student mode
- dynamic watermarking
- adaptive quality tiers (`Q1`, `Q2`) based on device capability.

### Why this approach
Native browser PDF viewers are faster in many cases, but they are engine-level components and cannot be reliably controlled for strict right-click/highlight restrictions. React-PDF gives security control at the app layer, which is required for student content protection.

## Why Native Viewer Feels Faster
Native viewer (`iframe`/plugin) typically uses browser-engine optimized paths (often C++ internals, aggressive caching, viewport-specific rendering). It may feel smoother on large files, but:

- right-click and save behaviors are harder to block,
- text highlight may still be available depending on browser,
- platform-level extraction controls are weaker.

## Adaptive Quality Logic (Q1/Q2)
### Q1 (higher quality)
Use for stronger devices (desktop-class):

- higher pixel density,
- tighter side padding,
- better sharpness at normal zoom.

### Q2 (balanced quality)
Use for lower-power or mobile/coarse-pointer devices:

- lower pixel density cap,
- larger side padding,
- improved stability and lower memory/CPU pressure.

### Inputs used for tiering
- user agent mobile detection,
- coarse pointer media query,
- `hardwareConcurrency`,
- `deviceMemory` (if available).

## High-Impact Performance Tuning (Future)
Order below is recommended by impact/effort ratio.

1. Page virtualization
- Render only visible pages + small buffer.
- Biggest improvement for long PDFs.

2. Progressive rendering
- Prioritize page 1 and nearby pages first.
- Defer far pages during initial load.

3. Zoom debounce
- Delay full rerender when zoom is rapidly changing.

4. Render cache policy
- Keep nearby rendered pages in memory.
- Evict far-away pages under memory pressure.

5. Adaptive DPR under zoom
- Lower effective DPR at very high zoom to avoid memory spikes.

## Alternative Architectures for Stronger Protection
### A. Server-rendered image pages (student mode)
Server converts PDF pages to images and delivers them as protected assets.

Pros:
- strongest control over highlight/copy,
- predictable client performance for low-end devices.

Cons:
- server CPU/storage costs,
- conversion pipeline complexity,
- pagination/quality tradeoff management.

### B. Hybrid model (recommended if scaling)
- Student mode: secure image/canvas path.
- Admin/Teacher mode: richer viewer with annotation/text tools.

Pros:
- role-appropriate UX,
- tighter security for students,
- lower disruption for content managers.

### C. Commercial SDK path
Evaluate enterprise PDF SDKs if advanced features are required (forms, signatures, high-performance viewer internals).

Pros:
- mature feature set,
- optimized rendering engines.

Cons:
- licensing cost,
- integration/vendor dependency.

## Security Reality Check
No frontend-only solution can guarantee perfect prevention of data exfiltration (screenshots/cameras always exist). Goal should be layered deterrence:

- friction (disable easy copy/save actions),
- accountability (personalized watermarking),
- monitoring and policy controls.

## Rollout Checklist for Future Changes
1. Benchmark before/after on low-end mobile and mid-tier laptop.
2. Test with long PDFs (50+ pages) and image-heavy documents.
3. Verify student restrictions remain active.
4. Confirm scrollbar behavior remains single and natural.
5. Verify watermark persistence in fullscreen and zoom states.
6. Track error telemetry for PDF load/render failures.

## Decision Summary
- Use native viewer only when UX speed is priority and strict anti-copy controls are not required.
- Use React-PDF canvas when strict student protections are required.
- Add virtualization next if performance issues persist with large documents.
