import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Clock, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getUsers, getFriendRequests, respondToFriendRequest } from '../services/storage';

export default function FriendRequests({ currentUser, onRefreshData, onSelectContact }) {
  const [users, setUsers] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const uData = await getUsers();
      const rData = await getFriendRequests();
      setUsers(uData);
      setAllRequests(rData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const incomingRequests = allRequests.filter(r => r.toUserId === currentUser.id && r.status === 'pending');
  const outgoingRequests = allRequests.filter(r => r.fromUserId === currentUser.id && r.status === 'pending');

  const handleResponse = async (requestId, status, fromUser) => {
    try {
      await respondToFriendRequest({ requestId, status });
      if (status === 'accepted') {
        try {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
        } catch (e) {}
        if (fromUser && onSelectContact) {
          onSelectContact(fromUser);
        }
      }
      await loadData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getUserDetails = (userId) => {
    return users.find(u => u.id === userId) || { username: 'Unknown User', secretCode: 'XXXX-XXXX-XXXX-XXXX' };
  };

  return (
    <div style={{ flex: 1, padding: '32px', overflowY: 'auto', background: 'var(--bg-dark)' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        
        {/* Title */}
        <div style={{ marginBottom: '28px' }}>
          <h2 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: '700' }}>
            Secret Friend Requests
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Review pending invitations from other agents before enabling encrypted texting.
          </p>
        </div>

        {/* Section 1: Incoming Requests */}
        <div style={{ marginBottom: '36px' }}>
          <h3 style={{ fontSize: '1rem', color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Sparkles size={18} />
            <span>INCOMING REQUESTS ({incomingRequests.length})</span>
          </h3>

          {loading ? (
            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading requests...
            </div>
          ) : incomingRequests.length === 0 ? (
            <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No pending incoming secret requests.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {incomingRequests.map(req => {
                const sender = getUserDetails(req.fromUserId);
                return (
                  <div key={req.id} className="glass-panel-glow" style={{
                    padding: '18px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00f2fe 0%, #8b5cf6 100%)',
                        color: '#050b14',
                        fontWeight: '700',
                        fontSize: '1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {sender.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '1.05rem', color: 'var(--text-main)' }}>
                          {sender.username}
                        </div>
                        <div className="mono-code" style={{ fontSize: '0.8rem', color: '#00f2fe', marginTop: '2px' }}>
                          Code: {sender.secretCode}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleResponse(req.id, 'declined', sender)}
                        className="btn-secondary"
                        style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                      >
                        <UserX size={16} />
                        <span>Decline</span>
                      </button>

                      <button
                        onClick={() => handleResponse(req.id, 'accepted', sender)}
                        className="btn-primary"
                        style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                      >
                        <UserCheck size={16} />
                        <span>Accept & Text</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Outgoing Requests */}
        <div>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Clock size={18} />
            <span>OUTGOING SENT REQUESTS ({outgoingRequests.length})</span>
          </h3>

          {loading ? (
            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading requests...
            </div>
          ) : outgoingRequests.length === 0 ? (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No outgoing requests currently waiting for response.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {outgoingRequests.map(req => {
                const recipient = getUserDetails(req.toUserId);
                return (
                  <div key={req.id} className="glass-panel" style={{
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'var(--text-main)',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {recipient.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {recipient.username}
                        </div>
                        <div className="mono-code" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          Code: {recipient.secretCode}
                        </div>
                      </div>
                    </div>

                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#f59e0b',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}>
                      <Clock size={14} />
                      Waiting for Accept
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
