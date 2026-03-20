import React from 'react';

const BORDER_COLORS = ['#f87171', '#4ade80', '#60a5fa', '#f5c518', '#a78bfa'];

export default function FounderInsights({ data, context }) {
  const [insights, setInsights] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const prompt = `You are a sharp business analyst advising founders of a cloud kitchen brand called Rethink Foods (brand: TOP - Taste of Protein) in Bangalore, India. They are preparing for a Seed/Series A raise.

Context: ${context}

Data: ${JSON.stringify(data, null, 2)}

Generate exactly 3 founder/investor insights based on this data. Each insight should:
- Have a short ALL-CAPS title (3-5 words, like "DISCOUNT BURN RATE" or "COMMISSION PRESSURE RISING")
- Have 2-3 sentences of sharp, specific analysis using the actual numbers
- Be investor-relevant — what does this metric tell a Seed/Series A investor?

Respond ONLY with valid JSON array, no markdown, no explanation:
[
  {"title": "...", "body": "..."},
  {"title": "...", "body": "..."},
  {"title": "...", "body": "..."}
]`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const result = await response.json();
      const text = result.content?.[0]?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setInsights(parsed);
    } catch (e) {
      setError('Could not generate insights. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🧠</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
              Founder / Investor Intelligence
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, marginLeft: 28 }}>
            What this data tells an investor about your unit economics
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          style={{
            background: loading ? 'var(--bg-input)' : 'var(--accent-purple)',
            border: 'none', borderRadius: 8, padding: '9px 20px',
            color: '#fff', fontFamily: 'var(--font-display)', fontSize: 13,
            fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          {loading ? (
            <>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⚡</span>
              Generating…
            </>
          ) : insights ? '↺ Regenerate' : '⚡ Generate Insights'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--accent-red)', fontSize: 13, padding: '10px 0' }}>{error}</div>
      )}

      {!insights && !loading && (
        <div style={{
          background: 'var(--bg-card)', border: '1px dashed var(--border-light)',
          borderRadius: 10, padding: '24px', textAlign: 'center',
          color: 'var(--text-muted)', fontSize: 13,
        }}>
          Click "Generate Insights" to get AI-powered founder and investor analysis of this data
        </div>
      )}

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '18px 20px', borderLeft: `3px solid ${BORDER_COLORS[i]}`,
              minHeight: 120,
              background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--bg-card-hover) 50%, var(--bg-card) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }} />
          ))}
        </div>
      )}

      {insights && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {insights.map((ins, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '18px 20px',
              borderLeft: `3px solid ${BORDER_COLORS[i % BORDER_COLORS.length]}`,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '1.2px',
                color: BORDER_COLORS[i % BORDER_COLORS.length],
                textTransform: 'uppercase', marginBottom: 10,
              }}>
                {ins.title}
              </div>
              <div style={{
                fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65,
                fontFamily: 'var(--font-display)',
              }}>
                {ins.body}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
    </div>
  );
}
