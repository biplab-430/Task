import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Plus, Upload, FileText, Pencil, Trash2, Check, X } from 'lucide-react';
import Toast from './Toast';

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('userId') || '');
  const [ownedDocs, setOwnedDocs] = useState([]);
  const [sharedDocs, setSharedDocs] = useState([]);
  const [toast, setToast] = useState(null); // { message, type }
  const [confirmDelete, setConfirmDelete] = useState(null); // docId pending deletion
  // Inline rename state: { docId, value }
  const [renaming, setRenaming] = useState(null);
  const navigate = useNavigate();

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    api.get('/users').then(res => {
      setUsers(res.data);
      if (!currentUser && res.data.length > 0) {
        handleUserSwitch(res.data[0]._id);
      }
    }).catch(() => showToast('Failed to load users.', 'error'));
  }, []);

  useEffect(() => {
    if (currentUser) loadDocs();
  }, [currentUser]);

  const handleUserSwitch = (userId) => {
    setCurrentUser(userId);
    localStorage.setItem('userId', userId);
  };

  const loadDocs = () => {
    api.get('/documents').then(res => {
      setOwnedDocs(res.data.ownedDocs);
      setSharedDocs(res.data.sharedDocs);
    }).catch(() => showToast('Failed to load documents.', 'error'));
  };

  const createDoc = async () => {
    try {
      const res = await api.post('/documents', { title: 'Untitled Document' });
      navigate(`/doc/${res.data._id}`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create document.', 'error');
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // reset input so same file can be re-uploaded
    e.target.value = '';
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/documents/upload', formData);
      navigate(`/doc/${res.data._id}`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Upload failed.', 'error');
    }
  };

  // ── Rename ─────────────────────────────────────────────────────────────────
  const startRename = (e, doc) => {
    e.stopPropagation();
    setRenaming({ docId: doc._id, value: doc.title });
  };

  const commitRename = async (e) => {
    e?.stopPropagation();
    if (!renaming) return;
    const { docId, value } = renaming;
    const trimmed = value.trim();
    if (!trimmed) {
      showToast('Title cannot be empty.', 'error');
      return;
    }
    try {
      await api.patch(`/documents/${docId}/rename`, { title: trimmed });
      setOwnedDocs(prev => prev.map(d => d._id === docId ? { ...d, title: trimmed } : d));
      showToast('Document renamed.', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Rename failed.', 'error');
    } finally {
      setRenaming(null);
    }
  };

  const cancelRename = (e) => {
    e?.stopPropagation();
    setRenaming(null);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/documents/${confirmDelete}`);
      setOwnedDocs(prev => prev.filter(d => d._id !== confirmDelete));
      showToast('Document deleted.', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Delete failed.', 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-80">
            <h3 className="text-lg font-bold mb-2">Delete Document</h3>
            <p className="text-sm text-gray-600 mb-4">This action cannot be undone. Are you sure?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Global Nav & User Switcher */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Collab Editor MVP</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">Test As:</label>
          <select
            value={currentUser}
            onChange={(e) => handleUserSwitch(e.target.value)}
            className="border p-2 rounded shadow-sm bg-white"
          >
            {users.map(u => (
              <option key={u._id} value={u._id}>{u.name} (@{u.username})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mb-8">
        <button onClick={createDoc} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
          <Plus size={18} /> Create New Document
        </button>
        <label className="flex items-center gap-2 bg-gray-100 text-gray-700 border px-4 py-2 rounded shadow-sm cursor-pointer hover:bg-gray-200 transition">
          <Upload size={18} /> Upload .txt/.md
          <input type="file" className="hidden" accept=".txt,.md" onChange={handleUpload} />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* My Documents */}
        <div>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">My Documents</h2>
          <div className="flex flex-col gap-3">
            {ownedDocs.map(doc => (
              <div
                key={doc._id}
                onClick={() => !renaming && navigate(`/doc/${doc._id}`)}
                className="flex items-center gap-3 border p-4 rounded shadow-sm hover:shadow bg-white transition cursor-pointer group"
              >
                <FileText className="text-blue-500 shrink-0" size={24} />
                <div className="flex-1 min-w-0">
                  {/* Inline rename */}
                  {renaming?.docId === doc._id ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        className="border-b border-blue-500 outline-none text-sm font-medium flex-1 min-w-0"
                        value={renaming.value}
                        maxLength={200}
                        onChange={e => setRenaming(r => ({ ...r, value: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitRename();
                          if (e.key === 'Escape') cancelRename();
                        }}
                      />
                      <button onClick={commitRename} className="text-green-600 hover:text-green-700 p-1"><Check size={14} /></button>
                      <button onClick={cancelRename} className="text-gray-400 hover:text-gray-600 p-1"><X size={14} /></button>
                    </div>
                  ) : (
                    <h3 className="font-medium text-gray-800 truncate">{doc.title}</h3>
                  )}
                  <p className="text-xs text-gray-500">Updated: {new Date(doc.updatedAt).toLocaleDateString()}</p>
                </div>
                {/* Action icons — only visible on hover, hidden during rename */}
                {!renaming && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    <button
                      onClick={e => startRename(e, doc)}
                      title="Rename"
                      className="p-1 rounded hover:bg-gray-100 text-gray-500"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDelete(doc._id); }}
                      title="Delete"
                      className="p-1 rounded hover:bg-red-100 text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {ownedDocs.length === 0 && <p className="text-gray-500 text-sm">No documents owned by you.</p>}
          </div>
        </div>

        {/* Shared With Me */}
        <div>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Shared With Me</h2>
          <div className="flex flex-col gap-3">
            {sharedDocs.map(doc => (
              <div
                key={doc._id}
                onClick={() => navigate(`/doc/${doc._id}`)}
                className="flex items-center gap-3 border p-4 rounded shadow-sm hover:shadow cursor-pointer bg-indigo-50 border-indigo-100 transition"
              >
                <FileText className="text-indigo-500 shrink-0" size={24} />
                <div className="min-w-0">
                  <h3 className="font-medium text-gray-800 truncate">{doc.title}</h3>
                  <p className="text-xs text-gray-500">Owner: {doc.ownerId?.name || doc.ownerId?.username}</p>
                </div>
              </div>
            ))}
            {sharedDocs.length === 0 && <p className="text-gray-500 text-sm">No documents shared with you.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
