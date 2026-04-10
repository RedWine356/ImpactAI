import { useRef, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Brain, Settings, ArrowUp, Wifi, WifiOff, Zap } from 'lucide-react';
import { ToolBadge, ResultLine } from './ToolBadge';
import { useNagorMind, type ChatEntry } from '../NagorMindContext';

const chips = [
  { text: '🚩 Accountability — Mirpur', query: 'Run infrastructure delivery gap analysis for drainage in Mirpur', route: '/accountability' },
  { text: '🏥 Healthcare gaps', query: 'Find hospitals and clinics near Mirpur 10', route: '/chat' },
  { text: '🌊 Flood risk', query: 'Assess flood risk in Mohammadpur', route: '/chat' },
  { text: '📊 Compare areas', query: 'Compare healthcare between Mirpur and Dhanmondi', route: '/chat' },
];

function UserMessage({ entry }: { entry: ChatEntry }) {
  const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="flex justify-end">
      <div>
        <div
          className="px-3.5 py-2.5 text-[14px]"
          style={{ background: '#FFFFFF', color: '#000000', borderRadius: '16px 4px 16px 16px' }}
        >
          {entry.text}
        </div>
        <div className="text-[11px] text-right mt-1" style={{ color: '#666666' }}>{time}</div>
      </div>
    </div>
  );
}

function AssistantMessage({ entry }: { entry: ChatEntry }) {
  return (
    <div className="flex justify-start">
      <div
        className="max-w-[85%] p-3.5 space-y-1.5"
        style={{
          background: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '4px 16px 16px 16px',
        }}
      >
        {/* Error state */}
        {entry.error && (
          <div className="text-[13px]" style={{ color: '#fb923c' }}>
            ⚠️ {entry.error}
          </div>
        )}

        {/* LangChain Agent reasoning */}
        {entry.reasoning && (
          <div className="flex items-start gap-2">
            <span
              className="shrink-0 mt-0.5 inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[9px]"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: '#00d4ff', fontWeight: 600 }}
            >
              <Zap size={9} /> CHAIN
            </span>
            <p className="text-[13px] italic" style={{ color: '#B0B0B0' }}>
              {entry.reasoning}
            </p>
          </div>
        )}

        {/* Tool calls + results interleaved */}
        {(entry.toolCalls || []).map((tc, i) => {
          const result = (entry.toolResults || [])[i];
          const argsStr = Object.entries(tc.args || {})
            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
            .join(', ');
          const name = argsStr ? `${tc.tool}(${argsStr})` : `${tc.tool}()`;
          const status = result ? 'done' : 'loading';

          let resultText = '';
          let resultColor = '#B0B0B0';

          if (result?.result) {
            const r = result.result as Record<string, unknown>;
            if (r.error) {
              resultText = `Error: ${r.error}`;
              resultColor = '#fb923c';
            } else if (r.lat && r.lon) {
              resultText = `${r.display_name || 'Location'}: ${r.lat}°N, ${r.lon}°E`;
              resultColor = '#4ade80';
            } else if (typeof r.total_count === 'number') {
              const byType = r.by_type as Record<string, number> | undefined;
              const breakdown = byType ? ' · ' + Object.entries(byType).map(([k, v]) => `${v} ${k}`).join(', ') : '';
              resultText = `Found ${r.total_count} features${breakdown}`;
              resultColor = '#4ade80';
            } else if (typeof r.aqi === 'number') {
              resultText = `AQI: ${r.aqi} (${r.aqi_label})`;
              resultColor = r.aqi > 150 ? '#ef4444' : r.aqi > 100 ? '#fb923c' : '#4ade80';
            } else if (typeof r.flood_risk_score === 'number') {
              resultText = `Flood risk: ${r.flood_risk_score}/100 (${r.risk_label})`;
              resultColor = '#facc15';
            } else if (typeof r.delivery_gap_percent === 'number') {
              const label = (r.gap_label as { icon?: string; level?: string } | undefined);
              resultText = `Delivery gap: ${r.delivery_gap_percent}% — ${label?.icon || ''} ${label?.level || ''}`;
              resultColor = r.delivery_gap_percent > 60 ? '#ef4444' : r.delivery_gap_percent > 40 ? '#fb923c' : '#4ade80';
            } else if (typeof r.coverage_percent === 'number') {
              resultText = `Coverage: ${r.coverage_percent}% of area`;
              resultColor = '#4ade80';
            } else if (r.rendered !== undefined) {
              resultText = `${r.message || 'Rendered on map'}`;
              resultColor = '#4ade80';
            } else if (r.layer_id) {
              resultText = 'Layer added to map';
              resultColor = '#4ade80';
            } else {
              resultText = 'Done';
              resultColor = '#4ade80';
            }
          }

          return (
            <div key={i}>
              <ToolBadge name={name} status={status} variant="space-black" />
              {resultText && <ResultLine text={resultText} color={resultColor} />}
            </div>
          );
        })}

        {/* Streaming pulse */}
        {entry.isStreaming && !entry.text && (
          <div className="flex items-center gap-1 mt-1">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: '#555', animation: `pulse 1.4s ease-in-out ${delay}ms infinite` }}
              />
            ))}
          </div>
        )}

        {/* Response text */}
        {entry.text && (
          <>
            {(entry.toolCalls?.length ?? 0) > 0 && (
              <div className="my-2" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
            )}
            <div
              className="text-[14px] leading-[1.7] whitespace-pre-wrap"
              style={{ color: '#FFFFFF' }}
            >
              {entry.text}
            </div>
          </>
        )}

        {/* LangChain metadata footer */}
        {!entry.isStreaming && entry.metadata?.framework === 'langchain' && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span
              className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[9px]"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff', fontWeight: 600 }}
            >
              <Zap size={8} /> LangChain
            </span>
            {entry.metadata.model && (
              <span className="text-[9px]" style={{ color: '#555' }}>
                {entry.metadata.model}
              </span>
            )}
            {entry.metadata.tools_used && entry.metadata.tools_used.length > 0 && (
              <span className="text-[9px]" style={{ color: '#555' }}>
                · {entry.metadata.tools_used.length} tools
              </span>
            )}
            {entry.metadata.total_duration_ms && (
              <span className="text-[9px]" style={{ color: '#555' }}>
                · {(entry.metadata.total_duration_ms / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ActiveChatPanel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredChip, setHoveredChip] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { connected, messages, isThinking, sendQuery } = useNagorMind();

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Auto-send if navigated with a query in state
  useEffect(() => {
    const state = location.state as { query?: string } | null;
    if (state?.query && messages.length === 0) {
      sendQuery(state.query);
      // Clear state so it doesn't re-fire on re-render
      navigate('/chat', { replace: true, state: {} });
    }
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isThinking) return;
    setInput('');
    sendQuery(text);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0a0a', fontFamily: "'Inter', sans-serif" }}>
      {/* ── Top Bar ── */}
      <div
        className="shrink-0 flex items-center justify-between px-5 h-16"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <Brain size={18} style={{ color: '#FFFFFF' }} />
          </div>
          <span className="text-[18px] text-white tracking-[-0.02em]" style={{ fontWeight: 700 }}>
            NagorMind
          </span>
          <span
            className="px-[7px] py-[2px] rounded-full text-[10px]"
            style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff', fontWeight: 600 }}
          >
            v2.1 · LangChain
          </span>
        </div>
        <div className="flex items-center gap-2">
          {connected
            ? <Wifi size={14} color="#4ade80" />
            : <WifiOff size={14} color="#666" />
          }
          <button
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#666666' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#666666'; }}
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* ── Query Chips ── */}
      <div className="shrink-0 flex gap-2 px-4 py-3 overflow-x-auto">
        {chips.map((chip, i) => (
          <button
            key={chip.text}
            onClick={() => {
              if (chip.route === '/accountability') {
                navigate(chip.route, { state: { query: chip.query } });
              } else {
                sendQuery(chip.query);
              }
            }}
            onMouseEnter={() => setHoveredChip(i)}
            onMouseLeave={() => setHoveredChip(null)}
            className="shrink-0 h-8 px-3.5 rounded-full text-[12px] cursor-pointer transition-all duration-200"
            style={{
              border: '1px solid rgba(255,255,255,0.15)',
              background: hoveredChip === i ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: '#B0B0B0',
              transform: hoveredChip === i ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            {chip.text}
          </button>
        ))}
      </div>

      {/* ── Chat Thread ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[13px] text-center" style={{ color: '#444' }}>
              {connected
                ? 'Ask anything about Dhaka\'s infrastructure, health, environment, or public spending.'
                : 'Connecting to NagorMind server...'}
            </p>
          </div>
        )}
        {messages.map((entry, i) =>
          entry.role === 'user'
            ? <UserMessage key={i} entry={entry} />
            : <AssistantMessage key={i} entry={entry} />
        )}
      </div>

      {/* ── Input Bar ── */}
      <div
        className="shrink-0 px-3 pb-3 pt-2"
        style={{ background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-2.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={connected ? 'Ask about any area in Dhaka...' : 'Connecting...'}
            disabled={!connected}
            className="flex-1 h-[44px] rounded-full px-4 text-[14px] outline-none placeholder:text-[#666666] disabled:opacity-40"
            style={{
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.1)',
              fontFamily: "'Inter', sans-serif",
              color: '#FFFFFF',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!connected || isThinking || !input.trim()}
            className="w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0 transition-all duration-200 hover:scale-105 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#FFFFFF' }}
          >
            <ArrowUp size={20} style={{ color: '#000000' }} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
