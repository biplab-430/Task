# Collaborative Document Editor MVP

A lightweight real-time-capable collaborative document editor built with the MERN stack.

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
- **MongoDB** running locally on `127.0.0.1:27017`  
  (or provide a remote Atlas URI — see below)
- npm v8+

---

## Environment Variables

### Backend — `backend/.env`
Create this file (not committed to git):

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/collab-editor-mvp
```

> For MongoDB Atlas, replace the URI with your Atlas connection string, e.g.:  
> `MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/collab-editor-mvp`

### Frontend — no `.env` required
The frontend hard-codes `http://localhost:5000/api` as the base URL in `src/api.js`.  
If you change the backend port, update that file accordingly.

---

## Seeding Test Users

The app uses **mocked authentication** — users are selected via a dropdown.  
To seed the initial users, send two POST requests to the backend after starting it:

```bash
# Seed Alice
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","name":"Alice"}'

# Seed Bob
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","name":"Bob"}'
```

Or use Postman / Insomnia with the same payloads.

### Seeded Test User Credentials

| Display Name | Username | Role for testing |
|---|---|---|
| **Alice** | `alice` | Document owner / sharer |
| **Bob** | `bob` | Recipient of shared documents |

Once seeded, the **"Test As"** dropdown in the dashboard will list both users.  
Switch to Bob to verify read/edit permissions and the "Shared With Me" section.

---

## Running Locally

### 1. Backend

```bash
cd backend
npm install
npm run dev          # starts with nodemon on port 5000
```

Verify: `GET http://localhost:5000/api/health` → `OK`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev          # starts Vite on port 5173
```

Open **http://localhost:5173** in your browser.

---

## Default Ports

| Service | Port |
|---------|------|
| Express API | `5000` |
| Vite Dev Server | `5173` |
| MongoDB (local) | `27017` |

---

## Running the Tests

Tests use an **in-memory MongoDB instance** (no external DB required):

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
| `.md` | Treated as plain text (no Markdown → HTML conversion) |

### Known Limitations

- **No real-time collaboration** — changes by two simultaneous editors will overwrite each other on save (last write wins).
- **No Markdown rendering** — `.md` files are treated as plain text.
- **No image uploads** — TipTap image extension is not included.
- **Mocked auth** — the `x-user-id` header is not signed or verified; this is intentional for MVP demo purposes only.
