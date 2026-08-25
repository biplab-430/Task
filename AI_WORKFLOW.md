# AI Workflow & Development Report

## Live Deployment Links

- **Frontend**: [https://task-eight-topaz.vercel.app/](https://task-eight-topaz.vercel.app/)
- **Backend**: [https://task-vmaa.onrender.com/api](https://task-vmaa.onrender.com/api)
- **Repository**: [https://github.com/biplab-430/Task](https://github.com/biplab-430/Task)

---

## AI Tools Used

| Tool | Role & Scope |
|------|-------------|
| **Antigravity (Google DeepMind)** | Primary agentic coding assistant for scaffolding project boilerplate, writing test cases, refactoring components, and generating initial docs. |

---

## Where AI Materially Sped Up the Work

- **Project Scaffolding**: Rapid setup of Express, Vite React project structure, Tailwind configuration, and Mongoose schemas.
- **Boilerplate Express Routes**: Fast generation of standard REST CRUD endpoints, error middleware, and Multer file upload handling.
- **Test Suite Generation**: Automated creation of Jest + Supertest test cases covering HTML sanitization, share enforcement, rename, and delete permissions.
- **Documentation Drafts**: First-pass drafting of technical setup files and schema descriptions.

---

## Manual Refinements & Critical Problem Solving

While AI assisted with rapid code generation, key architectural, security, and deployment challenges were analyzed, diagnosed, and resolved directly:

| Area | Manual Intervention / Decision | Rationale & Outcome |
|------|--------------------------------|---------------------|
| **MongoDB Atlas Whitelisting** | Configured `0.0.0.0/0` in Atlas Network Access | Render uses dynamic IP ranges; whitelisting allowed cloud database connectivity. |
| **API Path Normalization** | Added automatic base URL path resolution in `api.js` | Solved 404 routing errors caused by missing `/api` suffix in environment variables on Vercel. |
| **Favicon & Asset Fixes** | Replaced broken `/vite.svg` reference with `/favicon.svg` in `index.html` | Fixed 404 console warnings on initial app load. |
| **Share Modal UX** | Added "Currently Shared With" section with access revocation | Provided owners full control to remove access from shared users. |
| **Toast Notifications** | Replaced blocking `alert()` dialogs with custom `Toast.jsx` component | Prevented UI thread blocking and improved application feedback. |
| **Memory Server Timeout** | Adjusted Jest test timeouts for `mongodb-memory-server` | Accommodated binary downloading during initial test runner startup. |

---

## Verification & Reliability Steps

### 1. Automated Tests
- Ran full test suite via `npm run test` in `backend/`.
- Verified 10 out of 10 passing tests covering:
  - Document creation & retrieval
  - `.txt` / `.md` file upload parsing
  - Ownership vs non-ownership 403 access control
  - Revoking shared access
  - XSS sanitization (removing `<script>`, `<iframe>`, and inline `onclick` handlers)

### 2. Manual QA Pass
- Tested multi-user flows by switching between **Alice** and **Bob** using the navigation user switcher.
- Verified live rich-text document editing, title updating, file uploads, sharing with read/edit roles, revoking access, and document deletion.
- Confirmed cross-origin requests work seamlessly between Vercel and Render endpoints.

---

## Personal Reflections

1. **What was most effective with AI assist?**  
   Generating boilerplate code (Mongoose models, Express route skeletons, Tailwind styling structure) saved substantial time and allowed focus to shift directly to core logic, security, and cloud deployment.

2. **Where was active intervention essential?**  
   Cloud integration and environment configuration (CORS policies, MongoDB Atlas network permissions, Vercel environment base path matching) required hands-on diagnosis by viewing actual network logs and browser console output.

3. **Key takeaway for future projects**:  
   Using AI for rapid implementation paired with rigorous manual verification and end-to-end testing provides the optimal balance of speed, code quality, and production readiness.
