# Design System Specification (`docs/DESIGN_SYSTEM.md`)

> **Implementation Status:** Proposed Design Specification (Not Yet Implemented in Code). No CSS files or components currently exist in the repository. When Phase 0 of [docs/IMPLEMENTATION\_PLAN.md](https://www.google.com/search?q=IMPLEMENTATION_PLAN.md) begins, implement these tokens in `src/design-system/tokens.css`.

## 1. Design Philosophy & Visual Identity

MindRail Studio is designed to look and feel like **precision dark-mode creative software**—combining the spatial clarity of modern node editors with the typographic discipline of developer IDEs and non-linear video tools.

### Core Visual Principles
1. **Content as Hero:** The infinite canvas sits on a deep, low-glare obsidian background (`#0B0D12`) so semantic node accents, connection lines, and typography stand out effortlessly.
2. **Controlled Contrast & Elevation:** Surface hierarchy is achieved through subtle luminance steps (`#0B0D12` -> `#121620` -> `#181D2A` -> `#202738`) and crisp `1px` hairline borders rather than heavy drop shadows.
3. **Restrained Glassmorphism:** Floating toolbars and HUD panels use subtle backdrop blur (`backdrop-filter: blur(12px)`) with high-opacity dark backgrounds (`rgba(18, 22, 32, 0.88)`) so text remains 100% legible over canvas lines.
4. **Zero Decorative Noise:** Every gradient, badge, and micro-interaction communicates state (selection, port hover, workspace identity, save status, or validation error).

---

## 2. Color Palette & Semantic Color Roles (Proposed Tokens)

All color tokens must be defined as CSS custom properties on `:root` in `src/design-system/tokens.css`. Every text/background pairing below is designed to meet or exceed **WCAG 2.1 AA** contrast requirements (`≥ 4.5:1` for normal text, `≥ 3.0:1` for large text and graphical UI components).

### 2.1 Background & Surface Layers

| CSS Variable | Proposed Value | Purpose | Intended Contrast Pairing |
| :--- | :--- | :--- | :--- |
| `--mr-bg-canvas` | `#0B0D12` | Infinite canvas base background | Paired with `--mr-text-primary` (`17.8:1`) |
| `--mr-bg-canvas-grid` | `#1A202C` | Subtle dot/line grid pattern on canvas | Decorative reference grid |
| `--mr-bg-surface-1` | `#121620` | Primary app chrome, left palette, right inspector | Paired with `--mr-text-primary` (`15.9:1`) |
| `--mr-bg-surface-2` | `#181D2A` | Canvas node card body, project cards, inputs | Paired with `--mr-text-primary` (`14.1:1`) |
| `--mr-bg-surface-3` | `#202738` | Hover state for cards/nodes, elevated popovers, modals | Paired with `--mr-text-primary` (`12.2:1`) |
| `--mr-bg-glass` | `rgba(18, 22, 32, 0.88)` | Floating canvas HUD, top header overlay | Paired with `--mr-text-primary` (`>13:1` effective) |

### 2.2 Typography & Iconography Colors

| CSS Variable | Proposed Value | Purpose | Contrast vs `--mr-bg-surface-2` (`#181D2A`) |
| :--- | :--- | :--- | :--- |
| `--mr-text-primary` | `#F3F6FC` | Primary headings, node titles, body text | `14.1:1` (AAA) |
| `--mr-text-secondary` | `#A6B1C8` | Inspector labels, node descriptions, metadata | `7.3:1` (AAA) |
| `--mr-text-muted` | `#7E8BA6` | Secondary hints, timestamps, keyboard shortcut badges | `4.6:1` (AA) |
| `--mr-text-on-accent` | `#080B10` | High-contrast dark text on bright semantic fills | `≥ 10.0:1` (AAA) |

### 2.3 Workspace & Semantic Accent Colors

| CSS Variable | Proposed Value | Semantic Role | Contrast vs `#181D2A` |
| :--- | :--- | :--- | :--- |
| `--mr-accent-primary` | `#5E9EFF` | Primary brand interactive accent & Developer Workspace identity | `6.8:1` (AA) |
| `--mr-accent-primary-hover` | `#7DB2FF` | Hover state for primary interactive elements | `8.4:1` (AAA) |
| `--mr-accent-video` | `#FF8B5E` | Video Creator Workspace identity & storyboard highlights | `7.1:1` (AAA) |
| `--mr-accent-student` | `#4ADE80` | Student Workspace identity & mastery highlights | `9.6:1` (AAA) |
| `--mr-color-info` | `#38BDF8` | Informational badges, links, active connection ports | `8.2:1` (AAA) |
| `--mr-color-success` | `#34D399` | Saved status, completed tasks, mastered flashcards | `8.9:1` (AAA) |
| `--mr-color-warning` | `#FBBF24` | Unsaved changes, storage quota approaching limit | `10.1:1` (AAA) |
| `--mr-color-danger` | `#F87171` | Validation errors, storage failure, destructive actions | `6.1:1` (AA) |

### 2.4 Semantic Node Color Roles (`NodeColorToken`)

Canvas nodes can be assigned one of 8 semantic color tokens stored in the data model (`neutral`, `blue`, `purple`, `cyan`, `emerald`, `amber`, `rose`, `orange`). Each maps to a subtle header tint (`14%` opacity) and a crisp `1.5px` accent border (`≥ 3.5:1` non-text contrast against `--mr-bg-canvas`).

---

## 3. Borders, Radii, and Shadows

### 3.1 Border Tokens
- `--mr-border-subtle`: `#232B3E` (`1px solid` panel dividers and unselected cards)
- `--mr-border-default`: `#2F3A52` (`1px solid` inputs, buttons, and default canvas nodes)
- `--mr-border-strong`: `#475678` (Hovered nodes and active input borders)
- `--mr-border-focus`: `#5E9EFF` (`2px solid` keyboard focus indicator with `2px` offset)

### 3.2 Border Radii
- `--mr-radius-xs`: `4px` (Keyboard shortcut `<kbd>` tags, small status pills)
- `--mr-radius-sm`: `6px` (Buttons, text inputs, context menu items)
- `--mr-radius-md`: `10px` (Canvas nodes, inspector sub-cards, toasts)
- `--mr-radius-lg`: `14px` (Modal dialogs, floating toolbars, landing workspace cards)
- `--mr-radius-full`: `9999px` (Connection ports, circular badges)

### 3.3 Shadows
- `--mr-shadow-sm`: `0 2px 6px rgba(0, 0, 0, 0.35)` (Canvas nodes at rest)
- `--mr-shadow-md`: `0 8px 24px rgba(0, 0, 0, 0.48)` (Selected/dragging canvas nodes, floating HUD, popovers)
- `--mr-shadow-lg`: `0 20px 48px rgba(0, 0, 0, 0.65)` (Modal dialogs, Command Palette)

---

## 4. Typography Scale

To uphold zero-cost and offline local-first operation without leaking user IP addresses to external font CDNs, MindRail Studio uses a high-craft system font stack (with optional locally bundled open-source variable fonts in `public/fonts/` if confirmed per [docs/LICENSING.md](https://www.google.com/search?q=LICENSING.md)):

- `--mr-font-sans`: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- `--mr-font-mono`: `'JetBrains Mono', 'Fira Code', 'SFMono-Regular', Consolas, monospace`

| Token | Size (`rem` / `px`) | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `--mr-text-2xl` | `1.75rem` (`28px`) | `1.25` | `700` | Landing page hero, modal/page titles |
| `--mr-text-xl` | `1.25rem` (`20px`) | `1.3` | `600` | Section headers, template/project gallery headings |
| `--mr-text-lg` | `1.0rem` (`16px`) | `1.4` | `600` | Canvas node titles, dialog headers |
| `--mr-text-md` | `0.875rem` (`14px`) | `1.5` | `400` / `500` | Default UI body text, inspector inputs, node descriptions |
| `--mr-text-sm` | `0.8125rem` (`13px`) | `1.45` | `400` / `500` | Secondary labels, code snippets, checklist items |
| `--mr-text-xs` | `0.75rem` (`12px`) | `1.35` | `500` | Badges, edge labels, timecodes, `<kbd>` shortcuts |

Use `font-variant-numeric: tabular-nums` on all timers, duration counters (`MM:SS`), zoom percentages, and node coordinate inputs so digits never jitter during updates.

---

## 5. Spacing Scale & Layout Constraints

### 5.1 Spacing Scale (`4px` Base Unit)
- `--mr-space-1`: `4px`
- `--mr-space-2`: `8px`
- `--mr-space-3`: `12px`
- `--mr-space-4`: `16px`
- `--mr-space-5`: `20px`
- `--mr-space-6`: `24px`
- `--mr-space-8`: `32px`
- `--mr-space-10`: `40px`
- `--mr-space-12`: `48px`

### 5.2 Layout & Grid Behavior
- **Top Studio Header Height:** `52px` fixed (`--mr-layout-header-h: 52px`)
- **Left Creation Palette Width:** `240px` expanded, `56px` collapsed icon rail
- **Right Inspector Width:** `320px` expanded (`360px` on wide screens `≥ 1440px`)
- **Canvas Snap Grid:** Default `16px` logical grid (`--mr-canvas-grid-size: 16px`), visually rendered with subtle dots every `16px` and major grid accents every `128px`.

### 5.3 Responsive Breakpoints
- **Mobile:** `< 768px`
- **Tablet:** `768px – 1023px`
- **Desktop:** `1024px – 1439px`
- **Wide Studio:** `≥ 1440px`

---

## 6. Component Specifications & States

### 6.1 Buttons (`Button`)
- **Variants:**
  - `primary`: Solid `--mr-accent-primary` background with `--mr-text-on-accent` bold label.
  - `secondary`: `--mr-bg-surface-2` background with `--mr-border-default` border and `--mr-text-primary` text.
  - `ghost`: Transparent background, `--mr-text-secondary` text, `--mr-bg-surface-3` on hover (used in toolbars).
  - `danger`: `--mr-color-danger` tint background with crisp red border and text; solid red fill on hover.
- **Sizes:** `sm` (`28px` height), `md` (`36px` height, default), `lg` (`44px` height, default on touch/mobile).
- **Interactive States:** Every button must define `default`, `:hover`, `:active` (`transform: translateY(1px)`), `:focus-visible` (`2px solid var(--mr-border-focus)`), and `:disabled` (`opacity: 0.45; cursor: not-allowed`).

### 6.2 Inputs, Textareas & Selects (`Input`, `Textarea`, `Select`)
- **Variants:** Standard form field (`--mr-bg-surface-2`), compact inspector numeric scrub/input, monospace code editor textarea.
- **Validation States:** Invalid fields display a `--mr-color-danger` border and an inline error message linked via `aria-describedby`.

### 6.3 Cards, Panels, Dialogs & Popovers
- **Cards (`ProjectCard`, `TemplateCard`):** `--mr-bg-surface-2`, `1px solid var(--mr-border-subtle)`, transitions border to `--mr-border-strong` on hover.
- **Modal Dialogs (`Dialog`):** Built on native HTML `<dialog>` with dark backdrop (`rgba(5, 7, 11, 0.72)`), `max-width: 540px`, header with close button, scrollable body, and right-aligned action footer.
- **Context Menus & Popovers:** `--mr-bg-surface-3`, `1px solid var(--mr-border-default)`, `--mr-shadow-md`, keyboard navigable via `ArrowUp` / `ArrowDown` and dismissible via `Escape`.

### 6.4 Shared Canvas Components

#### Canvas Nodes (`CanvasNodeCard`)
- **Structure:**
  1. **Header Bar:** Semantic workspace/category icon, node type badge, inline-editable node title, and lock/status indicator.
  2. **Body Slot:** Summary description plus workspace-specific preview (e.g., syntax-highlighted code preview in Developer; framing badge + script snippet + duration pill in Video Creator; flashcard prompt or mastery badge in Student).
  3. **Footer Bar:** Category/tag pills and quick metadata (e.g., subtask count `3/5` or timecode `01:15 - 01:45`).
  4. **Connection Ports:** Top, Right, Bottom, Left circular handles (`12px` visual diameter with a `24px` invisible hit target) that scale up slightly when hovered or focused during connection mode.
- **Selection States:**
  - *Unselected:* `1px solid var(--mr-border-default)`
  - *Hovered:* `1px solid var(--mr-border-strong)`
  - *Selected (Single or Multi):* `2px solid var(--mr-accent-primary)` with an outer `0 0 0 3px rgba(94, 158, 255, 0.22)` glow halo.
  - *Keyboard Focused:* Distinct high-contrast dashed or double focus ring.

#### Connection Styling (`CanvasEdgePath`)
- Rendered as SVG `<path>` elements inside the viewport-transformed SVG overlay layer.
- Includes a `2px` visible stroke (`--mr-text-muted` by default, `--mr-accent-primary` when selected) paired with a transparent `14px` wide `<path>` hit area so edges are easy to click and select.
- Optional centered pill label (`--mr-bg-surface-1` background with `1px` border) displaying protocol, transition cue, or relationship name.

#### Toolbars, Tooltips & Notifications (Toasts)
- **Floating HUD Toolbar:** Bottom-left pill (`Zoom -`, `100%`, `Zoom +`, `Fit View`, `Grid Snap Toggle`, `Keyboard Shortcuts ?`).
- **Tooltips:** Appear after `300ms` hover or immediate keyboard focus, displaying action name and `<kbd>` shortcut.
- **Toasts / Banners:** Bottom-right non-blocking notifications for `Export complete` or `Template saved`; persistent top banners for critical storage or import errors.

### 6.5 Empty States & Error States
- **Empty Project Library:** Explains that projects are stored locally in this browser and offers **Create First Project** or **Import `.mindrail.json`**.
- **Empty Canvas:** Centered floating helper card showing quick actions (`Add First Node (N)`, `Load Starter Template`).
- **Error States:** Every error state includes (1) what went wrong in plain language, (2) whether user data is safe, and (3) a direct recovery button (such as **Export Backup** or **Reset Filter**).

---

## 7. Motion Principles & Reduced-Motion Support

- **Purposeful Micro-Interactions:** Use fast, responsive transitions (`120ms–180ms cubic-bezier(0.2, 0, 0, 1)`) for panel collapse, dialog entry, button hover, and node selection halos.
- **No Laggy Canvas Physics:** Never apply CSS `transition` to canvas node `(x, y)` coordinates or viewport pan/zoom transforms during active pointer dragging—updates during dragging must be instantaneous (`0ms`) to prevent input lag.
- **Mandatory Reduced-Motion Support:** Include the following global rule in `src/design-system/tokens.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
Users can also explicitly force reduced motion inside `#/settings` via `data-reduced-motion="true"` on `<html>`.
