"use client";
import { useState } from 'react';

export default function Page2() {
  const [target, setTarget] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setMsg(null);
    const r = await fetch('/api/submissions', { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ target_phone: target }) });
    if (r.ok) window.location.href = '/page3';
    else setMsg('Failed to submit');
  }

  return (
    <div>
      <h1>Enter the other’s number</h1>
      <input value={target} onChange={e => setTarget(e.target.value)} placeholder="Their phone number" style={{ width: '100%', padding: 8 }} />
      <button onClick={submit} style={{ marginTop: 12 }}>Continue →</button>
      {msg && <p style={{ color: 'crimson' }}>{msg}</p>}
    </div>
  );
}
