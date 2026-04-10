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

export function ActiveChatPanel() {
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
              Find hospitals near Mirpur 10
            </div>
            <div className="text-[11px] text-right mt-1" style={{ color: '#666666' }}>
              12:34 PM
            </div>
          </div>
        </div>

        {/* Message 2 — AI Reasoning Chain */}
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
              🔍 Let me find hospitals near Mirpur 10...
            </p>

            {/* Tool 1 */}
            <ToolBadge name='geocode("Mirpur 10")' status="done" variant="space-black" />
            <ResultLine text="Mirpur 10: 23.8069°N, 90.3687°E" color="#4ade80" />

            {/* Tool 2 */}
            <ToolBadge name="query_osm_amenities(hospital, clinic)" status="done" variant="space-black" />
            <ResultLine text="Found: 5 hospitals, 9 clinics within 2km" color="#4ade80" />

            {/* Tool 3 */}
            <ToolBadge name="render_on_map(14 markers)" status="done" variant="space-black" />
            <ResultLine text="Rendered 14 healthcare facilities on map" color="#4ade80" />

            {/* Divider */}
            <div className="my-2" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

            {/* Final response */}
            <div className="text-[14px] leading-[1.7] space-y-2" style={{ color: '#FFFFFF' }}>
              <p>
                I found <strong style={{ color: '#FFFFFF' }}>14 healthcare facilities</strong> within 2km of Mirpur 10:
              </p>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>
                  <strong>5 hospitals</strong> including Mirpur General Hospital
                </li>
                <li>
                  <strong>9 clinics</strong> including 3 government community clinics
                </li>
              </ul>
              <p>
                The nearest hospital is <strong>Mirpur General</strong> (
                <span style={{ color: '#B0B0B0' }}>450m</span> from center).
              </p>
              <p style={{ color: '#B0B0B0' }}>
                Coverage is <strong style={{ color: '#FFFFFF' }}>moderate</strong> — the WHO recommends 1 primary care
                facility per 10,000 population. With an estimated 90,000 people in this area,
                the 14 facilities meet the standard, but distribution is uneven (see gap zones
                on map).
              </p>
            </div>
          </div>
        </div>

        {/* Message 3 — User */}
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
              What about air quality here?
            </div>
            <div className="text-[11px] text-right mt-1" style={{ color: '#666666' }}>
              12:36 PM
            </div>
          </div>
        </div>

        {/* Message 4 — AI Loading */}
        <div className="flex justify-start">
          <div
            className="max-w-[85%] p-3.5 space-y-2"
            style={{
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '4px 16px 16px 16px',
            }}
          >
            {/* Pulsing dots */}
            <div className="flex items-center gap-1">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: '#FFFFFF',
                    animation: `pulse 1.4s ease-in-out ${delay}ms infinite`,
                  }}
                />
              ))}
            </div>

            <p className="text-[13px] italic" style={{ color: '#B0B0B0' }}>
              🔍 Checking air quality sensors near Mirpur 10...
            </p>

            <ToolBadge name="get_air_quality()" status="loading" variant="space-black" />

            {/* Shimmer bar */}
            <div
              className="h-3 w-48 rounded-full overflow-hidden ml-7"
              style={{ background: '#111111' }}
            >
              <div
                className="h-full w-1/2 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #111111, #222222, #111111)',
                  animation: 'shimmer 1.5s infinite',
                }}
              />
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

      {/* Keyframe animations */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
