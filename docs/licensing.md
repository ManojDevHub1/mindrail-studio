# Licensing and Intellectual Property Governance (`docs/LICENSING.md`)

> **Current License Status:** **Unconfirmed / Pending Project Owner Decision.**
> No `LICENSE` file has been created in the repository root, and no legal license has been selected on the project owner's behalf. Until an explicit license is chosen and committed by the project owner, default copyright law applies.

## 1. Purpose of This Document

Preparing a serious software project requires distinguishing clearly between four separate categories of intellectual property and licensing:

1. **The license for MindRail Studio's own source code and documentation.**
2. **The licenses of third-party npm dependencies bundled or used during development.**
3. **The rights and licenses associated with design assets, fonts, icons, and starter templates.**
4. **The rights associated with contributor submissions and user-created `.mindrail.json` projects.**

---

## 2. Decision Required: Project Source Code License

Before publishing MindRail Studio publicly or accepting external community pull requests, the project owner must confirm and commit a `LICENSE` file in the repository root.

### Common Open-Source Options for Consideration

| License Option | SPDX Identifier | Summary of Characteristics |
| :--- | :--- | :--- |
| **MIT License** | `MIT` | Simple, permissive open-source license; allows commercial and private use, modification, and distribution provided copyright and license notices are preserved |
| **Apache License 2.0** | `Apache-2.0` | Permissive open-source license similar to MIT, with an explicit patent grant and requirement to state significant modifications |
| **Mozilla Public License 2.0** | `MPL-2.0` | File-level weak copyleft; modifications to existing MPL-licensed files must remain MPL-2.0, while allowing combination with larger works |
| **GNU Affero General Public License v3** | `AGPL-3.0-only` | Strong network copyleft; requires anyone distributing modified versions or running a modified version as a network service to release complete source code under AGPLv3 |

### Action Required to Finalize
1. Project owner selects the desired license.
2. Add the official license text to `/LICENSE` in the repository root.
3. Update the `"license"` field in `package.json` (during Phase 0) and the **License Status** section of [README.md](https://www.google.com/search?q=../README.md).

---

## 3. Third-Party Dependency Licensing Rules

Even before the root project license is finalized, all third-party dependencies introduced in Phase 0+ must obey strict license hygiene so they never restrict the project owner's licensing options or violate the zero-cost constraint.

### 3.1 Pre-Approved Permissive Dependency Licenses
Dependencies with the following SPDX identifiers may be used in `dependencies` and `devDependencies`:
- `MIT`
- `ISC`
- `BSD-2-Clause`
- `BSD-3-Clause`
- `Apache-2.0`
- `0BSD`
- `CC0-1.0`

*(Note: `MPL-2.0` packages such as `axe-core` may be used in unmodified form inside `devDependencies` for automated accessibility testing.)*

### 3.2 Prohibited Dependency Licenses
Never install or bundle dependencies under the following licenses without explicit written confirmation from the project owner:
- **Strong Copyleft Licenses (`GPL-2.0`, `GPL-3.0`, `AGPL-3.0`):** Would force the entire MindRail Studio codebase to adopt GPL/AGPL terms.
- **Commercial / Source-Available / Non-Commercial Only Licenses (`SSPL`, `BUSL`, Commons Clause, proprietary commercial UI kits, paid icon sets):** Violate the zero-cost open-source requirement.
- **Unlicensed Packages (`UNLICENSED` or missing license):** Carry unresolved copyright risk.

### 3.3 Verification Procedure Before Installing a Package
Before adding any package to `package.json`:
1. Inspect its `license` field (`npm view <package-name> license`).
2. Verify its transitive runtime dependencies also use permissive open-source licenses.
3. Retain copyright notices in production builds if required by the dependency's license.

---

## 4. Design Assets, Fonts, Icons, and Starter Templates

1. **Typography (Fonts):**
   - By default, [docs/DESIGN\_SYSTEM.md](https://www.google.com/search?q=DESIGN_SYSTEM.md) specifies a native system font stack (`-apple-system`, `BlinkMacSystemFont`, `'Segoe UI'`, `Roboto`, `sans-serif` and system monospace) which requires zero font licensing or downloads.
   - If self-hosted web fonts (`Inter` or `JetBrains Mono`) are bundled in `public/fonts/`, they must be licensed under the **SIL Open Font License 1.1 (`OFL-1.1`)**, and their `OFL.txt` copyright/license file must be included alongside the font files in `public/fonts/`.
2. **Icons & Illustrations:**
   - Custom SVG icons authored directly in the repository belong to the project.
   - If third-party open-source icon sets (such as Lucide Icons under `ISC` or Heroicons under `MIT`) are used, verify their `ISC`/`MIT` license and attribute them in documentation. Never copy proprietary icons or unlicensed web graphics.
3. **Built-In Starter Templates:**
   - All starter templates bundled with MindRail Studio (`Developer`, `Video Creator`, `Student`) must be original creations authored for this repository so users are free to use, modify, and export projects created from them without restriction.

---

## 5. Contributed Material & User Data Ownership

### 5.1 Code and Documentation Contributions
- Once the project owner selects a repository license in `/LICENSE`, all code and documentation contributions submitted via pull requests will follow standard inbound=outbound licensing (licensed under the same terms as the project's `/LICENSE` file) unless the project owner establishes a separate Contributor License Agreement (CLA).
- Contributors must only submit code, templates, and documentation that they have the legal right to contribute.

### 5.2 User-Created Projects (`.mindrail.json`, `.svg`, `.png`, `.md`)
- **100% User Ownership:** Users retain full copyright and ownership of all projects, diagrams, code snippets, scripts, storyboards, and study notes they create inside MindRail Studio or export via `.mindrail.json`, `.svg`, `.png`, and `.md` files.
