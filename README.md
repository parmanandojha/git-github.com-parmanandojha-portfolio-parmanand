# Parmanand Ojha — portfolio

React (Vite) + Tailwind CSS v4. Local dev: `npm run dev` · production build: `npm run build`.

## Typography

The primary font is loaded from **`src/P.woff`** (declared in `src/index.css` as the **Neue Montreal** family for `font-sans`). Vite bundles it from the CSS `url()`.

## URLs (shareable)

| Path       | Section        |
| ---------- | -------------- |
| `/work`    | Work catalogue |
| `/gallery` | Selected       |
| `/book`    | Book           |
| `/about`   | Overview       |

`/` redirects to `/work`.

## Deploying (client-side routes)

- **Netlify**: `public/_redirects` sends all routes to `index.html`.
- **Vercel**: `vercel.json` rewrites are included.

For other hosts, configure a **SPA fallback** to `index.html` so `/gallery` et al. load correctly.

## After you go live

1. Open the site and confirm **Open Graph / Twitter** previews (e.g. Facebook Sharing Debugger, Twitter Card Validator) — `og:image` uses `/og-image.svg`; some networks prefer **PNG/JPEG** (export `public/og-image.png` and update `src/utils/seo.js` + `index.html` if needed).
2. Confirm the **Behance** URL in `Book.jsx` matches your real profile.
3. Optional: add a real **`sitemap.xml`** and reference it from `robots.txt`.
