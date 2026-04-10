import { useRef, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Brain, Settings, ArrowUp, Wifi, WifiOff } from 'lucide-react';
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

function AccountabilityResult({ result }: { result: Record<string, unknown> }) {
  const gapLabel = result.gap_label as { level?: string; icon?: string; color?: string } | undefined;
  const gap = result.delivery_gap_percent as number | undefined;
  const expected = result.expected_count_from_budget as number | undefined;
  const found = result.osm_evidence_count as number | undefined;
  const budget = result.total_announced_budget_bdt as number | undefined;
  const projectsFound = result.public_projects_found as number | undefined;
  const sourceUrls = result.source_urls as string[] | undefined;
  const disclaimer = result.disclaimer as string | undefined;

  if (gap === undefined) return null;

  const barColor = gapLabel?.color || '#ef4444';
  const levelIcon = gapLabel?.icon || '🚩';
  const levelText = gapLabel?.level || 'High';

  return (
    <div className="space-y-2 mt-1">
      {/* Gap score card */}
      <div
        className="rounded-lg p-3 space-y-2"
        style={{ background: `${barColor}0f`, borderLeft: `4px solid ${barColor}` }}
      >
        <div className="text-[12px]" style={{ color: '#B0B0B0' }}>
          Infrastructure Delivery Gap
        </div>
        <div className="text-[18px]" style={{ color: barColor, fontWeight: 700 }}>
          {levelIcon} {levelText.toUpperCase()} — {gap}%
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#111', maxWidth: 300 }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, gap)}%`, background: `linear-gradient(90deg, ${barColor}aa, ${barColor})` }}
          />
        </div>
        <div className="text-[12px]" style={{ color: '#B0B0B0' }}>
          Expected: {expected ?? '?'} &nbsp;|&nbsp; Found: {found ?? '?'} &nbsp;|&nbsp;
          Budget: BDT {budget ? (budget / 10_000_000).toFixed(1) + ' Cr' : '?'}
          {projectsFound !== undefined && ` (${projectsFound} projects)`}
        </div>
      </div>

      {/* Sources */}
      {sourceUrls && sourceUrls.length > 0 && (
        <div className="space-y-1">
          <div className="text-[12px]" style={{ color: '#B0B0B0' }}>📄 Sources:</div>
          <div className="flex flex-wrap gap-2">
            {sourceUrls.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] hover:underline"
                style={{ color: '#FFFFFF' }}
              >
                [{url.includes('imed') ? 'IMED' : 'e-GP'} Source {i + 1} ↗]
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      {disclaimer && (
        <div
          className="rounded-md p-2.5"
          style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.25)' }}
        >
          <p className="text-[12px] leading-[1.6]" style={{ color: 'rgba(250,204,21,0.8)' }}>
            {disclaimer}
          </p>
        </div>
      )}
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
        {entry.error && (
          <div className="text-[13px]" style={{ color: '#fb923c' }}>⚠️ {entry.error}</div>
        )}

        {entry.reasoning && (
          <p className="text-[13px] italic" style={{ color: '#B0B0B0' }}>🔍 {entry.reasoning}</p>
        )}

        {(entry.toolCalls || []).map((tc, i) => {
          const result = (entry.toolResults || [])[i];
          const argsStr = Object.entries(tc.args || {})
            .filter(([k]) => ['lat', 'lon', 'radius_m', 'project_type', 'types'].includes(k))
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
              resultColor = '#B0B0B0';
            } else if (typeof r.delivery_gap_percent === 'number') {
              const label = r.gap_label as { icon?: string; level?: string } | undefined;
              const projects = r.public_projects_found as number | undefined;
              const budget = r.total_announced_budget_bdt as number | undefined;
              resultText = `Found ${projects ?? 0} projects · BDT ${budget ? (budget / 10_000_000).toFixed(1) + ' Cr' : '?'}`;
              const resultText2 = `OSM evidence: ${r.osm_evidence_count} · Expected: ~${r.expected_count_from_budget}`;
              const resultText3 = `Delivery gap: ${r.delivery_gap_percent}% — ${label?.icon || ''} ${label?.level || ''}`;
              const gapColor = (r.delivery_gap_percent as number) > 60 ? '#ef4444'
                : (r.delivery_gap_percent as number) > 40 ? '#fb923c' : '#4ade80';
              return (
                <div key={i}>
                  <ToolBadge name={name} status={status} variant="space-black" />
                  <ResultLine text={resultText} color="#B0B0B0" />
                  <ResultLine text={resultText2} color="#B0B0B0" />
                  <ResultLine text={resultText3} color={gapColor} bold />
                  <AccountabilityResult result={r} />
                </div>
              );
            } else if (typeof r.total_count === 'number') {
              resultText = `Found ${r.total_count} features`;
              resultColor = '#4ade80';
            } else if (r.rendered !== undefined || r.layer_id) {
              resultText = (r.message as string) || 'Rendered on map';
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

        {entry.text && (
          <>
            {(entry.toolCalls?.length ?? 0) > 0 && (
              <div className="my-2" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
            )}
            <div className="text-[14px] leading-[1.7] whitespace-pre-wrap" style={{ color: '#FFFFFF' }}>
              {entry.text}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function AccountabilityChatPanel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredChip, setHoveredChip] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { connected, messages, isThinking, sendQuery } = useNagorMind();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const state = location.state as { query?: string } | null;
    if (state?.query && messages.length === 0) {
      sendQuery(state.query);
      navigate('/accountability', { replace: true, state: {} });
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
            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 500 }}
          >
            accountability
          </span>
        </div>
        <div className="flex items-center gap-2">
          {connected ? <Wifi size={14} color="#4ade80" /> : <WifiOff size={14} color="#666" />}
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
              if (chip.route === '/chat') {
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
                ? 'Ask about infrastructure delivery gaps, public spending, or accountability.'
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
            placeholder={connected ? 'Ask about infrastructure delivery in Dhaka...' : 'Connecting...'}
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
