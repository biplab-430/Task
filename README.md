# Collaborative Document Editor MVP

A lightweight real-time-capable collaborative document editor built with the MERN stack.

## 🚀 Live Deployment

- **Frontend (Vercel)**: [https://task-eight-topaz.vercel.app/](https://task-eight-topaz.vercel.app/)
- **Backend API (Render)**: [https://task-vmaa.onrender.com/api](https://task-vmaa.onrender.com/api)
- **Database**: MongoDB Atlas (Cloud Cluster)

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, Tailwind CSS |
| Editor | TipTap (headless rich-text) |
| Backend | Node.js + Express |
| Database | MongoDB via Mongoose |
| Auth | Mocked — `x-user-id` header |
| File Upload | Multer (memory storage) |
| Sanitization | `sanitize-html` |
| Tests | Jest + Supertest + `mongodb-memory-server` |

---

## Prerequisites

- **Node.js** v16 or higher (`node -v` to confirm)
- **MongoDB** running locally on `127.0.0.1:27017` or remote MongoDB Atlas cluster
- npm v8+

---

## Environment Variables

### Backend — `backend/.env`
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/collab-editor-mvp
CLIENT_ORIGIN=https://task-eight-topaz.vercel.app
```

### Frontend — `frontend/.env`
```env
VITE_API_URL=https://task-vmaa.onrender.com/api
```

---

## Test Users & Pre-seeded Data

The app uses **mocked authentication** for simple role switching:

| Display Name | Username | Role for testing |
|---|---|---|
| **Alice** | `alice` | Document owner / sharer |
| **Bob** | `bob` | Recipient of shared documents |

Once started, the backend automatically seeds `alice` and `bob` into the database if empty. Use the **"Test As"** dropdown in the navigation bar to switch between users.

---

## Running Locally

### 1. Backend

```bash
cd backend
npm install
npm run dev          # starts with nodemon on port 5000
```

Verify: `GET http://localhost:5000/api/health` → `{"status":"OK","message":"Server is healthy"}`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev          # starts Vite on port 5173
```

Open **http://localhost:5173** in your browser.

---

## Running the Tests

Tests use an **in-memory MongoDB instance** (`mongodb-memory-server`):

```bash
cd backend
npm run test
```

The test suite covers:
- `.txt` / `.md` file parsing and upload
- Document creation, rename, and delete
- Sharing grant and 403 enforcement
- Revoking access
- HTML sanitization (script tags, event handlers, iframes are stripped)

---

## Supported Upload File Types

| Extension | Notes |
|-----------|-------|
| `.txt` | Plain text; each line becomes a `<p>` tag |
| `.md` | Plain text import into rich text editor |

---

## Architecture & Design Highlights

- **Headless Rich-Text Editor**: TipTap integrated cleanly with custom Tailwind controls.
- **Role-Based Sharing**: Document ownership model with `read` vs `edit` permissions.
- **XSS Protection**: HTML sanitization applied prior to saving document content.
- **Monorepo Structure**: Clean separation of `frontend` and `backend` directories.
