import React, { useState, useEffect, useRef } from 'react';
import { Send, Shield, Lock, Image, Timer, MessageSquare } from 'lucide-react';
import { getMessages, sendMessage, subscribeToRealtime } from '../services/storage';

export default function ChatArea({ currentUser, activeContact }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selfDestructTimer, setSelfDestructTimer] = useState(null);
  const messagesEndRef = useRef(null);

  const loadMessages = async () => {
    if (!activeContact) return;
    const allMsgs = await getMessages();
    const conversation = allMsgs.filter(m => 
      (m.senderId === currentUser.id && m.receiverId === activeContact.id) ||
      (m.senderId === activeContact.id && m.receiverId === currentUser.id)
    );
    setMessages(conversation);
  };

  useEffect(() => {
    loadMessages();
  }, [activeContact, currentUser]);

  useEffect(() => {
    const unsub = subscribeToRealtime(() => {
      loadMessages();
    });
    return () => unsub();
  }, [activeContact, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      await sendMessage({
        senderId: currentUser.id,
        receiverId: activeContact.id,
        text: textToSend,
        selfDestructIn: selfDestructTimer,
      });
      await loadMessages();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendQuickImage = async () => {
    const mockImages = [
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60'
    ];
    const randomImg = mockImages[Math.floor(Math.random() * mockImages.length)];
    
    await sendMessage({
      senderId: currentUser.id,
      receiverId: activeContact.id,
      text: `![Encrypted Media](${randomImg})`,
    });
    await loadMessages();
  };

  if (!activeContact) {
    return (
      <div style={{
        flex: 1,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-dark)',
        color: 'var(--text-muted)',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '24px',
          background: 'rgba(0, 242, 254, 0.08)',
          border: '1px solid rgba(0, 242, 254, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <MessageSquare size={36} color="#00f2fe" />
        </div>
        <h3 className="gradient-text" style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px' }}>
          Select a Secret Contact to Chat
        </h3>
        <p style={{ maxWidth: '400px', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
          Choose a contact from the sidebar or send a new request in the <b>Search</b> tab.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-dark)',
      position: 'relative'
    }}>
      
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        background: 'rgba(15, 20, 32, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: activeContact.isBot
              ? 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
              : 'linear-gradient(135deg, #00f2fe 0%, #10b981 100%)',
            color: '#050b14',
            fontWeight: '700',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {activeContact.username.charAt(0).toUpperCase()}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                {activeContact.username}
              </span>
              {activeContact.isBot && (
                <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
                  BOT
                </span>
              )}
            </div>
            <div className="mono-code" style={{ fontSize: '0.75rem', color: '#00f2fe' }}>
              Auth Code: {activeContact.secretCode}
            </div>
          </div>
        </div>

        {/* Security Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          fontSize: '0.78rem',
          fontWeight: '600'
        }}>
          <Lock size={14} />
          <span>256-Bit E2E Encrypted</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            margin: 'auto',
            textAlign: 'center',
            color: 'var(--text-dim)',
            fontSize: '0.9rem',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            maxWidth: '360px'
          }}>
            <Shield size={32} style={{ marginBottom: '10px', color: '#00f2fe' }} />
            <p>End-to-End Encrypted Session Established.</p>
            <p style={{ fontSize: '0.78rem', marginTop: '6px' }}>Say hello to <b>{activeContact.username}</b>!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.senderId === currentUser.id;
            const isImage = msg.text.startsWith('![Encrypted Media]');
            const imgUrl = isImage ? msg.text.match(/\((.*?)\)/)?.[1] : null;

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                  alignSelf: isMe ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  padding: '12px 16px',
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isMe
                    ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.25) 0%, rgba(79, 172, 254, 0.25) 100%)'
                    : 'rgba(255, 255, 255, 0.07)',
                  border: isMe ? '1px solid rgba(0, 242, 254, 0.4)' : '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  boxShadow: isMe ? '0 4px 15px rgba(0, 242, 254, 0.15)' : 'none',
                  position: 'relative'
                }}>
                  {isImage ? (
                    <div>
                      <img
                        src={imgUrl}
                        alt="Encrypted Media"
                        style={{ maxWidth: '280px', borderRadius: '10px', display: 'block', marginBottom: '6px' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#00f2fe', display: 'block', fontStyle: 'italic' }}>
                        📷 Encrypted Image Payload
                      </span>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.95rem', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {msg.text}
                    </p>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.7rem',
                  color: 'var(--text-dim)',
                  marginTop: '4px',
                  padding: '0 4px'
                }}>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.selfDestructIn && (
                    <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Timer size={10} /> {msg.selfDestructIn}s ephemeral
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div style={{
        padding: '16px 24px',
        background: 'rgba(15, 20, 32, 0.9)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button
          type="button"
          onClick={handleSendQuickImage}
          title="Send Encrypted Image"
          style={{
            padding: '10px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            transition: 'var(--transition-fast)'
          }}
        >
          <Image size={20} />
        </button>

        <form onSubmit={handleSend} style={{ flex: 1, display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder={`Send secret message to ${activeContact.username}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="input-field"
            style={{ borderRadius: '12px', padding: '12px 18px', fontSize: '0.95rem' }}
          />

          <button
            type="submit"
            className="btn-primary"
            disabled={!inputText.trim()}
            style={{
              padding: '0 20px',
              borderRadius: '12px',
              opacity: inputText.trim() ? 1 : 0.5,
              cursor: inputText.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            <Send size={18} />
            <span>Send</span>
          </button>
        </form>
      </div>

    </div>
  );
}
