import React, { useState } from 'react';
import { MessageSquare, UserPlus, Search, ShieldCheck, LogOut, Lock, UserCheck, AlertCircle } from 'lucide-react';

export default function Sidebar({
  currentUser,
  activeTab,
  setActiveTab,
  contacts,
  activeContact,
  setActiveContact,
  pendingRequestsCount,
  onLogout
}) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <aside style={{
      width: '320px',
      height: '100vh',
      background: 'rgba(10, 14, 23, 0.95)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0
    }}>
      {/* App Branding & User Profile */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(15, 20, 32, 0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={20} color="#00f2fe" />
            </div>
            <div>
              <h2 className="gradient-text" style={{ fontSize: '1.1rem', fontWeight: '700', letterSpacing: '-0.3px' }}>
                SECRET CHAT
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span className="pulse-indicator"></span>
                <span>Encrypted Matrix</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            title="Log Out"
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              transition: 'var(--transition-fast)'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Current User Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00f2fe 0%, #8b5cf6 100%)',
            color: '#050b14',
            fontWeight: '700',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {currentUser?.username?.charAt(0).toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser?.username}
            </div>
            <div className="mono-code" style={{ fontSize: '0.72rem', color: '#00f2fe', letterSpacing: '0.5px' }}>
              {currentUser?.secretCode}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Buttons */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
        <button
          onClick={() => setActiveTab('chats')}
          title="Secret Chats"
          style={{
            padding: '10px',
            borderRadius: '10px',
            background: activeTab === 'chats' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
            border: activeTab === 'chats' ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid transparent',
            color: activeTab === 'chats' ? '#00f2fe' : 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.7rem',
            fontWeight: '600'
          }}
        >
          <MessageSquare size={18} />
          <span>Chats</span>
        </button>

        <button
          onClick={() => setActiveTab('search')}
          title="Search Users"
          style={{
            padding: '10px',
            borderRadius: '10px',
            background: activeTab === 'search' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
            border: activeTab === 'search' ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid transparent',
            color: activeTab === 'search' ? '#00f2fe' : 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.7rem',
            fontWeight: '600'
          }}
        >
          <Search size={18} />
          <span>Search</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          title="Friend Requests"
          style={{
            padding: '10px',
            borderRadius: '10px',
            background: activeTab === 'requests' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
            border: activeTab === 'requests' ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid transparent',
            color: activeTab === 'requests' ? '#00f2fe' : 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.7rem',
            fontWeight: '600',
            position: 'relative'
          }}
        >
          <UserPlus size={18} />
          <span>Requests</span>
          {pendingRequestsCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '8px',
              background: '#ef4444',
              color: '#fff',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              fontSize: '0.65rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700'
            }}>
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          title="Security & 16-Digit Settings"
          style={{
            padding: '10px',
            borderRadius: '10px',
            background: activeTab === 'security' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
            border: activeTab === 'security' ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid transparent',
            color: activeTab === 'security' ? '#00f2fe' : 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.7rem',
            fontWeight: '600'
          }}
        >
          <Lock size={18} />
          <span>Security</span>
        </button>
      </div>

      {/* Tab Content List Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {activeTab === 'chats' && (
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', paddingLeft: '4px' }}>
              SECRET CONTACTS ({contacts.length})
            </div>

            {contacts.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '30px 16px',
                color: 'var(--text-dim)',
                fontSize: '0.85rem'
              }}>
                <UserCheck size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p>No contacts yet.</p>
                <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                  Use <b>Search</b> tab to find users & send friend requests!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {contacts.map(contact => {
                  const isActive = activeContact?.id === contact.id;
                  return (
                    <button
                      key={contact.id}
                      onClick={() => setActiveContact(contact)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '12px',
                        background: isActive ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                        border: isActive ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid transparent',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'var(--transition-fast)'
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: contact.isBot
                          ? 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
                          : 'linear-gradient(135deg, #00f2fe 0%, #10b981 100%)',
                        color: '#050b14',
                        fontWeight: '700',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {contact.username.charAt(0).toUpperCase()}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                            {contact.username}
                          </span>
                          {contact.isBot && (
                            <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
                              BOT
                            </span>
                          )}
                        </div>
                        <div className="mono-code" style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                          {contact.secretCode}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab !== 'chats' && (
          <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            Viewing main content panel for <b>{activeTab.toUpperCase()}</b>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 8, 15, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel-glow animate-fade-in" style={{
            width: '100%',
            maxWidth: '380px',
            padding: '24px',
            borderRadius: '20px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto'
            }}>
              <AlertCircle size={28} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
              Confirm Logout
            </h3>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '22px' }}>
              Are you sure you want to log out of your secret session? Make sure you have your <b>16-Digit Secret Code</b> saved.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px' }}
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="btn-danger"
                style={{ flex: 1, padding: '10px' }}
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
