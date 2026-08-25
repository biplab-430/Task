# Architecture & Technical Decisions

## Overview
This project is built as a highly focused Minimum Viable Product (MVP) prioritizing speed of development, simplicity, and core collaborative sharing mechanics over heavy enterprise boilerplate.

## Live Production Architecture
- **Frontend**: Hosted on **Vercel** (`https://task-eight-topaz.vercel.app/`). Single Page Application built with React 18, Vite, and Tailwind CSS.
- **Backend API**: Hosted on **Render** (`https://task-vmaa.onrender.com/api`). Node.js + Express REST API.
- **Database**: **MongoDB Atlas** cloud cluster managed via Mongoose schemas.

---

## Key Design Decisions

### 1. Mocked Authentication Strategy
Implementing a full OAuth2 or JWT-based authentication flow (involving access tokens, refresh tokens, Bcrypt hashing, cookie management, and strict middleware routing) easily consumes large portions of a strict timebox. 

**Decision:** We abstracted authentication into a "Mocked User Switcher". The frontend stores the selected user's `_id` in `localStorage` and attaches it to an `x-user-id` header in Axios. The Express backend extracts this header to determine the request's context. This instantly unlocks the ability to test complex, multi-user edge cases (like Document Sharing permissions) without the friction of a login wall.

### 2. TipTap Rich Text Editor
**Decision:** We selected TipTap over React-Quill or Draft.js.  
**Reasoning:** TipTap operates headlessly. This decoupled the rich-text logic from the UI layer, allowing us to style the toolbar rapidly using standard Tailwind CSS classes instead of fighting with legacy CSS overrides (a common pain point with Quill). Furthermore, TipTap natively outputs semantic HTML, which is clean to sanitize and store flatly in MongoDB.

### 3. Flat MongoDB Schema Design
**Decision:** The `Document` schema stores the TipTap content directly as an HTML string rather than breaking the content down into highly normalized relational chunks or Operational Transformation (OT) delta nodes.  
**Reasoning:** A flat schema minimizes database joins and serialization complexity. Storing HTML strings provides predictable, fast read/write cycles suitable for an MVP demonstration of document management, permissions, and sharing.

### 4. File Parsing via Multer
We utilized `multer` in memory-storage mode for file uploads (`.txt`/`.md`). This prevents polluting the server's disk space with temporary files, and synchronously processes the buffer into HTML strings before saving to MongoDB.

### 5. Resilient API Base URL Resolution
To ensure smooth deployment across different platforms (Vercel + Render), the Axios client in `frontend/src/api.js` dynamically sanitizes and appends `/api` to `VITE_API_URL`. This prevents common environment configuration mismatches in production environments.
