import React, { useState } from 'react';
import { KeyRound, ShieldAlert, Lock, User, Copy, Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generate16DigitCode, registerUser, loginUser, recoverPasswordWithSecretCode } from '../services/storage';

export default function AuthModal({ onLoginSuccess }) {
  const [mode, setMode] = useState('register'); // 'register' | 'login' | 'recover'
  
  // Register state
  const [generatedCode, setGeneratedCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Recovery state
  const [recCode, setRecCode] = useState('');
  const [recNewPassword, setRecNewPassword] = useState('');

  // Feedback state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleGenerateCode = () => {
    const code = generate16DigitCode();
    setGeneratedCode(code);
    setErrorMsg('');
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}
  };

  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!generatedCode) {
      setErrorMsg('Please click "Generate Secret Code" first!');
      return;
    }
    if (!regUsername.trim() || regUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters long.');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    try {
      const newUser = registerUser({
        username: regUsername,
        password: regPassword,
        secretCode: generatedCode,
      });
      onLoginSuccess(newUser);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginUsername.trim() || !loginPassword) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    try {
      const user = loginUser({ username: loginUsername, password: loginPassword });
      onLoginSuccess(user);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleRecoverySubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!recCode.trim() || !recNewPassword) {
      setErrorMsg('Please enter your 16-digit secret code and new password.');
      return;
    }

    try {
      recoverPasswordWithSecretCode({
        secretCode: recCode,
        newPassword: recNewPassword,
      });
      setSuccessMsg('Password updated successfully! You can now log in.');
      setTimeout(() => {
        setMode('login');
        setLoginUsername('');
        setLoginPassword('');
        setSuccessMsg('');
      }, 1800);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'radial-gradient(ellipse at top, #0f172a 0%, #07090e 100%)'
    }}>
      <div className="glass-panel-glow animate-fade-in" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '32px',
        borderRadius: '24px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 242, 254, 0.15)'
      }}>
        {/* Logo / Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 0 20px rgba(0, 242, 254, 0.2)'
          }}>
            <ShieldCheck size={36} color="#00f2fe" />
          </div>
          <h1 className="gradient-text" style={{ fontSize: '1.8rem', fontWeight: '700', letterSpacing: '-0.5px' }}>
            SECRET CHAT
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            {mode === 'register' && 'No Email Required • 16-Digit Master Auth'}
            {mode === 'login' && 'Sign in with your Secret Username & Password'}
            {mode === 'recover' && 'Recover Account using 16-Digit Code'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '24px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.88rem',
              color: mode === 'register' ? '#00f2fe' : 'var(--text-muted)',
              background: mode === 'register' ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
              border: mode === 'register' ? '1px solid rgba(0, 242, 254, 0.25)' : 'none',
              transition: 'var(--transition-smooth)'
            }}
          >
            Create Account
          </button>
          <button
            onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.88rem',
              color: mode === 'login' ? '#00f2fe' : 'var(--text-muted)',
              background: mode === 'login' ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
              border: mode === 'login' ? '1px solid rgba(0, 242, 254, 0.25)' : 'none',
              transition: 'var(--transition-smooth)'
            }}
          >
            Login
          </button>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            padding: '12px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#6ee7b7',
            padding: '12px 14px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Check size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* --- REGISTER FORM --- */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Step 1: 16-Digit Code Generator */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                STEP 1: 16-DIGIT MASTER SECURITY CODE
              </label>

              {!generatedCode ? (
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
                    border: '1px dashed rgba(0, 242, 254, 0.5)',
                    color: '#00f2fe',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    fontSize: '0.95rem',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <Sparkles size={18} />
                  <span>Generate 16-Digit Security Code</span>
                </button>
              ) : (
                <div style={{
                  background: 'rgba(0, 242, 254, 0.08)',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Your Master Auth Key
                    </div>
                    <div className="mono-code" style={{ fontSize: '1.1rem', fontWeight: '700', color: '#00f2fe', letterSpacing: '2px', marginTop: '2px' }}>
                      {generatedCode}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    style={{
                      background: copiedCode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid var(--border-subtle)',
                      color: copiedCode ? '#10b981' : 'var(--text-main)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              )}
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                ⚠️ Save this 16-digit code! You will need it to change password or delete your account.
              </p>
            </div>

            {/* Step 2: Username & Password */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                STEP 2: CHOOSE USERNAME
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="e.g. AgentCipher"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                STEP 3: CHOOSE PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px', padding: '14px', fontSize: '0.95rem' }}>
              <span>Create Secret Account</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* --- LOGIN FORM --- */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                USERNAME
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                  PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('recover'); setErrorMsg(''); }}
                  style={{ fontSize: '0.78rem', color: '#00f2fe', textDecoration: 'underline' }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px', padding: '14px', fontSize: '0.95rem' }}>
              <span>Login to Secret Chat</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* --- RECOVERY FORM --- */}
        {mode === 'recover' && (
          <form onSubmit={handleRecoverySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                YOUR 16-DIGIT SECRET SECURITY CODE
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={recCode}
                  onChange={(e) => setRecCode(e.target.value)}
                  className="input-field mono-code"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                NEW PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={recNewPassword}
                  onChange={(e) => setRecNewPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '42px' }}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px', padding: '14px', fontSize: '0.95rem' }}>
              <span>Reset Password</span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
