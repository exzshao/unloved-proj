"use client";
import { useEffect, useRef, useState } from 'react';

type Status = { state: 'waiting' } | { state: 'matched'; matchedAt: string };

export default function Page3() {
  const [status, setStatus] = useState<Status>({ state: 'waiting' });
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    let stop = false;
    async function poll() {
      if (stop) return;
      const r = await fetch('/api/status', { cache: 'no-store', credentials: 'include' });
      if (r.ok) {
        const data = (await r.json()) as Status;
        setStatus(data);
      }
      setTimeout(poll, 5000);
    }
    poll();
    return () => { stop = true; };
  }, []);

  return (
    <div>
      {status.state === 'waiting' ? (
        <>
          <h2>Case 1: Your ex did not enter your number (yet?)</h2>
          <div style={{ background: '#e8f1ff', padding: 16, margin: '12px 0' }}>
            <h3>Timer starts</h3>
            <p>Stopwatch: {Math.floor(elapsed / 60)}m {elapsed % 60}s</p>
          </div>
        </>
      ) : (
        <div style={{ background: '#e6f7ef', padding: 16 }}>
          <h2>Case 2: Your ex entered your number</h2>
          <p>It isn't too late to try again. ✅</p>
          <p>They entered your number on: {new Date(status.matchedAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
