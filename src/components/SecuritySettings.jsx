import React, { useState } from 'react';
import { Lock, KeyRound, Trash2, Eye, EyeOff, ShieldAlert, Check, Copy, AlertTriangle } from 'lucide-react';
import { changePasswordWithCode, deleteAccountWithCode } from '../services/storage';

export default function SecuritySettings({ currentUser, onLogout, onRefreshUser }) {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Change password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [changeCode, setChangeCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState(null);

  // Delete account fields
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteMsg, setDeleteMsg] = useState(null);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentUser.secretCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setPassMsg(null);

    if (!currentPassword || !changeCode.trim() || !newPassword) {
      setPassMsg({ type: 'error', text: 'Please fill in all fields including your 16-Digit Code.' });
      return;
    }

    try {
      changePasswordWithCode({
        userId: currentUser.id,
        currentPassword,
        secretCode: changeCode,
        newPassword,
      });

      setPassMsg({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setChangeCode('');
      setNewPassword('');
      if (onRefreshUser) onRefreshUser();
    } catch (err) {
      setPassMsg({ type: 'error', text: err.message });
    }
  };

  const handleDeleteAccount = (e) => {
    e.preventDefault();
    setDeleteMsg(null);

    if (!deletePassword || !deleteCode.trim()) {
      setDeleteMsg({ type: 'error', text: 'Password and 16-Digit Secret Code are required to delete account.' });
      return;
    }

    try {
      deleteAccountWithCode({
        userId: currentUser.id,
        password: deletePassword,
        secretCode: deleteCode,
      });

      alert('Account permanently erased.');
      onLogout();
    } catch (err) {
      setDeleteMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div style={{ flex: 1, padding: '32px', overflowY: 'auto', background: 'var(--bg-dark)' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h2 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: '700' }}>
            Security & Authentication Key Center
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Your 16-Digit Secret Code is your master authority key. It is required for changing passwords and deleting your account.
          </p>
        </div>

        {/* Section 1: Display Master Secret Code */}
        <div className="glass-panel-glow" style={{ padding: '24px', borderRadius: '18px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <KeyRound color="#00f2fe" size={20} />
              <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-main)' }}>
                Your 16-Digit Master Security Code
              </span>
            </div>

            <button
              onClick={() => setShowCode(!showCode)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {showCode ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{showCode ? 'Hide Code' : 'Reveal Code'}</span>
            </button>
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div className="mono-code" style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#00f2fe',
              letterSpacing: '3px'
            }}>
              {showCode ? currentUser.secretCode : '••••-••••-••••-••••'}
            </div>

            <button
              onClick={handleCopyCode}
              style={{
                background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 242, 254, 0.15)',
                border: copied ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(0, 242, 254, 0.4)',
                color: copied ? '#10b981' : '#00f2fe',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            Keep this code completely safe. It cannot be recovered if deleted!
          </p>
        </div>

        {/* Section 2: Change Password */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '18px', marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock size={20} color="#00f2fe" />
            <span>Change Password (Requires 16-Digit Code)</span>
          </h3>

          {passMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              marginBottom: '16px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: passMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: passMsg.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              color: passMsg.type === 'success' ? '#6ee7b7' : '#fca5a5'
            }}>
              {passMsg.type === 'success' ? <Check size={16} /> : <ShieldAlert size={16} />}
              <span>{passMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                CURRENT PASSWORD
              </label>
              <input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#00f2fe', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                16-DIGIT MASTER SECURITY CODE
              </label>
              <input
                type="text"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={changeCode}
                onChange={(e) => setChangeCode(e.target.value)}
                className="input-field mono-code"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                NEW PASSWORD
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field"
              />
            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '6px' }}>
              Update Password
            </button>
          </form>
        </div>

        {/* Section 3: Delete Account */}
        <div style={{
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          padding: '24px',
          borderRadius: '18px'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fca5a5', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} />
            <span>Danger Zone: Delete Account</span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Deleting your account will permanently wipe your profile, secret code, contacts, and message history. <b>Requires 16-digit master code confirmation.</b>
          </p>

          {deleteMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              marginBottom: '16px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5'
            }}>
              <ShieldAlert size={16} />
              <span>{deleteMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleDeleteAccount} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  PASSWORD
                </label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#fca5a5', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  16-DIGIT SECRET CODE
                </label>
                <input
                  type="text"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={deleteCode}
                  onChange={(e) => setDeleteCode(e.target.value)}
                  className="input-field mono-code"
                />
              </div>
            </div>

            <button type="submit" className="btn-danger" style={{ alignSelf: 'flex-start', marginTop: '6px' }}>
              <Trash2 size={16} />
              <span>Permanently Delete My Account</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
