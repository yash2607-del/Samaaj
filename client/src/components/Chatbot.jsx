import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiX } from 'react-icons/fi';

const DEFAULT_GREETING = 'Hi — I can help with submitting complaints, location, and photo guidance.';

const readStoredUser = () => {
  if (typeof window === 'undefined') return null;

  try {
    const rawUser = window.localStorage.getItem('user');
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
};

const readStoredToken = () => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem('token') || '';
};

const defaultResponses = [
  { q: /hi|hello|hey/i, a: 'Hello! How can I help you with your complaint today?' },
  { q: /how (do|can) i submit/i, a: 'Go to Submit Complaint, fill title, category, description, location and attach a photo.' },
  { q: /location|auto[- ]detect|gps/i, a: 'Use the Auto-Detect Current Location button on the complaint form and allow location permissions.' },
  { q: /photo|image|validate/i, a: 'Upload a clear image. The app will run an AI check and warn if image quality is bad.' },
  { q: /department|dept/i, a: 'Departments are assigned automatically based on category. You can also select a department if visible.' },
  { q: /thanks|thank you/i, a: "You're welcome — glad to help!" }
];

export default function Chatbot() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ from: 'bot', text: DEFAULT_GREETING }]);
  const [authState, setAuthState] = useState(() => ({ token: readStoredToken(), user: readStoredUser() }));
  const [profile, setProfile] = useState(() => readStoredUser());
  const [input, setInput] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    const syncAuthState = () => {
      const nextUser = readStoredUser();
      const nextToken = readStoredToken();

      setAuthState({ token: nextToken, user: nextUser });

      if (!nextToken && !nextUser) {
        setProfile(null);
        return;
      }

      if (nextUser) {
        setProfile(prev => ({ ...(prev || {}), ...nextUser }));
      }
    };

    syncAuthState();
    window.addEventListener('authChanged', syncAuthState);
    window.addEventListener('storage', syncAuthState);

    return () => {
      window.removeEventListener('authChanged', syncAuthState);
      window.removeEventListener('storage', syncAuthState);
    };
  }, []);

  useEffect(() => {
    const name = profile?.name || profile?.email;
    const greeting = name
      ? `Hi ${name} — I can help with submitting complaints, checking status, and photo guidance.`
      : DEFAULT_GREETING;

    setMessages(prev => {
      if (!prev.length) return [{ from: 'bot', text: greeting }];
      const next = [...prev];
      next[0] = { from: 'bot', text: greeting };
      return next;
    });
  }, [profile?.email, profile?.name]);

  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      if (!authState.token && !authState.user) {
        return;
      }

      try {
        const headers = authState.token ? { Authorization: `Bearer ${authState.token}` } : {};
        const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profile`, { headers, credentials: 'include' });
        if (!mounted || !resp.ok) return;
        const data = await resp.json();
        const u = data?.user || data;
        if (u) {
          setProfile(prev => ({ ...(prev || {}), ...u }));
        }
      } catch (e) {
        // ignore
      }
    }

    fetchProfile();
    return () => { mounted = false; };
  }, [authState.token, authState.user?.email, authState.user?.id, authState.user?.role]);

  const postBot = (text) => {
    const msg = { from: 'bot', text };
    setMessages(prev => [...prev, msg]);
  };

  const handleSend = (txt) => {
    if (!txt || !txt.trim()) return;
    const cleaned = txt.trim();
    setMessages(prev => [...prev, { from: 'user', text: cleaned }]);
    setInput('');
    // send to server-side chatbot responder
    (async () => {
      try {
        const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/chatbot/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleaned, role: profile?.role })
        });
        if (!resp.ok) return postBot('Sorry, chatbot is unavailable.');
        const data = await resp.json();
        if (data?.reply) postBot(data.reply);
        if (data?.action) {
          const action = data.action;
          // route to the frontend path
          navigate(action);
        }
      } catch (e) {
        console.error('chatbot call failed', e);
        postBot('Sorry, chatbot failed to respond.');
      }
    })();
  };

  return (
    <div>
      {open && (
        <div style={{ position: 'fixed', right: 20, bottom: 90, width: 320, maxHeight: 420, zIndex: 9999, boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
          <div style={{ background: '#FFB347', padding: '10px 12px', borderTopLeftRadius: 12, borderTopRightRadius: 12, color: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <strong>Help Chat</strong>
              {profile && (
                <small style={{ fontSize: 12, opacity: 0.9 }}>{profile.name || profile.email} {profile.role ? `· ${profile.role}` : ''}{profile.department ? ` · ${profile.department.name || profile.department}` : ''}</small>
              )}
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none' }}><FiX /></button>
          </div>
          <div ref={listRef} style={{ background: '#fff', padding: 12, height: 320, overflowY: 'auto' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 10, textAlign: m.from === 'bot' ? 'left' : 'right' }}>
                <div style={{ display: 'inline-block', background: m.from === 'bot' ? '#F1F3F5' : '#FFEDD5', padding: '8px 10px', borderRadius: 8, maxWidth: '85%' }}>{m.text}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, padding: 10, background: '#fff', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSend(input); }} placeholder="Ask me about the app..." style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #e6e6e6' }} />
            <button onClick={() => handleSend(input)} style={{ background: '#FFB347', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Send</button>
          </div>
          {/* Quick action buttons */}
          <div style={{ padding: 10, background: '#fff', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {profile?.role?.toLowerCase() !== 'moderator' && (
              <>
                <button onClick={() => { postBot('Opening complaint form...'); navigate('/complaint'); }} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #eee', background: '#fff' }}>Submit Complaint</button>
                <button onClick={() => { postBot('Showing your complaints...'); navigate('/track-issue'); }} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #eee', background: '#fff' }}>My Complaints</button>
              </>
            )}

            {profile?.role?.toLowerCase() === 'moderator' && (
              <>
                <button onClick={() => {
                  postBot('Showing complaints assigned to your department...');
                  const deptId = profile?.department?._id || profile?.department;
                  navigate(`/moderator-complaints?dept=${deptId}`);
                }} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #eee', background: '#fff' }}>Assigned Complaints</button>

                <button onClick={() => {
                  postBot('Showing pending photo validations...');
                  navigate('/moderator-complaints');
                }} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #eee', background: '#fff' }}>Pending Photos</button>

                <button onClick={() => {
                  postBot('Opening moderator dashboard & stats...');
                  navigate('/moderator-dashboard');
                }} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #eee', background: '#fff' }}>Dashboard & Stats</button>
              </>
            )}
          </div>
        </div>
      )}

      <button onClick={() => setOpen(o => !o)} title="Chat with help" style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 9999, background: '#FFB347', border: 'none', padding: 12, borderRadius: 999 }}>
        <FiMessageSquare size={18} />
      </button>
    </div>
  );
}
