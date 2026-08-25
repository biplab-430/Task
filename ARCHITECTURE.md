# Architecture & Technical Decisions

## Overview
This project is built as a highly focused Minimum Viable Product (MVP) prioritizing speed of development, simplicity, and core collaborative sharing mechanics over heavy enterprise boilerplate.

## 1. Mocked Authentication Strategy
Implementing a full OAuth2 or JWT-based authentication flow (involving access tokens, refresh tokens, Bcrypt hashing, cookie management, and strict middleware routing) easily consumes large portions of a strict 4-hour timebox. 
**Decision:** We abstracted authentication into a "Mocked User Switcher". The frontend stores the selected user's `_id` in `localStorage` and attaches it to an `x-user-id` header in Axios. The Express backend extracts this header to determine the request's context. This instantly unlocks the ability to test complex, multi-user edge cases (like Document Sharing permissions) without the friction of a login wall.

## 2. TipTap Rich Text Editor
**Decision:** We selected TipTap over React-Quill or Draft.js.
**Reasoning:** TipTap operates headlessly. This decoupled the rich-text logic from the UI layer, allowing us to style the toolbar rapidly using standard Tailwind CSS classes instead of fighting with legacy CSS overrides (a common pain point with Quill). Furthermore, TipTap natively outputs semantic HTML and JSON, which is trivial to stringify and store flatly in a database.

## 3. Flat MongoDB Schema Design
**Decision:** The `Document` schema stores the TipTap content directly as an HTML string rather than breaking the content down into highly normalized relational chunks or Operational Transformation (OT) delta nodes. 
**Reasoning:** A flat schema minimizes database joins and serialization complexity. Since this is an MVP demonstrating document management and sharing (not real-time collaborative keystroke OT algorithms like Yjs right now), storing HTML strings provides the most predictable and rapid read/write cycles. 

## 4. File Parsing via Multer
We utilized `multer` in memory-storage mode for file uploads (`.txt`/`.md`). This prevents polluting the server's disk space with temporary files, and synchronously processes the buffer into HTML strings before piping it to MongoDB.
