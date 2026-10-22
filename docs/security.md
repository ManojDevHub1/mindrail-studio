# Security Policy (`SECURITY.md`)

MindRail Studio is designed as a **local-first, zero-backend browser application**. While the absence of a custom backend eliminates server-side database breaches and remote authentication vulnerabilities, browser-based applications that parse user-supplied files and persist rich structured data locally face critical client-side security risks—particularly Cross-Site Scripting (XSS), prototype pollution, DOM injection, and denial-of-service via malformed project imports.

> **Verification Status:** MindRail Studio is currently in its pre-code specification phase and has **not** undergone any third-party security audit or certification. This document defines mandatory security engineering requirements for implementation and explains how to report vulnerabilities.

## 1. Threat Model Overview

Because MindRail Studio allows users to exchange `.mindrail.json` project files and templates with other people, **every imported file and external payload must be treated as untrusted, potentially malicious input**.

| Threat Vector | Description | Required Mitigation |
| :--- | :--- | :--- |
| **Stored / Imported XSS** | A malicious `.mindrail.json` file embeds `<script>`, `javascript:` URLs, or inline event handlers (`onload`, `onerror`) inside node titles, descriptions, code snippets, or SVG exports | Render all text via React escaped text nodes; never use `dangerouslySetInnerHTML` or `innerHTML`; validate all URLs against an explicit `https:`/`http:`/`mailto:` allowlist |
| **Prototype Pollution** | Crafted JSON payloads include `"__proto__"`, `"constructor"`, or `"prototype"` keys that mutate object prototypes during deep merges or migrations | Strip or reject forbidden keys (`__proto__`, `constructor`, `prototype`) during JSON parsing and schema validation; construct normalized domain objects with explicit property copying |
| **Resource Exhaustion (DoS)** | Giant or deeply nested `.mindrail.json` files freeze the main thread or exhaust `IndexedDB` storage quota | Enforce pre-parse byte size limits (10 MB default ceiling), node/edge count caps, string length bounds, and JSON nesting depth limits before committing to memory or storage |
| **Unsafe SVG / Image Export Injection** | Exporting canvas nodes to SVG or HTML embeds unescaped user strings into raw XML markup | Use DOM `createElementNS` and `textContent` / `setAttribute` when constructing SVG documents; never concatenate raw user strings into SVG XML templates |
| **Supply-Chain / Dependency Compromise** | Malicious or vulnerable third-party npm packages execute arbitrary code in the browser | Keep runtime dependencies minimal, audit licenses and maintainers before adding packages, commit lockfiles (`package-lock.json`), and run `npm audit` regularly |

## 2. Safe Handling of Imported Files

All file import workflows (file picker and drag-and-drop) must enforce the validation pipeline specified in [docs/IMPORT\_EXPORT\_SPEC.md](https://www.google.com/search?q=docs/IMPORT_EXPORT_SPEC.md):

1. **Extension and MIME Check:** Accept `.mindrail.json` and `.json` files (`application/json`, `application/vnd.mindrail.project+json`, or empty/text MIME types reported by the OS). Reject executable or binary formats immediately.
2. **Pre-Parse Size Gate:** Check `file.size` before reading into memory:
   - Warn the user at **5 MB** (`5,242,880` bytes).
   - Hard-reject files exceeding **10 MB** (`10,485,760` bytes) with a clear error message.
3. **Isolated Parsing with Reviver:** Parse JSON using `JSON.parse` with a custom reviver that strips `"__proto__"`, `"constructor"`, and `"prototype"` keys immediately.
4. **Transactional Safety:** Never mutate active editor state or overwrite an existing `IndexedDB` project record until the entire imported payload has passed schema validation and referential integrity checks.

## 3. Validation of Imported JSON

Every imported project object must pass a strict runtime validator (`src/import-export/validateProjectImport.ts`) before entering application state:

- Verify `schemaVersion` is a supported positive integer.
- Verify `workspaceType` is strictly `'developer' | 'video' | 'student'`.
- Verify every node and edge has a valid string ID, bounded finite coordinates (`Number.isFinite(x) && Number.isFinite(y)`), and bounded dimensions.
- Enforce collection and string ceilings (e.g., max 5,000 nodes, max 10,000 edges, max 100,000 characters per note/code field).
- Reject or strip unknown properties rather than blindly spreading arbitrary objects into persistent records.

## 4. Avoiding Arbitrary HTML Execution and Unsafe DOM Insertion

- **Prohibited APIs:** Never use `eval()`, `new Function()`, `setTimeout(string)`, `setInterval(string)`, `document.write()`, `Element.prototype.innerHTML`, `Element.prototype.outerHTML`, `Element.prototype.insertAdjacentHTML`, or React's `dangerouslySetInnerHTML` with user-controlled or imported content.
- **Markdown and Code Snippets:**
  - In the Developer, Video Creator, and Student workspaces, render code snippets and Markdown notes using safe React token/AST components that output standard React elements (`<pre>`, `<code>`, `<p>`, `<ul>`, `<li>`), never raw HTML strings.
- **URL Sanitization:** If a node property contains an external reference URL, parse it with `new URL(value)` and permit only `https:` and `http:` protocols. Explicitly block `javascript:`, `data:`, `vbscript:`, and `file:` URIs from being rendered inside `<a href>` or `<img src>`.
- **Content Security Policy (CSP):** Configure a restrictive Content Security Policy in `index.html` (via `<meta http-equiv="Content-Security-Policy">`) for production builds:
  - `default-src 'self'`
  - `script-src 'self'` (no `'unsafe-eval'`, no external script domains)
  - `style-src 'self' 'unsafe-inline'` (or hashed/modular styles)
  - `img-src 'self' data: blob:` (allowing local canvas blob/data URLs for previews/exports)
  - `connect-src 'self'` (blocking unauthorized outbound network requests)
  - `object-src 'none'`
  - `base-uri 'self'`

## 5. Dependency Security

- Keep the runtime dependency tree as small as possible.
- Never install packages with post-install scripts that fetch remote binaries unless strictly required by core build tooling (such as Vite/Playwright in `devDependencies`).
- Commit `package-lock.json` so all contributors and build environments resolve identical dependency versions and integrity hashes.
- Run `npm audit` prior to releases and address any vulnerability affecting production runtime dependencies (`dependencies`).

## 6. Sensitive Data Handling

- **Local-First Storage Scope:** Remind users in the UI and documentation ([docs/LOCAL\_FIRST\_AND\_PRIVACY.md](https://www.google.com/search?q=docs/LOCAL_FIRST_AND_PRIVACY.md)) that `IndexedDB` and `.mindrail.json` files are stored **unencrypted** on the local device filesystem.
- **User Guidance on Secrets:** The Developer Workspace includes code snippet and architecture nodes. The UI must advise users **not** to store production API keys, private cryptographic keys, or live passwords inside canvas nodes or exported `.mindrail.json` files unless they manage disk encryption externally.
- **Zero Outbound Transmission:** The application must never log project contents to external servers or embed project data in URL query parameters where it could leak via browser history or `Referer` headers.

## 7. Reporting Potential Vulnerabilities

If you discover a security vulnerability in MindRail Studio (such as an XSS vector via crafted `.mindrail.json` files, prototype pollution, or CSP bypass):

1. **Do Not Post Public Exploits First:** Please avoid opening a public GitHub issue containing a live exploit payload until maintainers have had an opportunity to review and patch the issue.
2. **Preferred Channel (GitHub Private Vulnerability Reporting):** If this repository is hosted on GitHub and has **Private Vulnerability Reporting** enabled under the repository's **Security -> Advisories** tab, submit your report there.
3. **What to Include:**
   - A clear description of the vulnerability and its potential impact.
   - Step-by-step instructions or a minimal proof-of-concept `.mindrail.json` file to reproduce the issue.
   - Affected files, components, or specification sections.
   - Any suggested remediation.

### What to Do If Private Vulnerability Reporting Is Unavailable

If private vulnerability reporting or a dedicated security contact email has not yet been configured on the repository:

1. Open a minimal issue titled `Security contact request` asking the repository maintainer for a private communication channel **without disclosing the vulnerability details or exploit payload** in the public issue body.
2. Once the maintainer provides a direct contact method or enables GitHub Security Advisories, share the technical reproduction details privately.
