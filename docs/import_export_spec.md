# Import and Export Specification (`docs/IMPORT_EXPORT_SPEC.md`)

> **Implementation Status:** Specified (Not Yet Implemented). Defines the canonical `.mindrail.json` file format, validation rules, error handling, and migration pipeline for MindRail Studio.

## 1. Format Overview

MindRail Studio uses a durable, human-readable, UTF-8 encoded JSON envelope format for saving and exchanging projects outside the browser.

| Attribute | Specification |
| :--- | :--- |
| **Canonical File Extension** | `.mindrail.json` (also accepts `.json` during import) |
| **Filename Convention** | `<project-slug>-<YYYY-MM-DD>.mindrail.json` (e.g., `payment-service-arch-2026-10-22.mindrail.json`) |
| **Primary MIME Type** | `application/vnd.mindrail.project+json` |
| **Accepted Import MIME Types** | `application/vnd.mindrail.project+json`, `application/json`, `text/plain`, or `""` (empty OS MIME) |
| **Format Identifier** | `"mindrail-project"` |
| **Current Schema Version** | `1` (integer) |
| **Character Encoding** | UTF-8 without BOM |

---

## 2. Canonical `.mindrail.json` Envelope Structure (`schemaVersion: 1`)

Every exported `.mindrail.json` file wraps the normalized `Project` object ([docs/DATA\_MODEL.md](https://www.google.com/search?q=DATA_MODEL.md)) in a top-level file envelope:

```typescript
export interface MindRailProjectFileEnvelopeV1 {
  /** Fixed magic string identifying a MindRail Studio project file. */
  readonly format: 'mindrail-project';
  /** Monotonic integer schema version matching Project.schemaVersion. */
  readonly schemaVersion: 1;
  /** ISO-8601 UTC timestamp when this file was exported. */
  readonly exportedAt: string;
  /** Application version string that produced the export (e.g., "0.1.0"). */
  readonly appVersion: string;
  /** Complete validated Project payload. */
  readonly project: Project;
}
```

### Complete Annotated Example (`.mindrail.json`)

```json
{
  "format": "mindrail-project",
  "schemaVersion": 1,
  "exportedAt": "2026-10-22T06:30:00.000Z",
  "appVersion": "0.1.0",
  "project": {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "schemaVersion": 1,
    "title": "Order Processing Architecture",
    "workspaceType": "developer",
    "metadata": {
      "description": "Event-driven order pipeline and task breakdown",
      "tags": ["architecture", "orders"],
      "createdAt": "2026-10-22T05:00:00.000Z",
      "updatedAt": "2026-10-22T06:29:00.000Z",
      "completedStudyMinutes": 0,
      "completedStudySessions": 0
    },
    "settings": {
      "snapToGrid": true,
      "gridSize": 16,
      "defaultEdgeStyle": "bezier",
      "studyTimerMinutes": 25,
      "studyBreakMinutes": 5
    },
    "viewport": {
      "x": 120,
      "y": 80,
      "zoom": 1
    },
    "nodes": [
      {
        "id": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
        "title": "API Gateway",
        "description": "Public ingress handling rate limits",
        "position": { "x": 160, "y": 160 },
        "dimensions": { "width": 280, "height": 160 },
        "colorToken": "blue",
        "category": "Ingress",
        "tags": ["gateway"],
        "locked": false,
        "zIndex": 1,
        "createdAt": "2026-10-22T05:05:00.000Z",
        "updatedAt": "2026-10-22T05:10:00.000Z",
        "payload": {
          "kind": "dev-architecture",
          "componentKind": "service",
          "techStack": "Node.js / Fastify",
          "environment": "production",
          "status": "healthy",
          "endpointHint": "https://api.example.com/v1/orders"
        }
      },
      {
        "id": "6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b",
        "title": "Orders Queue",
        "description": "Buffers incoming order events",
        "position": { "x": 544, "y": 160 },
        "dimensions": { "width": 280, "height": 160 },
        "colorToken": "amber",
        "category": "Messaging",
        "tags": ["queue"],
        "locked": false,
        "zIndex": 2,
        "createdAt": "2026-10-22T05:06:00.000Z",
        "updatedAt": "2026-10-22T05:12:00.000Z",
        "payload": {
          "kind": "dev-architecture",
          "componentKind": "queue",
          "techStack": "Redis Streams",
          "environment": "production",
          "status": "healthy"
        }
      }
    ],
    "edges": [
      {
        "id": "c56a4180-65aa-42ec-a945-5fd21dec0538",
        "sourceNodeId": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
        "targetNodeId": "6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b",
        "sourcePort": "right",
        "targetPort": "left",
        "label": "Publish OrderCreated",
        "routingStyle": "bezier",
        "strokePattern": "solid",
        "directed": true,
        "colorToken": "blue"
      }
    ],
    "checklist": []
  }
}
```

---

## 3. Untrusted Input Validation & Limits

Every imported file is treated as **untrusted external input** ([SECURITY.md](https://www.google.com/search?q=../SECURITY.md)). The import validator (`src/import-export/validateProjectImport.ts`) executes the following checks in strict sequential order:

### 3.1 Resource & Size Limits

| Limit | Soft Warning Threshold | Hard Rejection Ceiling | Rationale |
| :--- | :--- | :--- | :--- |
| **File Byte Size** | `5 MB` (`5,242,880` bytes) | `10 MB` (`10,485,760` bytes) | Prevents main-thread lockups and `IndexedDB` quota exhaustion |
| **Node Count (`nodes.length`)** | `1,000` nodes | `5,000` nodes | Protects DOM memory and layout responsiveness |
| **Edge Count (`edges.length`)** | `2,000` edges | `10,000` edges | Protects SVG path calculation and rendering |
| **Checklist Items** | `500` items | `2,000` items | Prevents unbounded array iteration |
| **Single Text/Code Field** | `25,000` chars | `100,000` chars | Prevents memory exhaustion from giant embedded blobs |
| **Title / Label Length** | `120` chars | `250` chars | Prevents UI layout overflow |

### 3.2 Malformed Input & Prototype Pollution Handling
1. **Binary / Non-UTF8 Rejection:** If `FileReader` fails or the text does not start with `{` after trimming whitespace, reject immediately with code `ERR_INVALID_JSON`.
2. **Prototype Pollution Guard:** Parse with `JSON.parse(rawText, safeReviver)` where `safeReviver` strips or throws on any key named `"__proto__"`, `"constructor"`, or `"prototype"`.
3. **Envelope Verification:** Verify `format === "mindrail-project"` and `typeof schemaVersion === "number"`.

### 3.3 Unknown Field Behavior
- **Strict Explicit Reconstruction:** During validation, the validator constructs a fresh `Project` object by picking only known, validated fields defined in [docs/DATA\_MODEL.md](https://www.google.com/search?q=DATA_MODEL.md).
- Unknown extraneous properties injected into the JSON file are **stripped** rather than copied into `IndexedDB` or React state.

---

## 4. Schema Version & Migration Rules

### 4.1 Supported & Unsupported Schema Versions
- **Current Version (`schemaVersion === 1`):** Validated directly against the V1 schema.
- **Older Versions (`1 <= schemaVersion < CURRENT_SCHEMA_VERSION`, in future releases):** Passed through the pure stepwise migration pipeline (`migrateV1ToV2`, etc.) before final schema validation.
- **Invalid or Future Versions (`schemaVersion < 1`, non-integer, or `schemaVersion > CURRENT_SCHEMA_VERSION`):**
  - Hard-rejected with code `ERR_UNSUPPORTED_SCHEMA_VERSION`.
  - User-facing message: `"This file uses schemaVersion X, which is newer than the version supported by this build of MindRail Studio (schemaVersion 1). Please update MindRail Studio to open this file."`

---

## 5. Handling Duplicate Identifiers, Workspace Mismatches & Invalid Connections

1. **Workspace Payload Consistency:**
   - Every node inside a `developer` project should normally have a `dev-*` payload (`video-*` for `video`, `student-*` for `student`).
   - If a node's payload `kind` is structurally valid according to `WorkspaceNodePayload` (for example, a cross-disciplinary project), it is preserved; if `payload.kind` is unrecognized or missing required fields, validation fails with `ERR_INVALID_NODE_PAYLOAD` pointing to the exact `node.id` and index.
2. **Duplicate Node or Edge IDs Within the File:**
   - If two nodes in `project.nodes` share the same `id`, or two edges in `project.edges` share the same `id`, validation fails with `ERR_DUPLICATE_ENTITY_ID`.
3. **Invalid Connections (Missing Endpoints or Self-Loops):**
   - If an edge has `sourceNodeId === targetNodeId` or references a `sourceNodeId`/`targetNodeId` not present in `project.nodes`:
     - By default, validation reports `ERR_DANGLING_EDGE_REFERENCE` listing the affected edge IDs.
     - The Import Modal offers a safe secondary recovery action: **"Import & Remove Invalid Connections (N edges)"**, which strips only the broken edges and imports all valid nodes and edges.
4. **Local Project ID Collision (Existing Project in `IndexedDB`):**
   - If `project.id` already exists in the user's local `IndexedDB`:
     - The Import Modal never overwrites silently. It prompts the user with two explicit buttons:
       1. **Import as New Copy (Default):** Rewrites `project.id` to a new `crypto.randomUUID()` and appends `" (Imported)"` to the title.
       2. **Replace Existing Local Project:** Overwrites the existing `IndexedDB` record with the newly validated project.

---

## 6. Secondary Export Formats (P1)

In addition to lossless `.mindrail.json` archives, MindRail Studio specifies two one-way presentation export formats:

1. **Visual Diagram / Storyboard Export (`.svg` and `.png`):**
   - Serializes the bounding box of all canvas nodes and edges into a standalone, dark-themed `.svg` document (using safe DOM `createElementNS` construction, never unescaped string concatenation) and optionally rasterizes it to `.png` via an offscreen `<canvas>`.
2. **Structured Markdown Export (`.md`):**
   - **Developer:** Architecture component inventory, code snippets in fenced blocks, and task checklist table.
   - **Video Creator:** Ordered scene script, timecodes (`MM:SS`), framing, voice-over cues, and pre-production checklist.
   - **Student:** Hierarchical topic outline, Q&A flashcard list, and revision checklist.

---

## 7. Export / Import Round-Trip Testing Requirement

Every change to [docs/DATA\_MODEL.md](https://www.google.com/search?q=DATA_MODEL.md) or `src/import-export/` must pass an automated **Round-Trip Equivalence Test** ([docs/TESTING\_STRATEGY.md](https://www.google.com/search?q=TESTING_STRATEGY.md)):

```text
normalize(importProjectJson(exportProjectJson(project))) === normalize(project)
```

This test must be verified across representative projects for all three workspaces (`developer`, `video`, `student`) containing every node payload kind, edge style, and checklist state.
