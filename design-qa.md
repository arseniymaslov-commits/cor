source visual truth path: ImageGen option 3, `ig_008974e30f387d36016a33c2c3cab0819ba6677740294f5942.png`
implementation screenshot path: `qa-artifacts/home-1440x1024-qa-passed.png`
mobile screenshot path: `qa-artifacts/home-390x844-qa-passed.png`
viewport: 1440 x 1024 desktop, 390 x 844 mobile
state: default clerk workspace, OCR clicked, save clicked, export endpoint checked
full-view comparison evidence: source and implementation were opened visually; implementation preserves the selected three-zone workspace: correspondence registry, incoming document registration form, OCR/attachments panel, Red Petroleum brand, red accent actions, status chips, route timeline, and compact corporate UI density.
focused region comparison evidence: route timeline, registry rows, OCR upload panel, form fields, action footer, status chips, and responsive mobile stacking were inspected from captured screenshots.

**Findings**
- No actionable P0/P1/P2 findings remain.

**Required Fidelity Surfaces**
- Fonts and typography: modern system UI stack is used with readable 12-20px product text; labels, table rows, chips, and form controls have appropriate hierarchy. Long registry text truncates intentionally for dense CRM scanning.
- Spacing and layout rhythm: desktop matches the chosen clerk-workspace layout with a fixed sidebar, three operational columns, light dividers, compact controls, and no nested card structure. Mobile stacks sections vertically without overlap.
- Colors and visual tokens: Red Petroleum red is used for primary actions, active navigation, risks, and the selected route step; neutral white/gray surfaces keep the interface minimal. Status colors are semantically differentiated.
- Image quality and asset fidelity: the supplied Red Petroleum raster logo is used directly from `public/logo.png`; no fake logo or CSS drawing substitutes are used. Icons use a single outline icon family.
- Copy and content: Russian interface copy matches the MVP domain: входящие/исходящие, OCR, Konica import, route steps, tags, archive, status chips, and document metadata.

**Patches Made Since Previous QA Pass**
- Removed the extra KPI strip that was not part of selected visual direction.
- Adjusted workspace grid and registry density.
- Fixed route-step label wrapping on desktop.
- Verified OCR interaction, save action, and Excel export response.
- Added the employee self-service submission screen and verified navigation, OCR-to-data step transition, submission success state, `/api/submissions`, and mobile stacking.
- Added first-login authentication for the admin and clerk accounts; verified email check, password creation, role display, and logout.
- Removed previous demo documents and demo requests; verified empty registry state, empty submission history, API-backed load, and adding a new document into the visible register.

**Implementation Checklist**
- Build completed with `npm run build`.
- Local app returned HTTP 200 at `http://127.0.0.1:3000`.
- `/api/documents`, `/api/documents/next-number`, `/api/ocr`, and `/api/export` are present.
- `/api/submissions` is present for employee registration requests.
- `/api/auth/login`, `/api/auth/me`, and `/api/auth/logout` are present for first-login auth.
- `/api/documents`, `/api/submissions`, and `/api/export` no longer return old seeded demo rows.
- Excel export returned HTTP 200 with XLSX content type.
- Desktop and mobile screenshots captured.

**Follow-up Polish**
- P3: once real production data is connected, tune column widths around the longest real agency names and subjects.
- P3: add a dedicated manager dashboard route using the same design system.

final result: passed
