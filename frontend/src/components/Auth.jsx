import { useState, useEffect } from 'react';
import api from '../api';

export default function Auth({ onLogin }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    api.get('/users').then(res => setUsers(res.data)).catch(console.error);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (selectedUser) {
      const user = users.find(u => u._id === selectedUser);
      onLogin(user);
    } else if (newUsername && newName) {
      try {
        const res = await api.post('/users/login', { username: newUsername, name: newName });
        onLogin(res.data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Select User</label>
            <select 
              className="w-full border rounded p-2"
              value={selectedUser} 
              onChange={e => setSelectedUser(e.target.value)}
            >
              <option value="">-- Create New User --</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.username})</option>
              ))}
            </select>
          </div>
          
          {!selectedUser && (
            <>
              <div>
                <label className="block text-sm font-medium">Username</label>
                <input 
                  type="text" 
                  className="w-full border rounded p-2" 
                  value={newUsername} 
                  onChange={e => setNewUsername(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input 
                  type="text" 
                  className="w-full border rounded p-2" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                />
              </div>
            </>
          )}

          <button type="submit" className="w-full bg-blue-600 text-white rounded p-2 hover:bg-blue-700">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
