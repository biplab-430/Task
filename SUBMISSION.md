# Submission Checklist & Summary

## Live Deployment Links

- 🌐 **Frontend (Vercel)**: [https://task-eight-topaz.vercel.app/](https://task-eight-topaz.vercel.app/)
- ⚙️ **Backend API (Render)**: [https://task-vmaa.onrender.com/api](https://task-vmaa.onrender.com/api)
- 🗄️ **Database**: MongoDB Atlas (Cloud Cluster)
- 📦 **GitHub Repository**: [https://github.com/biplab-430/Task](https://github.com/biplab-430/Task)

---

## What's Included

### Source Code
- `backend/` — Express API server
  - `server.js` — entry point, CORS, JSON parsing, MongoDB connection
  - `models/User.js` — Mongoose User schema
  - `models/Document.js` — Mongoose Document schema (ownership + sharedWith)
  - `routes/auth.js` — `GET /api/users`, `POST /api/users/login`
  - `routes/docs.js` — full document CRUD + upload + share + revoke + sanitization
  - `tests/docs.test.js` — consolidated Jest/Supertest test suite
  - `.gitignore` — backend dependency and secret exclusion rules
- `frontend/` — Vite + React application
  - `src/api.js` — Axios instance with `x-user-id` interceptor and resilient base URL resolution
  - `src/App.jsx` — router (Dashboard at `/`, Editor at `/doc/:id`)
  - `src/components/Dashboard.jsx` — user switcher, document list, inline rename, delete confirmation
  - `src/components/Editor.jsx` — TipTap rich text editor, save, share modal with revoke list
  - `src/components/Toast.jsx` — non-blocking toast notifications
  - `public/favicon.svg` — application branding asset

### Documentation
- `README.md` — project overview, live deployment URLs, environment setup, local run steps
- `ARCHITECTURE.md` — engineering trade-offs, schemas, and design patterns
- `SUBMISSION.md` — this document
- `AI_WORKFLOW.md` — complete breakdown of engineering decisions, manual QA, and AI tool usage

---

## Technical Summary & Verification ✅

| Feature | Status |
|---------|--------|
| Document creation | ✅ Complete |
| Rich-text editing (bold, italic, underline, H1/H2, lists) | ✅ Complete |
| Document save (`PUT`) with title & sanitization | ✅ Complete |
| Inline rename document (`PATCH /rename`) | ✅ Complete |
| Delete document (owner-only confirmation) | ✅ Complete |
| `.txt` / `.md` file upload → new document | ✅ Complete |
| Dashboard: "My Documents" vs "Shared With Me" | ✅ Complete |
| Sharing with `read` vs `edit` access levels | ✅ Complete |
| Revoke / unshare access (owner only) | ✅ Complete |
| Access control enforcement (403 for unauthorized actions) | ✅ Complete |
| HTML sanitization (strips scripts, iframes, inline event handlers) | ✅ Complete |
| Backend validation & error handling | ✅ Complete |
| Non-blocking toast notifications | ✅ Complete |
| Mocked user switcher in top nav | ✅ Complete |
| Automated Jest test suite (10 tests passing) | ✅ Complete |
| Cloud Production Deployment (Vercel + Render + Atlas) | ✅ Complete |

---

## Production Infrastructure Setup

1. **Frontend Deployment**: Hosted on Vercel with automated Vite build pipeline. Includes base path resolution for backend endpoints.
2. **Backend Deployment**: Hosted on Render Node.js web service running Express with process exception handlers and CORS configuration.
3. **Database Cluster**: MongoDB Atlas M0 cluster configured with global access list (`0.0.0.0/0`) for dynamic Render IP compatibility.

---

## Test Suite Execution

Run locally in the `backend` directory:
```bash
npm run test
```
- **10/10 tests passing** covering file uploads, sharing permissions, revocation, rename, deletion, and XSS sanitization.
