import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { FaMicrophone, FaFastForward, FaTrash } from 'react-icons/fa';
interface PipelineResult {
  entryId: string;
  response_text: string;
  carry_in: boolean;
  updated_profile: {
    entry_count: number;
    dominant_vibe: string;
    top_themes: string[];
    trait_pool: string[];
  };
  execution_time: number;
  total_cost: number;
}

interface LogEntry {
  tag: string;
  input: string;
  output: string;
  note: string;
}

function App() {
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [fastForwardCount, setFastForwardCount] = useState(99);
  const [fastForwardLoading, setFastForwardLoading] = useState(false);
  const [disableFastForward, setDisableFastForward] = useState(false);
  const recognitionRef = useRef<any>(null);

  // 1. Clear DB on page load
  useEffect(() => {
    const clearOnLoad = async () => {
      await fetch('/api/clear/first-user', { method: 'POST' });
      setResult(null);
      setLogs([]);
    };
    clearOnLoad();
    // eslint-disable-next-line
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setLogs([]);

    try {
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript, userId: 'first-user' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(JSON.stringify(data,null,2));
      setResult(data.result);
      setLogs(data.logs || []);

      const profileResponse = await fetch('/api/profile/fastforward-user');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.entry_count >= 100) {
          setDisableFastForward(true);
        } else {
          setDisableFastForward(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExample = (exampleText: string) => {
    if (transcript.length > 0) {
      setTranscript('');
      setTimeout(() => setTranscript(exampleText), 0);
    } else {
      setTranscript(exampleText);
    }
  };

  // 2. Fast Forward disables after click
  const handleFastForward = async () => {
    setFastForwardLoading(true);
    setError(null);
    setResult(null);
    setLogs([]);
    try {
      const profileResponse = await fetch('/api/profile/first-user');
      let currentEntryCount = 0;
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        currentEntryCount = profileData.entry_count || 0;
      }
      const entriesToAdd = Math.max(0, 99 - currentEntryCount - 1);
      console.log(`entriesToAdd: ${entriesToAdd}`);
      if (entriesToAdd === 0) {
        setFastForwardLoading(false);
        return;
      }
      const response = await fetch('/api/simulate/fastForward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryCount: entriesToAdd }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setResult(data.result);
      setLogs(data.logs || []);

      const profileResponseAfter = await fetch('/api/profile/fastforward-user');
      if (profileResponseAfter.ok) {
        const profileDataAfter = await profileResponseAfter.json();
        if (profileDataAfter.entry_count >= 100) {
          setDisableFastForward(true);
        } else {
          setDisableFastForward(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setFastForwardLoading(false);
    }
  };

  const handleClearMemory = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setLogs([]);
    try {
      const response = await fetch('/api/clear/first-user', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Fetch profile again and update UI
      const profileResponse = await fetch('/api/profile/fastforward-user');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setDisableFastForward(false);
        // Optionally, you can set a state for profile if you want to display it
        // For now, just clear result and logs
        setResult(null);
        setLogs([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setTranscript('');
    }
  };

  // Speech Recognition logic
  const handleAudioClick = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      let finalTranscript = '';
      recognitionRef.current.onresult = (event: any) => {
        finalTranscript = event.results[0][0].transcript;
      };
      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };
      recognitionRef.current.onend = () => {
        setIsRecording(false);
        if (finalTranscript) setTranscript(finalTranscript);
      };
    }
    if (!isRecording) {
      setIsRecording(true);
      recognitionRef.current.start();
    } else {
      setIsRecording(false);
      recognitionRef.current.stop();
    }
  };

  return (
    <div className="app" style={{ width: "2000px", height: "full", background: 'rgb(255, 249, 242)' }}>
      <header className="header" style={{ color: "black"}}>
        <h1>🧠 Sentari Pipeline</h1>
        <p>From Transcript to Empathy - AI-Powered Diary Analysis</p>
      </header>

      <main className="main">
        <div className="input-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 0, background: 'none', boxShadow: 'none' }}>
          <div style={{ width: 672, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <div style={{ width: 146, height: 146, marginBottom: 24, position: 'relative' }}>
              <button
                type="button"
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                onClick={handleAudioClick}
                disabled={loading}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  zIndex: 10,
                  width: 146,
                  height: 146,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 48,
                  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                  boxShadow: '0 8px 32px 0 rgba(251, 146, 60, 0.3)',
                  outline: 'none',
                  border: 'none',
                  aspectRatio: '1/1',
                  padding: 0,
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 4px #fecaca, 0 8px 32px 0 rgba(251, 146, 60, 0.3)'}
                onBlur={e => e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(251, 146, 60, 0.3)'}
              >
                <FaMicrophone style={{ fontSize: 64 }} />
                {isRecording && (
                  <span style={{ position: 'absolute', top: 10, right: 10, background: '#fff3', borderRadius: '50%', width: 18, height: 18, border: '2px solid #fff', animation: 'pulse 1s infinite' }}></span>
                )}
              </button>
            </div>

            {/* Fast Forward and Delete Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
              <button
                type="button"
                onClick={handleFastForward}
                disabled={fastForwardLoading || disableFastForward}
                style={{
                  padding: '12px 24px',
                  background: fastForwardLoading 
                    ? '#9ca3af' 
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: fastForwardLoading || disableFastForward? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: fastForwardLoading 
                    ? 'none' 
                    : '0 4px 16px rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseOver={e => {
                  if (!fastForwardLoading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                  }
                }}
                onMouseOut={e => {
                  if (!fastForwardLoading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.3)';
                  }
                }}
              >
                <FaFastForward style={{ fontSize: 20 }} />
                {fastForwardLoading ? 'Loading...' : ''}
              </button>
              <button
                type="button"
                onClick={handleClearMemory}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: loading 
                    ? '#f87171' 
                    : 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: loading 
                    ? 'none' 
                    : '0 4px 16px rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseOver={e => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                  }
                }}
                onMouseOut={e => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.3)';
                  }
                }}
              >
                <FaTrash style={{ fontSize: 20 }} />
              </button>
            </div>
            
            <div style={{ width: 672, height: 107, background: 'white', borderRadius: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', padding: 24 }}>
              <textarea
                id="transcript"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Your thoughts will appear here..."
                rows={3}
                disabled={loading || isRecording}
                style={{ width: '100%', height: '100%', border: 'none', outline: 'none', fontSize: 20, resize: 'none', background: 'transparent', color: '#444' }}
              />
            </div>
          </div>
          <div className="examples" style={{ marginTop: 32 }}>
            <p>Try these examples:</p>
            <button
              type="button"
              onClick={() => handleExample("I keep checking Slack even when I'm exhausted. I know I need rest, but I'm scared I'll miss something important.")}
              className="example-btn"
            >
              Work-Life Balance Conflict
            </button>
            <button
              type="button"
              onClick={() => handleExample("I'm excited to learn machine learning and build something innovative that helps people!")}
              className="example-btn"
            >
              Positive Growth Mindset
            </button>
            <button
              type="button"
              onClick={() => handleExample("I'm feeling overwhelmed by all the intern feedback sessions, but I'm also proud of the progress they're making.")}
              className="example-btn"
            >
              Leadership Complexity
            </button>
          </div>

          

          <button
            type="submit"
            disabled={loading || !transcript.trim() || result?.updated_profile?.entry_count === 100}
            className="submit-btn"
            style={{ marginTop: 24, width: 672, background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)' }}
            form=""
            onClick={handleSubmit}
          >
            {loading ? '🔄 Processing...' : '🚀 Run Pipeline'}
          </button>
        </div>

        {error && (
          <div className="error">
            <h3>❌ Error</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="results">
            <div className="result-card">
              <h3>💬 AI Response</h3>
              <div className="response">
                "{result.response_text}"
              </div>
              <div className="response-meta">
                {result.response_text.length} characters •
                Carry-in: {result.carry_in ? '✅' : '❌'} •
                Cost: ${result.total_cost.toFixed(4)} •
                Time: {result.execution_time}ms
              </div>
            </div>

            <div className="profile-card">
              <h3>👤 Updated Profile</h3>
              <div className="profile-stats">
                <div className="stat">
                  <span className="label">Entries:</span>
                  <span className="value">{result.updated_profile.entry_count}</span>
                </div>
                <div className="stat">
                  <span className="label">Dominant Vibe:</span>
                  <span className="value">{result.updated_profile.dominant_vibe}</span>
                </div>
                <div className="stat">
                  <span className="label">Top Themes:</span>
                  <span className="value">{result.updated_profile.top_themes.join(', ')}</span>
                </div>
                <div className="stat">
                  <span className="label">Traits:</span>
                  <span className="value">{result.updated_profile.trait_pool.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {logs.length > 0 && (
          <div className="logs">
            <h3>📋 Pipeline Logs</h3>
            <div className="log-entries">
              {logs.map((log, index) => (
                <div key={index} className="log-entry">
                  <div className="log-tag">[{log.tag}]</div>
                  <div className="log-content">
                    <div className="log-io">
                      <span className="log-input">Input: {log.input}</span>
                      <span className="log-output">Output: {log.output}</span>
                    </div>
                    <div className="log-note">{log.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Built for Sentari Interview Challenge • Team Group 1</p>
      </footer>
    </div>
  );
}

export default App;