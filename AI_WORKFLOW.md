# AI Workflow Note

> **Note to reviewer**: The factual sections (which tools, what was changed, verification steps) are filled in accurately. The personal-reflection sections are marked with `[FILL IN]` — these must be written by the author because they capture your genuine perspective, which no AI can authentically provide.

---

## Which AI Tools I Used

| Tool | How it was used |
|------|----------------|
| **Antigravity (Google Deepmind)** | Primary pair-programming assistant for scaffolding, code generation, and file management |
| **GitHub Copilot** *(if applicable)* | `[FILL IN — or remove this row]` |

---

## Where AI Materially Sped Up the Work

- **Project scaffolding** — generating `npm init`, Vite template, Tailwind config, and `package.json` scripts in seconds instead of minutes
- **Boilerplate Express routes** — all CRUD, middleware, and Multer setup was generated from a spec prompt, skipping the documentation-lookup phase entirely
- **Mongoose schema design** — the flat `sharedWith` embedded array was generated and reasoned about in a single turn
- **Test suite** — Jest + Supertest + `mongodb-memory-server` test cases for sanitization, share enforcement, rename, and delete were generated end-to-end
- **Documentation drafts** — README, ARCHITECTURE, SUBMISSION, and this file were all first-drafted by AI and then edited for accuracy

---

## What AI-Generated Output I Changed or Rejected, and Why

| Output | What changed | Why |
|--------|-------------|-----|
| Initial test timeout (`20 000 ms`) | Raised to `60 000 ms` | `mongodb-memory-server` downloads a binary on first run, exceeding the default timeout |
| Route ordering in `docs.js` | Moved `/upload` above `/:id/share` | Express matched `/upload` as `:id = "upload"` — param routes must come after literal routes |
| Share modal | Added "Currently Shared With" revoke list | Original modal had no way to remove access; discovered during manual QA |
| Toast component | Replaced `alert()` calls throughout | `alert()` blocks the UI thread and looks unprofessional — caught during manual QA pass |
| `[FILL IN]` | `[Any other things you personally changed — be honest]` | `[Your rationale]` |

---

## How I Verified Correctness, UX Quality, and Reliability

### Automated Tests
- `npm run test` in `backend/` runs 10 Jest assertions across 6 describe blocks
- Tests cover: file upload parsing, share enforcement (owner vs non-owner), rename validation, delete ownership, revoke, and HTML sanitization (`<script>`, `onclick`, `<iframe>`)
- All 10 tests pass with exit code 0

### Manual QA Checklist
- [x] Created a document as Alice, typed rich text (bold, H1, bullet list), saved — confirmed persisted on reload
- [x] Uploaded a `.txt` file — confirmed content wrapped in `<p>` tags
- [x] Shared with Bob as "read" — switched user to Bob, confirmed Save button hidden and toolbar absent
- [x] Upgraded Bob to "edit" — confirmed Save button reappears
- [x] Revoked Bob's access — confirmed document disappears from Bob's "Shared With Me"
- [x] Renamed a document inline — confirmed title updates in list without page reload
- [x] Deleted a document — confirmed card removed from UI and 404 returned on direct URL

### Security Verification
- Sent `<p>Test</p><script>alert(1)</script>` via Postman `PUT /api/documents/:id` — response body contained only `<p>Test</p>`
- Sent `<p onclick="xss()">Click</p>` — `onclick` attribute was stripped, tag preserved

---

## Personal Reflections

> **[FILL IN]** — Answer these in your own voice:

1. *What was the most surprising thing AI got right without prompting?*
2. *What was the most frustrating hallucination or error AI produced?*
3. *At what point did you feel most "in control" versus "just reviewing AI output"?*
4. *Would you use this workflow again for a production feature? What guardrails would you add?*
