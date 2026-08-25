# Submission Checklist

## What's Included

### Source Code
- `backend/` — Express API server
  - `server.js` — entry point, CORS, JSON parsing, MongoDB connection
  - `models/User.js` — Mongoose User schema
  - `models/Document.js` — Mongoose Document schema (ownership + sharedWith)
  - `routes/auth.js` — `GET /api/users`, `POST /api/users/login`
  - `routes/docs.js` — full document CRUD + upload + share + revoke + sanitization
  - `tests/docs.test.js` — consolidated Jest/Supertest test suite
- `frontend/` — Vite + React application
  - `src/api.js` — Axios instance with `x-user-id` interceptor
  - `src/App.jsx` — router (Dashboard at `/`, Editor at `/doc/:id`)
  - `src/components/Dashboard.jsx` — user switcher, document list, rename, delete
  - `src/components/Editor.jsx` — TipTap editor, save, share modal with revoke
  - `src/components/Toast.jsx` — reusable toast notification

### Documentation
- `README.md` — full setup guide, seeded users, known limitations
- `ARCHITECTURE.md` — engineering decisions and trade-offs
- `SUBMISSION.md` — this file
- `AI_WORKFLOW.md` — AI tool usage, what was changed, how correctness was verified

---

## What's Working ✅

| Feature | Status |
|---------|--------|
| Document creation | ✅ |
| Rich-text editing (bold, italic, underline, H1/H2, lists) | ✅ |
| Document save (PUT) with title | ✅ |
| Rename document (PATCH /rename, inline UI) | ✅ |
| Delete document (owner-only, confirmation dialog) | ✅ |
| `.txt` / `.md` file upload → new document | ✅ |
| Dashboard: "My Documents" vs "Shared With Me" | ✅ |
| Sharing with read / edit permissions | ✅ |
| Revoke / unshare (owner only) | ✅ |
| Access control enforcement (403 for non-owners) | ✅ |
| HTML sanitization on save (strips scripts, iframes, event handlers) | ✅ |
| Backend validation (empty titles → 400, missing fields → 400) | ✅ |
| Frontend error toasts (no silent console.error) | ✅ |
| Mocked user switcher in global nav | ✅ |
| Jest test suite (10 tests, all passing) | ✅ |

---

## What's Incomplete / Out of Scope

| Item | Notes |
|------|-------|
| Real-time collaboration (WebSocket / CRDTs) | Out of scope for 4-hour MVP |
| Markdown rendering for `.md` uploads | Files imported as plain text |
| Deployment | See below |
| Walkthrough video | Must be recorded manually |
| Image / file embeds in editor | Not implemented |
| Actual JWT / OAuth auth | Deliberately mocked |

---

## Deployment

> **These steps must be completed manually — they are outside the scope of AI-assisted code generation.**

Recommended free-tier stack:
- **Frontend**: [Vercel](https://vercel.com) — connect the `frontend/` folder, set build command `npm run build`, output `dist/`
- **Backend**: [Render](https://render.com) or [Railway](https://railway.app) — connect the `backend/` folder, set start command `node server.js`
- **Database**: [MongoDB Atlas](https://cloud.mongodb.com) — free M0 cluster; copy the connection URI into the backend `MONGODB_URI` env var on your host

---

## Walkthrough Video

> **Must be recorded manually.** Suggested content (3–5 min):
> 1. Open the dashboard and show the user switcher
> 2. Create a new document and use rich-text formatting
> 3. Upload a `.txt` file
> 4. Share the document with read vs edit access
> 5. Switch user — verify read-only view
> 6. Return as owner — rename, revoke, then delete

---

## With 2–4 More Hours, I Would Build

1. **Markdown rendering on upload** — use `marked` to convert `.md` to HTML before storing
2. **Auto-save** — debounced `PUT` every 2 seconds while editing (no manual Save button needed)
3. **Real deployment** — Vercel + Render + Atlas pipeline with environment variables
4. **Permission indicator in Shared With Me** — show `read` / `edit` badge on dashboard cards
