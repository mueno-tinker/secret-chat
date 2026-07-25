import React, { useState } from 'react';
import { Search, UserPlus, Check, Clock, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { getUsers, getFriendRequests, sendFriendRequest } from '../services/storage';

export default function UserSearch({ currentUser, onRefreshData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState(null);

  const allUsers = getUsers().filter(u => u.id !== currentUser.id);
  const requests = getFriendRequests();

  // Filter users by search term
  const filteredUsers = allUsers.filter(u => {
    if (!searchTerm.trim()) return true; // Show all potential users if search empty
    const term = searchTerm.toLowerCase().trim();
    return (
      u.username.toLowerCase().includes(term) ||
      u.secretCode.toLowerCase().includes(term)
    );
  });

  const getRelationshipStatus = (targetUserId) => {
    const existingReq = requests.find(r => 
      (r.fromUserId === currentUser.id && r.toUserId === targetUserId) ||
      (r.fromUserId === targetUserId && r.toUserId === currentUser.id)
    );

    if (!existingReq) return { type: 'NONE' };

    if (existingReq.status === 'accepted') {
      return { type: 'FRIENDS' };
    }

    if (existingReq.status === 'pending') {
      if (existingReq.fromUserId === currentUser.id) {
        return { type: 'OUTGOING_PENDING' };
      } else {
        return { type: 'INCOMING_PENDING' };
      }
    }

    return { type: 'NONE' };
  };

  const handleSendRequest = (targetUser) => {
    try {
      sendFriendRequest({
        fromUserId: currentUser.id,
        toUserId: targetUser.id,
      });
      setMessage({ type: 'success', text: `Secret request sent to ${targetUser.username}!` });
      onRefreshData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div style={{ flex: 1, padding: '32px', overflowY: 'auto', background: 'var(--bg-dark)' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        
        {/* Title */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Search color="#00f2fe" size={24} />
            <h2 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: '700' }}>
              Find Secret Agents & Users
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Search by Username or 16-Digit Master Secret Code to connect.
          </p>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search by username or code (e.g. Cipher99 or 1111-2222-3333-4444)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field mono-code"
            style={{ paddingLeft: '48px', fontSize: '1rem', height: '52px', borderRadius: '14px' }}
          />
        </div>

        {/* Feedback Alert */}
        {message && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: message.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            color: message.type === 'success' ? '#6ee7b7' : '#fca5a5',
          }}>
            {message.type === 'success' ? <Check size={18} /> : <ShieldAlert size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* User Results List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredUsers.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No users matching "{searchTerm}". Try searching for another username or code!
            </div>
          ) : (
            filteredUsers.map(user => {
              const status = getRelationshipStatus(user.id);

              return (
                <div key={user.id} className="glass-panel" style={{
                  padding: '18px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  borderRadius: '16px',
                  transition: 'var(--transition-smooth)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: user.isBot
                        ? 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
                        : 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                      color: '#050b14',
                      fontWeight: '700',
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '600', fontSize: '1.05rem', color: 'var(--text-main)' }}>
                          {user.username}
                        </span>
                        {user.isBot && (
                          <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
                            BOT AGENT
                          </span>
                        )}
                      </div>
                      <div className="mono-code" style={{ fontSize: '0.8rem', color: '#00f2fe', marginTop: '2px' }}>
                        Code: {user.secretCode}
                      </div>
                    </div>
                  </div>

                  {/* Status Action Button */}
                  <div>
                    {status.type === 'FRIENDS' && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10b981',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        <UserCheck size={16} />
                        Secret Contact
                      </span>
                    )}

                    {status.type === 'OUTGOING_PENDING' && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        color: '#f59e0b',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        <Clock size={16} />
                        Request Sent
                      </span>
                    )}

                    {status.type === 'INCOMING_PENDING' && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        background: 'rgba(139, 92, 246, 0.15)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        color: '#c084fc',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        <Clock size={16} />
                        Pending in Requests
                      </span>
                    )}

                    {status.type === 'NONE' && (
                      <button
                        onClick={() => handleSendRequest(user)}
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        <UserPlus size={16} />
                        <span>Send Request</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
