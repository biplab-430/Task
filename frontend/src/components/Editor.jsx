import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { ArrowLeft, Save, Share2, X, Trash2 } from 'lucide-react';
import api from '../api';
import Toast from './Toast';

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [access, setAccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [users, setUsers] = useState([]);
  const [shareTarget, setShareTarget] = useState('');
  const [sharePerm, setSharePerm] = useState('read');
  const [sharedWith, setSharedWith] = useState([]); // live-updated list
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => setToast({ message, type }), []);

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: '',
    editable: false,
  });

  useEffect(() => {
    api.get(`/documents/${id}`).then(res => {
      setTitle(res.data.doc.title);
      setAccess(res.data.access);
      setSharedWith(res.data.doc.sharedWith || []);
      if (editor) {
        editor.commands.setContent(res.data.doc.content);
        editor.setEditable(res.data.access === 'owner' || res.data.access === 'edit');
      }
    }).catch(err => {
      showToast(err.response?.data?.error || 'Error loading document.', 'error');
      navigate('/');
    });

    api.get('/users').then(res => setUsers(res.data)).catch(console.error);
  }, [id, editor, navigate, showToast]);

  const handleSave = async () => {
    if (!editor || access === 'read') return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) { showToast('Title cannot be empty.', 'error'); return; }
    setSaving(true);
    try {
      await api.put(`/documents/${id}`, { title: trimmedTitle, content: editor.getHTML() });
      showToast('Saved!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!shareTarget) { showToast('Please select a user.', 'error'); return; }
    try {
      const res = await api.post(`/documents/${id}/share`, { targetUserId: shareTarget, permission: sharePerm });
      setSharedWith(res.data.sharedWith);
      setShareTarget('');
      showToast('Access granted!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Share failed.', 'error');
    }
  };

  const handleRevoke = async (targetUserId) => {
    try {
      const res = await api.delete(`/documents/${id}/share/${targetUserId}`);
      setSharedWith(res.data.sharedWith);
      showToast('Access revoked.', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Revoke failed.', 'error');
    }
  };

  const canEdit = access === 'owner' || access === 'edit';

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col h-screen">
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 bg-gray-100 hover:bg-gray-200 rounded">
            <ArrowLeft size={18} />
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!canEdit}
            maxLength={200}
            className="text-2xl font-bold bg-transparent outline-none focus:border-b-2 border-blue-500 w-64"
          />
          <span className="text-xs px-2 py-1 bg-gray-200 rounded uppercase font-medium">{access}</span>
        </div>

        <div className="flex gap-2">
          {access === 'owner' && (
            <button onClick={() => setShowShare(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 font-medium">
              <Share2 size={16} /> Share
            </button>
          )}
          {canEdit && (
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium">
              <Save size={16} /> {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      {canEdit && editor && (
        <div className="flex gap-1 mb-4 p-2 bg-gray-50 border rounded-lg flex-wrap">
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={`px-3 py-1 rounded font-bold ${editor.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>B</button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-3 py-1 rounded italic ${editor.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>I</button>
          <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`px-3 py-1 rounded underline ${editor.isActive('underline') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>U</button>
          <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`px-3 py-1 rounded font-semibold ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>H1</button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-3 py-1 rounded font-semibold ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>H2</button>
          <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-3 py-1 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>• List</button>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`px-3 py-1 rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>1. List</button>
        </div>
      )}

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto p-6 border rounded-lg bg-white shadow-inner cursor-text">
        <EditorContent editor={editor} />
      </div>

      {/* Share Modal */}
      {showShare && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[28rem] relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowShare(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-4">Share Document</h2>

            {/* Grant access */}
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Add User</label>
                <select value={shareTarget} onChange={e => setShareTarget(e.target.value)} className="w-full border p-2 rounded">
                  <option value="">-- Select User --</option>
                  {users
                    .filter(u => u._id !== localStorage.getItem('userId'))
                    .filter(u => !sharedWith.some(s => (s.user?._id || s.user) === u._id))
                    .map(u => (
                      <option key={u._id} value={u._id}>{u.name} (@{u.username})</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Permission</label>
                <select value={sharePerm} onChange={e => setSharePerm(e.target.value)} className="w-full border p-2 rounded">
                  <option value="read">Read Only</option>
                  <option value="edit">Editor</option>
                </select>
              </div>
              <button onClick={handleShare} className="w-full bg-indigo-600 text-white p-2 rounded font-medium hover:bg-indigo-700">
                Grant Access
              </button>
            </div>

            {/* Current shares */}
            {sharedWith.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Currently Shared With</h3>
                <ul className="space-y-2">
                  {sharedWith.map(s => {
                    const userId = s.user?._id || s.user;
                    const userName = s.user?.name || s.user?.username || 'Unknown';
                    return (
                      <li key={userId} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border">
                        <div>
                          <span className="text-sm font-medium">{userName}</span>
                          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${s.permission === 'edit' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                            {s.permission}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRevoke(userId)}
                          className="text-red-500 hover:text-red-700 flex items-center gap-1 text-xs"
                          title="Remove access"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
