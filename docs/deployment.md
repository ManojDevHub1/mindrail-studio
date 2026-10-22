# Local Development and Static Deployment (`docs/DEPLOYMENT.md`)

> **Deployment Status:** Static Deployment Ready (`v0.1.0-release`). The static production bundle is built into `dist/` with relative base paths (`base: './'`), verified with 24 test suites (170 tests), and ready for GitHub Pages or any static web host with zero server runtime configuration.

## 1. Zero-Backend Static Hosting Architecture

Because MindRail Studio runs 100% client-side using browser `IndexedDB`, `localStorage`, and local file APIs ([docs/decisions/ADR-0001-local-first-no-backend.md](docs/decisions/ADR-0001-local-first-no-backend.md)), its production build is a **pure static asset directory (`dist/`)** consisting of:

- `index.html` (with strict CSP meta tag)
- Bundled and content-hashed JavaScript modules (`dist/assets/*.js`)
- Bundled and content-hashed CSS stylesheets (`dist/assets/*.css`)
- Static icons and local assets (`dist/favicon.svg`)

It requires **zero** server-side rendering (SSR), **zero** Node.js production servers, **zero** serverless functions, and **zero** cloud databases.

---

## 2. Prerequisites

- **Node.js:** `v20.x` LTS or `v22.x` LTS
- **Package Manager:** `npm` `v10+`
- **Git:** `v2.35+`

---

## 3. Local Development, Build, and Preview Commands

> **Important:** The commands below are the target scripts to be configured in `package.json` during **Phase 0** of [docs/IMPLEMENTATION\_PLAN.md](https://www.google.com/search?q=IMPLEMENTATION_PLAN.md).

### 3.1 Install Dependencies
```bash
npm install
```

### 3.2 Start Local Development Server
```bash
npm run dev
```
- Starts the Vite development server (default `http://localhost:5173`) with Hot Module Replacement (HMR).

### 3.3 Run Typecheck, Linter, and Tests
```bash
npm run typecheck
npm run lint
npm run test
```

### 3.4 Create Production Static Build
```bash
npm run build
```
- Runs `tsc --noEmit` to verify zero TypeScript errors, then runs `vite build` to emit optimized static files into `dist/`.

### 3.5 Preview Production Build Locally
```bash
npm run preview
```
- Starts a local static web server serving the compiled `dist/` directory (default `http://localhost:4173`) so you can verify production asset paths, CSP headers, and offline behavior before deploying.

---

## 4. Environment Configuration

MindRail Studio requires **no secret environment variables or API keys** in development or production.

Optional build-time configuration in `vite.config.ts`:
- `VITE_BASE_PATH`: Optional public base path when deploying to a subdirectory (defaults to `'./'` or `'/'`). Using relative base paths (`base: './'` in `vite.config.ts`) is strongly recommended because it allows the compiled `dist/` folder to work seamlessly whether hosted at a root domain (`https://example.com/`) or a repository subpath (`https://username.github.io/mindrail-studio/`).

---

## 5. Static Hosting Requirements & Provider Considerations

MindRail Studio can be hosted on any static file server (e.g., local `npx serve dist`, Nginx, Apache, GitHub Pages, Cloudflare Pages, or Netlify).

> **Note on Commercial Free Tiers:** While providers such as GitHub Pages, Cloudflare Pages, and Netlify currently offer free static hosting tiers suitable for open-source projects, no provider's free tier is unlimited or guaranteed to remain free forever. Because MindRail Studio is a standard static build with zero vendor-specific serverless lock-in, you can move the `dist/` output to any static host or run it locally at any time.

### 5.1 Base-Path and Asset Path Handling
- **Rule:** Configure `base: './'` in `vite.config.ts` and reference public assets via relative paths or Vite imports (`import logoUrl from './assets/logo.svg'`).
- **Why:** Hardcoding leading slashes (like `<script src="/assets/index.js">`) breaks when deployed to a subdirectory URL such as `https://<user>.github.io/<repo-name>/`.

### 5.2 Client-Side Routing Considerations
- As documented in [docs/INFORMATION\_ARCHITECTURE.md](https://www.google.com/search?q=INFORMATION_ARCHITECTURE.md), MindRail Studio uses **Hash-Based Routing** (`#/`, `#/projects`, `#/templates`, `#/workspace/developer/:id`, `#/settings`).
- **Why Hash Routing Is Ideal for Static Hosts:**
  - Every route loads the root `index.html` document cleanly without requiring custom server-side `/* -> /index.html (200)` rewrite rules.
  - Refreshing the browser on `#/workspace/developer/9b1deb4d...` on GitHub Pages or a local static server never triggers a `404 Not Found` error.

### 5.3 Service Worker & Offline Caching Considerations
- **Policy:** The application uses a standard static bundle with native browser caching headers.
- Never cache or intercept `IndexedDB` transactions.
- All application assets, fonts, and icons are bundled locally with content hashing (`dist/assets/index-[hash].js`), ensuring cache busting whenever a new build is deployed.

### 5.4 Step-by-Step GitHub Pages Deployment Guide

#### Method A: Automated GitHub Actions (Recommended)
MindRail Studio includes a pre-configured GitHub Actions workflow at `.github/workflows/deploy.yml`:
1. Push this repository to your GitHub account (e.g. `https://github.com/<username>/mindrail-studio`).
2. Navigate to your repository on GitHub and open **Settings** $\to$ **Pages**.
3. Under **Build and deployment** $\to$ **Source**, choose **GitHub Actions** from the dropdown menu.
4. On every subsequent push to the `main` branch, GitHub Actions will automatically:
   - Run strict TypeScript typecheck (`npm run typecheck`).
   - Run ESLint (`npm run lint`).
   - Execute all 170 automated tests (`npm test`).
   - Compile the optimized production build (`npm run build`).
   - Publish `dist/` to `https://<username>.github.io/<repo-name>/`.

#### Method B: Local Static Server (Self-Hosted / Air-Gapped)
Because MindRail Studio has zero backend dependencies, you can run or host `dist/` completely offline:
```bash
# Build the production assets
npm run build

# Preview locally
npm run preview
```
Or serve `dist/` using any static file server:
```bash
npx serve dist -l 3000
```

---

## 6. Common Deployment Errors & Solutions

| Symptom | Root Cause | Solution |
| :--- | :--- | :--- |
| **Blank screen & `404` on `.js`/`.css` assets on GitHub Pages** | `vite.config.ts` used `base: '/'` instead of `base: './'` or `base: '/<repo-name>/'` | Set `base: './'` in `vite.config.ts` and rebuild |
| **`404 Not Found` when refreshing a deep workspace link** | History API routing (`/workspace/...`) used on a static host without SPA fallback rules | Use the canonical Hash Router (`#/workspace/...`) specified in [docs/INFORMATION\_ARCHITECTURE.md](https://www.google.com/search?q=INFORMATION_ARCHITECTURE.md) |
| **Fonts or icons fail to load offline** | Stylesheets referenced an external CDN (`fonts.googleapis.com` or `unpkg.com`) | Bundle all fonts and SVG icons locally inside `src/` or `public/` |
| **Projects created on `localhost` do not appear on deployed URL** | Browser `IndexedDB` is partitioned per origin (`http://localhost:5173` vs `https://<domain>`) | Expected browser security behavior; export `.mindrail.json` from localhost and import on the deployed origin |

---

## 7. Post-Deployment Verification Checklist

After deploying `dist/` to any static host (or running `npm run preview` locally), verify all 7 items:

- [ ] **1. Zero Console / Network Errors:** Open browser DevTools (`Console` and `Network` tabs), reload the page, and confirm `0` red console errors and `0` failed (`4xx`/`5xx`) asset requests.
- [ ] **2. Zero Unauthorized External Requests:** Verify in the `Network` tab that every request originates from the same static host origin (no third-party analytics, font CDNs, or external APIs).
- [ ] **3. Deep-Link Refresh:** Open a workspace project (`#/workspace/developer/<id>`), press `F5` / `Cmd+R` to reload the browser, and confirm the project reloads cleanly without a `404`.
- [ ] **4. Local Persistence Round-Trip:** Create a node, confirm the header changes to `Saved locally`, close the tab, reopen the URL, and confirm the node persists.
- [ ] **5. `.mindrail.json` Export & Import:** Export the project to disk and re-import it via the Import Modal.
- [ ] **6. Keyboard Navigation:** Verify `Tab`, `N`, `Arrow` keys, `Ctrl/Cmd+Z`, and `Escape` work as expected in the production build.
- [ ] **7. Mobile Viewport Check:** Resize viewport to `375×812` in DevTools Device Mode and confirm the responsive bottom bar and Outline view operate cleanly.
