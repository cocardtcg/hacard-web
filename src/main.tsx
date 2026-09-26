import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { loadCatalog } from './data/cards';
import './style.css';

let loading: Promise<void> | undefined;
function Bootstrap() {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    loading ??= loadCatalog().catch(error => { loading = undefined; throw error; });
    loading.then(() => { if (!cancelled) setState('ready'); }, () => { if (!cancelled) setState('error'); });
    return () => { cancelled = true; };
  }, [attempt]);
  if (state === 'ready') return <App />;
  return <main className="startup" role="status"><h1>하이큐!! 바보카 BREAK</h1>{state === 'loading' ? <p>카드 도감을 불러오는 중입니다…</p> : <><p>카드 데이터를 불러오지 못했습니다. 연결을 확인하고 다시 시도하세요.</p><button className="primary" onClick={() => { setState('loading'); setAttempt(n => n + 1); }}>다시 시도</button></>}</main>;
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Bootstrap /></React.StrictMode>);
