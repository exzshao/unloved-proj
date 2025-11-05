"use client";
import { useState } from 'react';

export default function Page1() {
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function send() {
    setMsg(null);
    const r = await fetch('/api/otp/send', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ phone }) });
    if (r.ok) setSent(true); else {
      try { const { error } = await r.json(); setMsg(error || 'Failed to send code'); } catch { setMsg('Failed to send code'); }
    }
  }

  async function verify() {
    setMsg(null);
    const r = await fetch('/api/otp/verify', { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ phone, code }) });
    if (r.ok) window.location.href = '/page2';
    else {
      try { const { error } = await r.json(); setMsg(error || 'Invalid code'); } catch { setMsg('Invalid code'); }
    }
  }

  return (
    <div>
      <h1>Enter your number</h1>
      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 555 5555" style={{ width: '100%', padding: 8 }} />
      {!sent ? (
        <button onClick={send} style={{ marginTop: 12 }}>Send phone code</button>
      ) : (
        <div style={{ marginTop: 12 }}>
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="Enter verification code" style={{ width: '100%', padding: 8 }} />
          <button onClick={verify} style={{ marginTop: 12 }}>Move on to page 2 →</button>
        </div>
      )}
      {msg && <p style={{ color: 'crimson' }}>{msg}</p>}
    </div>
  );
}
