const express = require('express');
const router = express.Router();
const multer = require('multer');
const sanitizeHtml = require('sanitize-html');
const Document = require('../models/Document');

// Multer memory storage configuration
const upload = multer({ storage: multer.memoryStorage() });

// ─── Sanitize config: only allow tags TipTap actually produces ───────────────
const SANITIZE_OPTIONS = {
  allowedTags: [
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'em', 'u', 's', 'del', 'mark', 'code', 'pre',
    'ul', 'ol', 'li', 'blockquote', 'br', 'hr',
    'a',
  ],
  allowedAttributes: {
    'a': ['href', 'target', 'rel'],
  },
  disallowedTagsMode: 'discard', // strips scripts/iframes/event handlers silently
};

const sanitize = (html) => sanitizeHtml(html || '', SANITIZE_OPTIONS);

// ─── Auth middleware ──────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  const userId = req.headers['x-user-id'] || req.query.userId || req.body?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized: missing user ID' });
  req.userId = userId;
  next();
};

// ─── GET /api/documents ───────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const ownedDocs = await Document.find({ ownerId: req.userId }).sort({ updatedAt: -1 });
    const sharedDocs = await Document.find({ 'sharedWith.user': req.userId })
      .populate('ownerId', 'name username')
      .sort({ updatedAt: -1 });

    res.json({ ownedDocs, sharedDocs });
  } catch (err) {
    console.error('GET /api/documents error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/documents ─────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  const title = (req.body.title || '').trim();
  if (!title) return res.status(400).json({ error: 'Document title cannot be empty.' });
  if (title.length > 200) return res.status(400).json({ error: 'Title must be 200 characters or fewer.' });

  try {
    const doc = new Document({
      title,
      ownerId: req.userId,
      content: '',
    });
    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    console.error('POST /api/documents error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/documents/:id ───────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate('sharedWith.user', 'username name')
      .populate('ownerId', 'username name');

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const isOwner = doc.ownerId?._id?.toString() === req.userId || doc.ownerId?.toString() === req.userId;
    const sharedAccess = doc.sharedWith.find(s => (s.user?._id?.toString() || s.user?.toString()) === req.userId);

    if (!isOwner && !sharedAccess) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ doc, access: isOwner ? 'owner' : sharedAccess.permission });
  } catch (err) {
    console.error(`GET /api/documents/${req.params.id} error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/documents/:id ───────────────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const isOwner = doc.ownerId.toString() === req.userId;
    const sharedAccess = doc.sharedWith.find(s => (s.user?._id?.toString() || s.user?.toString()) === req.userId);
    const canEdit = isOwner || (sharedAccess && sharedAccess.permission === 'edit');

    if (!canEdit) return res.status(403).json({ error: 'Forbidden: read-only access' });

    if (req.body.title !== undefined) {
      const title = req.body.title.trim();
      if (!title) return res.status(400).json({ error: 'Title cannot be empty.' });
      if (title.length > 200) return res.status(400).json({ error: 'Title must be 200 characters or fewer.' });
      doc.title = title;
    }
    if (req.body.content !== undefined) {
      doc.content = sanitize(req.body.content); // ← sanitize on every save
    }

    await doc.save();
    res.json(doc);
  } catch (err) {
    console.error(`PUT /api/documents/${req.params.id} error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/documents/:id/rename ─────────────────────────────────────────
router.patch('/:id/rename', requireAuth, async (req, res) => {
  const title = (req.body.title || '').trim();
  if (!title) return res.status(400).json({ error: 'Title cannot be empty.' });
  if (title.length > 200) return res.status(400).json({ error: 'Title must be 200 characters or fewer.' });

  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const isOwner = doc.ownerId.toString() === req.userId;
    const sharedAccess = doc.sharedWith.find(s => (s.user?._id?.toString() || s.user?.toString()) === req.userId);
    const canEdit = isOwner || (sharedAccess && sharedAccess.permission === 'edit');

    if (!canEdit) return res.status(403).json({ error: 'Forbidden: you cannot rename this document.' });

    doc.title = title;
    await doc.save();
    res.json(doc);
  } catch (err) {
    console.error(`PATCH /api/documents/${req.params.id}/rename error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/documents/:id ────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (doc.ownerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the document owner can delete it.' });
    }

    await doc.deleteOne();
    res.status(200).json({ message: 'Document deleted successfully.' });
  } catch (err) {
    console.error(`DELETE /api/documents/${req.params.id} error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/documents/upload ──────────────────────────────────────────────
// NOTE: this must be declared BEFORE /:id/share to avoid param collision
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  const ext = req.file.originalname.split('.').pop().toLowerCase();
  if (!['txt', 'md'].includes(ext)) {
    return res.status(400).json({ error: 'Only .txt and .md files are allowed.' });
  }

  try {
    const textContent = req.file.buffer ? req.file.buffer.toString('utf-8') : '';
    const htmlContent = textContent
      .split('\n')
      .map(line => `<p>${line}</p>`)
      .join('');

    const doc = new Document({
      title: req.file.originalname || 'Uploaded Document',
      ownerId: req.userId,
      content: sanitize(htmlContent),
    });

    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    console.error('POST /api/documents/upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/documents/:id/share ───────────────────────────────────────────
router.post('/:id/share', requireAuth, async (req, res) => {
  const { targetUserId, permission } = req.body;
  if (!targetUserId) return res.status(400).json({ error: 'targetUserId is required.' });
  if (!['read', 'edit'].includes(permission)) {
    return res.status(400).json({ error: 'permission must be "read" or "edit".' });
  }

  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (doc.ownerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the document owner can share it' });
    }

    const existingShareIndex = doc.sharedWith.findIndex(s => (s.user?._id?.toString() || s.user?.toString()) === targetUserId);
    if (existingShareIndex > -1) {
      doc.sharedWith[existingShareIndex].permission = permission;
    } else {
      doc.sharedWith.push({ user: targetUserId, permission });
    }

    await doc.save();
    const populated = await doc.populate('sharedWith.user', 'username name');
    res.json(populated);
  } catch (err) {
    console.error(`POST /api/documents/${req.params.id}/share error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/documents/:id/share/:targetUserId ───────────────────────────
router.delete('/:id/share/:targetUserId', requireAuth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (doc.ownerId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only the document owner can revoke access.' });
    }

    const before = doc.sharedWith.length;
    doc.sharedWith = doc.sharedWith.filter(
      s => (s.user?._id?.toString() || s.user?.toString()) !== req.params.targetUserId
    );

    if (doc.sharedWith.length === before) {
      return res.status(404).json({ error: 'That user does not have access to this document.' });
    }

    await doc.save();
    const populated = await doc.populate('sharedWith.user', 'username name');
    res.json(populated);
  } catch (err) {
    console.error(`DELETE /api/documents/${req.params.id}/share/${req.params.targetUserId} error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

