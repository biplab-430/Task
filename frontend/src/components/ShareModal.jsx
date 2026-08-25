import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../api';

export default function ShareModal({ docId, currentShares, onClose }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [permission, setPermission] = useState('read');

  useEffect(() => {
    api.get('/users').then(res => setUsers(res.data)).catch(console.error);
  }, []);

  const handleShare = async () => {
    if (!selectedUser) return;
    try {
      await api.post(`/documents/${docId}/share`, { targetUserId: selectedUser, permission });
      onClose(); // In a real app, you'd refresh the list or show success
    } catch (err) {
      alert('Share failed: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow-lg w-96 relative">
        <button onClick={onClose} className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold mb-4">Share Document</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Select User</label>
            <select 
              className="w-full border rounded p-2"
              value={selectedUser} 
              onChange={e => setSelectedUser(e.target.value)}
            >
              <option value="">-- Choose User --</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.username})</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium">Permission</label>
            <select 
              className="w-full border rounded p-2"
              value={permission} 
              onChange={e => setPermission(e.target.value)}
            >
              <option value="read">Read Only</option>
              <option value="edit">Edit</option>
            </select>
          </div>

          <button onClick={handleShare} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
