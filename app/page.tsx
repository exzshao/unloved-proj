"use client";
import { useState, useEffect, useRef } from 'react';

type Status = { state: 'waiting'; submittedAt?: string } | { state: 'matched'; matchedAt: string; submittedAt?: string; otherEnteredAt?: string };
type Step = 'login' | 'enter-code' | 'enter-target' | 'result';

export default function Page() {
  const [step, setStep] = useState<Step>('login');
  const [loading, setLoading] = useState(true);

  // Login step
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loginMsg, setLoginMsg] = useState<string | null>(null);
  const [codeMsg, setCodeMsg] = useState<string | null>(null);

  // Target step
  const [target, setTarget] = useState('');
  const [targetMsg, setTargetMsg] = useState<string | null>(null);

  // Result step
  const [status, setStatus] = useState<Status | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const submittedAtRef = useRef<Date | null>(null);
  const [timeToMatch, setTimeToMatch] = useState<string>('');

  // Check session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const r = await fetch('/api/check-submission', { credentials: 'include' });
        if (r.ok) {
          const { has_submission } = await r.json();
          if (has_submission) {
            setStep('result');
          } else {
            setStep('enter-target');
          }
        } else {
          // Session invalid or expired, clear it and show login
          setStep('login');
        }
      } catch (error) {
        // Network error or other issue, show login
        console.error('Session check failed:', error);
        setStep('login');
      }
      setLoading(false);
    }
    checkSession();
  }, []);

  // Timer logic for result step (only when waiting, stops when matched)
  useEffect(() => {
    if (step !== 'result' || !status || status.state !== 'waiting') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    timerRef.current = setInterval(() => {
      if (submittedAtRef.current) {
        const now = new Date();
        const diff = Math.floor((now.getTime() - submittedAtRef.current.getTime()) / 1000);
        setElapsed(diff);
      }
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, status]);

  // Calculate time to match (absolute duration between both submissions)
  function calculateTimeToMatch(submittedAt: string, otherEnteredAt: string): string {
    if (!submittedAt || !otherEnteredAt) return '';
    
    const submitted = new Date(submittedAt);
    const otherEntered = new Date(otherEnteredAt);
    const diffMs = Math.abs(otherEntered.getTime() - submitted.getTime());
    
    // Handle negative values (shouldn't happen, but safety check)
    if (diffMs < 0) return '';
    
    const totalSeconds = Math.floor(diffMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    const totalYears = Math.floor(totalDays / 365);
    
    const remainingDays = totalDays % 365;
    const remainingHours = totalHours % 24;
    const remainingMinutes = totalMinutes % 60;
    const remainingSeconds = totalSeconds % 60;
    
    // Build string with only non-zero units
    const parts: string[] = [];
    if (totalYears > 0) parts.push(`${totalYears} ${totalYears === 1 ? 'year' : 'years'}`);
    if (remainingDays > 0) parts.push(`${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`);
    if (remainingHours > 0) parts.push(`${remainingHours} ${remainingHours === 1 ? 'hour' : 'hours'}`);
    if (remainingMinutes > 0) parts.push(`${remainingMinutes} ${remainingMinutes === 1 ? 'minute' : 'minutes'}`);
    if (remainingSeconds > 0 || parts.length === 0) {
      parts.push(`${remainingSeconds} ${remainingSeconds === 1 ? 'second' : 'seconds'}`);
    }
    
    return parts.join(', ');
  }

  // Calculate time to match when status becomes matched
  useEffect(() => {
    if (step !== 'result' || !status || status.state !== 'matched') {
      setTimeToMatch('');
      return;
    }
    if (status.submittedAt && status.otherEnteredAt) {
      const duration = calculateTimeToMatch(status.submittedAt, status.otherEnteredAt);
      setTimeToMatch(duration);
    } else {
      setTimeToMatch('');
    }
  }, [step, status]);

  // Polling for result step
  useEffect(() => {
    if (step !== 'result') return;
    
    let stop = false;
    async function poll() {
      if (stop) return;
      const r = await fetch('/api/status', { cache: 'no-store', credentials: 'include' });
      if (r.ok) {
        const data = (await r.json()) as Status;
        setStatus(data);
        
        if (data.state === 'waiting' && data.submittedAt && !submittedAtRef.current) {
          submittedAtRef.current = new Date(data.submittedAt);
          const now = new Date();
          const diff = Math.floor((now.getTime() - submittedAtRef.current.getTime()) / 1000);
          setElapsed(diff);
        }
      }
      setTimeout(poll, 5000);
    }
    poll();
    return () => { stop = true; };
  }, [step]);

  async function send() {
    setLoginMsg(null);
    const r = await fetch('/api/otp/send', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ phone }) });
    if (r.ok) {
      setStep('enter-code');
    } else {
      try { const { error } = await r.json(); setLoginMsg(error || 'Failed to send code'); } catch { setLoginMsg('Failed to send code'); }
    }
  }

  async function verify() {
    setCodeMsg(null);
    const r = await fetch('/api/otp/verify', { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ phone, code }) });
    if (r.ok) {
      // After login, route based on whether user already has a submission
      try {
        const cs = await fetch('/api/check-submission', { credentials: 'include' });
        if (cs.ok) {
          const { has_submission } = await cs.json();
          setStep(has_submission ? 'result' : 'enter-target');
        } else {
          setStep('enter-target');
        }
      } catch {
        setStep('enter-target');
      }
    }
    else {
      try { const { error } = await r.json(); setCodeMsg(error || 'Invalid code'); } catch { setCodeMsg('Invalid code'); }
    }
  }

  async function submit() {
    setTargetMsg(null);
    // prevent self-targeting on the client side
    const normalize = (v: string) => v.replace(/\D/g, '');
    if (normalize(target) && normalize(phone) && normalize(target) === normalize(phone)) {
      setTargetMsg("Please enter the other's number, not your own.");
      return;
    }
    const r = await fetch('/api/submissions', { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ target_phone: target }) });
    if (r.ok) setStep('result');
    else setTargetMsg('Failed to submit');
  }

  if (loading) return <div style={{ color: '#fff' }}>Loading...</div>;

  if (step === 'login') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '2rem',
        margin: '-24px',
        backgroundColor: '#000',
        color: '#fff'
      }}>
        <h1 style={{ color: '#fff', fontSize: '2rem', marginTop: '40vh', marginBottom: 16, fontWeight: 'normal' }}>enter your number</h1>
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && phone) send(); }}
          placeholder="Your phone number"
          style={{
            width: '100%',
            maxWidth: 200,
            padding: '8px 0',
            backgroundColor: 'transparent',
            color: '#fff',
            border: 'none',
            borderBottom: '1px solid #fff',
            outline: 'none',
            textAlign: 'center'
          }}
        />
        {loginMsg && <p style={{ color: '#ff6b6b', marginTop: 12 }}>{loginMsg}</p>}
      </div>
    );
  }

  if (step === 'enter-code') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '2rem',
        margin: '-24px',
        backgroundColor: '#000',
        color: '#fff'
      }}>
        <h1 style={{ color: '#fff', fontSize: '2rem', marginTop: '40vh', marginBottom: 16, fontWeight: 'normal' }}>enter the verification code</h1>
        <input
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && code) verify(); }}
          placeholder="Verification code"
          style={{
            width: '100%',
            maxWidth: 200,
            padding: '8px 0',
            backgroundColor: 'transparent',
            color: '#fff',
            border: 'none',
            borderBottom: '1px solid #fff',
            outline: 'none',
            textAlign: 'center'
          }}
        />
        {codeMsg && <p style={{ color: '#ff6b6b', marginTop: 12 }}>{codeMsg}</p>}
      </div>
    );
  }

  if (step === 'enter-target') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '2rem',
        margin: '-24px',
        backgroundColor: '#000',
        color: '#fff'
      }}>
        <h1 style={{ color: '#fff', fontSize: '2rem', marginTop: '40vh', marginBottom: 16, fontWeight: 'normal' }}>enter the other's number</h1>
        <input
          value={target}
          onChange={e => setTarget(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && target) submit(); }}
          placeholder="Their phone number"
          style={{
            width: '100%',
            maxWidth: 200,
            padding: '8px 0',
            backgroundColor: 'transparent',
            color: '#fff',
            border: 'none',
            borderBottom: '1px solid #fff',
            outline: 'none',
            textAlign: 'center'
          }}
        />
        {targetMsg && <p style={{ color: '#ff6b6b', marginTop: 12 }}>{targetMsg}</p>}
      </div>
    );
  }

  // Result step render
  if (step === 'result') {
    if (!status) return <div style={{ color: '#fff' }}>Loading status...</div>;
    return (
      <div>
        {status.state === 'waiting' ? (
          <div style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textAlign: 'center',
            padding: '2rem',
            margin: '-24px',
            backgroundColor: '#000',
            color: '#fff'
          }}>
            <p style={{ 
              fontSize: '3rem', 
              marginTop: '40vh',
              marginBottom: '2rem',
              color: '#fff'
            }}>
              you are here to risk your heart
            </p>
            <div style={{ fontSize: '1.2rem', color: '#fff' }}>
              <p>Elaspsed time: {Math.floor(elapsed / 60)}m {elapsed % 60}s</p>
            </div>
          </div>
        ) : (
          <div style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            textAlign: 'center',
            padding: '2rem',
            margin: '-24px',
            backgroundColor: '#000',
            color: '#fff'
          }}>
            <p style={{ 
              fontSize: '3rem', 
              marginTop: '40vh',
              marginBottom: '2rem',
              color: '#fff'
            }}>
              it isn't too late to try again
            </p>
            <div style={{ fontSize: '1.2rem', color: '#fff' }}>
              <p>they entered your number on: {new Date(status.otherEnteredAt || status.matchedAt).toLocaleString()}</p>
              <p>it took {timeToMatch || 'calculating...'} to match</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ color: '#fff' }}>
      {/* Fallback (should not hit) */}
    </div>
  );
}

