import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Brain, Settings, ArrowUp } from 'lucide-react';
import { ToolBadge, ResultLine } from './ToolBadge';

const chips = [
  { text: '🚩 Accountability — Mirpur', query: 'Run infrastructure delivery gap analysis for Mirpur', route: '/accountability' },
  { text: '🏥 Healthcare gaps', query: 'Find hospitals and clinics near my area', route: '/chat' },
  { text: '🌊 Flood risk', query: 'Assess flood risk in Mohammadpur', route: '/chat' },
  { text: '📊 Compare areas', query: 'Compare healthcare between Mirpur and Dhanmondi', route: '/chat' },
];

export function AccountabilityChatPanel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredChip, setHoveredChip] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    setInput('');
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
            style={{ background: 'rgba(255,255,255,0.12)', color: '#B0B0B0', fontWeight: 500 }}
          >
            v2
          </span>
        </div>
        <button
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: '#666666' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#666666'; }}
        >
          <Settings size={20} />
        </button>
      </div>

      {/* ── Query Chips ── */}
      <div className="shrink-0 flex gap-2 px-4 py-3 overflow-x-auto">
        {chips.map((chip, i) => (
          <button
            key={chip.text}
            onClick={() => navigate(chip.route, { state: { query: chip.query } })}
            onMouseEnter={() => setHoveredChip(i)}
            onMouseLeave={() => setHoveredChip(null)}
            className="shrink-0 h-8 px-3.5 rounded-full text-[12px] cursor-pointer transition-all duration-200"
            style={{
              border: '1px solid rgba(255,255,255,0.15)',
              background: hoveredChip === i ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: '#B0B0B0',
              opacity: 0.6,
              transform: hoveredChip === i ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            {chip.text}
          </button>
        ))}
      </div>

      {/* ── Chat Thread ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
        {/* Message 1 — User */}
        <div className="flex justify-end">
          <div>
            <div
              className="px-3.5 py-2.5 text-[14px]"
              style={{
                background: '#FFFFFF',
                color: '#000000',
                borderRadius: '16px 4px 16px 16px',
              }}
            >
              Check public infrastructure delivery for drainage projects in Mirpur
            </div>
            <div className="text-[11px] text-right mt-1" style={{ color: '#666666' }}>
              12:41 PM
            </div>
          </div>
        </div>

        {/* Message 2 — AI Accountability Response */}
        <div className="flex justify-start">
          <div
            className="max-w-[85%] p-3.5 space-y-1.5"
            style={{
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '4px 16px 16px 16px',
            }}
          >
            {/* Reasoning */}
            <p className="text-[13px] italic" style={{ color: '#B0B0B0' }}>
              🔍 Let me cross-reference public spending with ground truth...
            </p>

            {/* Tool 1: geocode */}
            <ToolBadge name='geocode("Mirpur")' status="done" variant="space-black" />
            <ResultLine text="Mirpur: 23.807°N, 90.368°E" color="#B0B0B0" />

            {/* Tool 2: check_infrastructure_delivery */}
            <ToolBadge name="check_infrastructure_delivery()" status="done" variant="space-black" />
            <ResultLine text="Found 2 DNCC projects · BDT 6.2 Crore · 2021-2023" color="#B0B0B0" />
            <ResultLine text="OSM evidence: 8 drain segments" color="#B0B0B0" />
            <ResultLine text="Expected: ~22 segments from budget" color="#B0B0B0" />
            <ResultLine text="Delivery gap: 64% — 🚩 Very High" color="#ef4444" bold />

            {/* Tool 3: render_on_map */}
            <ToolBadge name="render_on_map(3 flags)" status="done" variant="space-black" />

            {/* Divider */}
            <div className="my-2" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

            {/* Final response */}
            <div className="text-[14px] leading-[1.7] space-y-2" style={{ color: '#FFFFFF' }}>
              <p>
                Drainage infrastructure in Mirpur shows a <strong>significant delivery gap</strong>.
              </p>
              <p style={{ color: '#B0B0B0' }}>
                Public records show <strong style={{ color: '#FFFFFF' }}>2 DNCC drainage projects</strong> worth{' '}
                <strong style={{ color: '#FFFFFF' }}>BDT 6.2 Crore</strong> approved for this area (2021-2023).
                Based on CPTU standard unit costs, that budget should yield approximately{' '}
                <strong style={{ color: '#FFFFFF' }}>22 drain segments</strong>.
              </p>
              <p style={{ color: '#B0B0B0' }}>
                OSM currently maps only <strong style={{ color: '#FFFFFF' }}>8 drain segments</strong> within 2km.
              </p>
            </div>

            {/* Gap Score Card */}
            <div
              className="rounded-lg p-3 mt-2 space-y-2"
              style={{
                background: 'rgba(239,68,68,0.06)',
                borderLeft: '4px solid #ef4444',
              }}
            >
              <div className="text-[12px]" style={{ color: '#B0B0B0' }}>
                Infrastructure Delivery Gap
              </div>
              <div className="text-[18px]" style={{ color: '#ef4444', fontWeight: 700 }}>
                🚩 VERY HIGH — 64%
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#111111', maxWidth: 300 }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: '64%',
                    background: 'linear-gradient(90deg, #fb923c, #ef4444)',
                  }}
                />
              </div>
              <div className="text-[12px]" style={{ color: '#B0B0B0' }}>
                Expected: 22 &nbsp;|&nbsp; Found: 8 &nbsp;|&nbsp; Gap: 14 segments
              </div>
            </div>

            {/* Sources */}
            <div className="mt-2 space-y-1">
              <div className="text-[12px]" style={{ color: '#B0B0B0' }}>📄 Sources:</div>
              <div className="flex flex-wrap gap-2">
                <a
                  href="#"
                  className="text-[12px] hover:underline"
                  style={{ color: '#FFFFFF' }}
                  onClick={(e) => e.preventDefault()}
                >
                  [IMED Project #DNCC-2021-0089]
                </a>
                <a
                  href="#"
                  className="text-[12px] hover:underline"
                  style={{ color: '#FFFFFF' }}
                  onClick={(e) => e.preventDefault()}
                >
                  [DNCC-2022-0134]
                </a>
              </div>
            </div>

            {/* Disclaimer — amber tinted */}
            <div
              className="rounded-md p-2.5 mt-2"
              style={{
                background: 'rgba(250,204,21,0.08)',
                border: '1px solid rgba(250,204,21,0.25)',
              }}
            >
              <p className="text-[12px] leading-[1.6]" style={{ color: 'rgba(250,204,21,0.8)' }}>
                ⚠️ This is a statistical anomaly flag based on public data only. It does not constitute
                evidence of wrongdoing. Gaps may reflect OSM incompleteness, project delays, or scope changes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Input Bar ── */}
      <div
        className="shrink-0 px-3 pb-3 pt-2"
        style={{
          background: '#0a0a0a',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about any area in Dhaka..."
            className="flex-1 h-[44px] rounded-full px-4 text-[14px] outline-none placeholder:text-[#666666]"
            style={{
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.1)',
              fontFamily: "'Inter', sans-serif",
              color: '#FFFFFF',
            }}
          />
          <button
            onClick={handleSend}
            className="w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0 transition-all duration-200 hover:scale-105 cursor-pointer"
            style={{ background: '#FFFFFF' }}
          >
            <ArrowUp size={20} style={{ color: '#000000' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
