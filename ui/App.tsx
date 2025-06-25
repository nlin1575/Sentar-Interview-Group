import React, { useState } from 'react';
import './App.css';

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
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.result);
      setLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExample = (exampleText: string) => {
    setTranscript(exampleText);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🧠 Sentari Pipeline</h1>
        <p>From Transcript to Empathy - AI-Powered Diary Analysis</p>
      </header>

      <main className="main">
        <div className="input-section">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="transcript">
                📝 Enter your diary transcript:
              </label>
              <textarea
                id="transcript"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder=""
                rows={4}
                disabled={loading}
              />
            </div>

            <div className="examples">
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
              disabled={loading || !transcript.trim()}
              className="submit-btn"
            >
              {loading ? '🔄 Processing...' : '🚀 Run Pipeline'}
            </button>
          </form>
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