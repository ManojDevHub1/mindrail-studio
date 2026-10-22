# Local-First Operation and Privacy (`docs/LOCAL_FIRST_AND_PRIVACY.md`)

> **Implementation Status:** Specified (Not Yet Implemented). Defines how MindRail Studio stores data locally in the browser, handles browser storage limits, and protects user privacy.

## 1. Local-First Philosophy & No-Backend Guarantee

MindRail Studio operates on a strict **local-first, zero-backend** model ([docs/decisions/ADR-0001-local-first-no-backend.md](https://www.google.com/search?q=decisions/ADR-0001-local-first-no-backend.md)):

- **Zero Custom Servers:** There is no backend application server, no cloud database, and no remote API endpoint operated by MindRail Studio.
- **Zero User Accounts:** You never register an email address, create a password, or sign in with OAuth to use any feature of the application.
- **Zero Silent Uploads:** Your projects, diagrams, code snippets, video scripts, and study notes remain inside your browser's local storage and the files you explicitly export to your device.
- **Zero Telemetry by Default:** The application contains no analytics SDKs, no crash-reporting beacons, no advertising pixels, and no behavioral tracking scripts.

---

## 2. Browser Storage Architecture: What Is Stored and Where

Web browsers provide three distinct client-side storage mechanisms. MindRail Studio assigns clear boundaries to each:

| Storage Mechanism | Capacity & Persistence Characteristics | How MindRail Studio Uses It |
| :--- | :--- | :--- |
| **`IndexedDB`** (`mindrail_studio_db`) | Asynchronous, transactional, structured object database; typically allows tens of megabytes to plusieurs gigabytes depending on free disk space and browser vendor | **Primary Store:** Stores full `Project` documents (`projects` store) and user-saved custom `ProjectTemplate` records (`custom_templates` store) |
| **`localStorage`** (`mindrail:prefs:v1`) | Synchronous key-value string store; limited to ~5 MB per origin; blocks main thread if overused | **Preferences Only:** Stores small (< 2 KB) UI preferences: reduced-motion override, default grid snap toggle, sidebar collapsed state, and last selected workspace filter |
| **Browser Memory (`React` State)** | Volatile RAM; cleared immediately when the browser tab is closed or refreshed | **Session State:** Holds active undo/redo history stacks, current node/edge selection, hover targets, active pointer drag deltas, and running study timer countdown ticks |
| **`sessionStorage`** | Per-tab string store cleared on tab close | **Not Used for Project Data:** Avoided for project persistence because closing a tab destroys `sessionStorage` |

### `IndexedDB` Database Layout (`mindrail_studio_db`, Version `1`)

1. **`projects` Object Store**
   - `keyPath`: `"id"` (`Project.id` UUID)
   - Indexes:
     - `by_workspaceType` (`"workspaceType"`, non-unique)
     - `by_updatedAt` (`"metadata.updatedAt"`, non-unique)
2. **`custom_templates` Object Store**
   - `keyPath`: `"id"` (`ProjectTemplate.id` UUID)
   - Indexes:
     - `by_workspaceType` (`"workspaceType"`, non-unique)

---

## 3. How Persistence and Autosave Work

1. **Immediate Initial Save:** Creating a blank project, instantiating a template, or confirming a file import writes the `Project` record to `IndexedDB` before navigating to the editor.
2. **Debounced Autosave (`1000ms`):**
   - Whenever the user commits a structural edit (creating, moving, resizing, editing, or deleting a node/edge/checklist item), the editor state marks `hasUnsavedChanges = true` and displays `Unsaved changes...` in the top header.
   - After `1000ms` of inactivity, the autosave hook writes the updated `Project` record inside a `readwrite` transaction to `IndexedDB`.
   - Once `transaction.oncomplete` fires, `hasUnsavedChanges` becomes `false` and the header displays `Saved locally`.
3. **Explicit Manual Save (`Ctrl/Cmd + S`):**
   - Pressing `Ctrl/Cmd + S` cancels any pending debounce timer and executes the `IndexedDB` write immediately.
4. **Tab Close Protection (`beforeunload`):**
   - If `hasUnsavedChanges` is `true` (or if a previous save failed due to storage errors) when the user attempts to close or reload the tab, the application registers a `beforeunload` event handler to warn the user before unsaved memory state is lost.

---

## 4. Storage Quota Failures, Browser Restrictions & Fallbacks

Browser storage is **not** an infinite or permanent database. Engineers and users must understand its operational failure modes:

### 4.1 Storage Quota Exhaustion (`QuotaExceededError`)
- **Cause:** The user's hard drive is nearly full, or the browser origin has reached its allotted storage cap.
- **Application Response:**
  1. Catch `DOMException` (`name === 'QuotaExceededError'`) in `projectRepository.ts`.
  2. Keep the user's active project intact in browser memory (`React` state).
  3. Switch the header save badge to `Save failed — Storage Full` and display a high-visibility recovery banner with a one-click **Export `.mindrail.json` Backup** button.
  4. Guide the user to export their current project and optionally delete unused projects in `#/projects`.

### 4.2 Private / Incognito Browsing Windows & Ephemeral Profiles
- **Behavior:** Most browsers (Firefox Private Window, Safari Private Browsing, Chrome Incognito) either partition `IndexedDB` in volatile memory that is wiped the moment the last private window closes, or restrict storage quotas tightly.
- **Mitigation:** Display a concise notice in `#/settings` and the Project Library footer reminding users that private/incognito sessions do not keep data after the window closes, and that exporting `.mindrail.json` is required to retain work.

### 4.3 Browser Storage Eviction & Persistent Storage API
- **Behavior:** Under severe device disk pressure, browsers may evict origin data classified as `"best-effort"`.
- **Mitigation:** When the user creates their first project (or via `#/settings`), check `navigator.storage && navigator.storage.persist` and request persistent storage permission where supported, displaying the current persistence status (`Persistent` vs `Best-Effort`) transparently in `#/settings`.

---

## 5. Data Recovery Limitations & Export-Based Backups

Because MindRail Studio has no backend server:

- **No Server-Side Recovery:** If a user clears their browser's site data ("Clear browsing data -> Cookies and site data"), resets their browser profile, or experiences hardware failure without a local file export, **MindRail Studio cannot remotely recover deleted projects**.
- **Export-Based Backup Workflow:**
  - Users can export any individual project as a `.mindrail.json` file at any time.
  - The `#/settings` view provides an **Export All Projects Backup** action that exports all locally stored projects so users can back them up to their local filesystem, USB drive, Git repository, or personal cloud folder.

---

## 6. Browser Profile Boundaries & Multi-Device Usage

`IndexedDB` and `localStorage` are strictly isolated by browser **Origin** (`scheme + hostname + port`) and **Browser Profile**:

- Projects created in Chrome Profile A will not automatically appear in Chrome Profile B, Firefox, or Safari on the same computer.
- Projects created on a laptop will not automatically synchronize to a phone or tablet.
- **Moving Projects Between Browsers or Devices:** Export the `.mindrail.json` file on Device A and import it via `#/projects` or `#/` on Device B.

---

## 7. External Network Dependencies & Data Deletion Behavior

### External Network Dependencies
- **Runtime Application:** Zero external runtime API requests. All fonts, icons, styles, and scripts must be bundled locally with the static build (`dist/`) so the application functions offline once loaded and never leaks user IP addresses to third-party font or icon CDNs.
- **Static Hosting Provider Note:** When accessed over the web (e.g., via GitHub Pages or another static host), the static hosting provider serves the initial HTML/CSS/JS files and receives standard HTTP request headers (IP address, User-Agent) during page load, just like any static website. However, **zero project content (`IndexedDB` data or `.mindrail.json` files) is ever transmitted to the static host**.

### Data Deletion Behavior
- **Deleting a Single Project:** Clicking **Delete Project** in `#/projects` (and confirming the dialog) executes `objectStore('projects').delete(projectId)` in `IndexedDB`, immediately removing the record.
- **Clearing All Studio Data:** Clicking **Clear All Local Studio Data** in `#/settings` deletes all records in `mindrail_studio_db` (`projects` and `custom_templates`) and removes the `mindrail:prefs:v1` key from `localStorage`.

---

## 8. Privacy Limitations (Honest Disclosure)

MindRail Studio provides strong privacy against remote cloud collection, but users should be aware of local device realities:

1. **Unencrypted Local Disk Storage:** Browser `IndexedDB` files and exported `.mindrail.json` files are stored in plain, unencrypted form on the local operating system user account. Anyone with physical or administrative access to the unlocked device user profile (or malicious browser extensions with broad host permissions) can read local browser storage.
2. **Recommendation for Sensitive Secrets:** Users should use full-disk encryption (such as FileVault, BitLocker, or LUKS) on their machine and avoid pasting live production passwords or private cryptographic keys into canvas nodes.
