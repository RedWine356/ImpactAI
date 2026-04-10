import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Brain, Settings, ArrowUp } from 'lucide-react';

const actionCards = [
  { icon: '🏥', title: 'Healthcare Access', desc: 'Find hospitals, clinics & coverage gaps', query: 'Show healthcare facilities near Mirpur 10', route: '/chat' },
  { icon: '🌊', title: 'Flood Risk Analysis', desc: 'Assess drainage & vulnerability', query: 'Assess flood risk in Mohammadpur', route: '/chat' },
  { icon: '📊', title: 'Compare Areas', desc: 'Side-by-side area analysis', query: 'Compare Mirpur and Dhanmondi', route: '/chat' },
  { icon: '🚩', title: 'Infrastructure Accountability', desc: 'Cross-reference spending vs. reality', query: 'Check delivery gaps in Mirpur', route: '/accountability' },
];

const chips = [
  { text: '🚩 Accountability — Mirpur', query: 'Run infrastructure delivery gap analysis for Mirpur', route: '/accountability' },
  { text: '🏥 Healthcare gaps', query: 'Find hospitals and clinics near my area', route: '/chat' },
  { text: '🌊 Flood risk', query: 'Assess flood risk in Mohammadpur', route: '/chat' },
  { text: '📊 Compare areas', query: 'Compare healthcare between Mirpur and Dhanmondi', route: '/chat' },
];

export function WelcomePanel() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [hoveredChip, setHoveredChip] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const navigate = useNavigate();

  const handleSend = () => {
    if (!input.trim()) return;
    navigate('/chat', { state: { query: input.trim() } });
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
        <button className="p-1.5 rounded-lg transition-colors" style={{ color: '#666666' }}
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
              transform: hoveredChip === i ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            {chip.text}
          </button>
        ))}
      </div>

      {/* ── Center Content ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.015) 0%, transparent 60%)',
        }} />

        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{
            background: 'rgba(255,255,255,0.06)',
            boxShadow: '0 0 40px rgba(255,255,255,0.04)',
          }}>
            <Brain size={36} style={{ color: '#FFFFFF' }} />
          </div>
        </div>

        <h1 className="text-white text-[24px] tracking-[-0.02em]" style={{ fontWeight: 700 }}>
          Welcome to NagorMind
        </h1>
        <p className="text-[14px] mt-1" style={{ color: '#B0B0B0' }}>
          AI-powered urban planning advisor for Dhaka
        </p>

        <div className="grid grid-cols-2 gap-3 mt-6" style={{ width: 412 }}>
          {actionCards.map((card, i) => (
            <button
              key={card.title}
              onClick={() => navigate(card.route, { state: { query: card.query } })}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              className="flex flex-col text-left rounded-xl cursor-pointer transition-all duration-200 overflow-hidden"
              style={{
                width: 200,
                height: 110,
                padding: 12,
                background: '#0a0a0a',
                border: `1px solid ${hoveredCard === i ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: hoveredCard === i ? '0 0 20px rgba(255,255,255,0.03)' : 'none',
                transform: hoveredCard === i ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <span className="text-[22px] leading-none shrink-0">{card.icon}</span>
              <div className="text-white text-[13px] mt-1.5 truncate w-full" style={{ fontWeight: 700 }}>{card.title}</div>
              <div className="text-[11px] mt-0.5 line-clamp-2 w-full" style={{ color: '#666666' }}>{card.desc}</div>
            </button>
          ))}
        </div>

        <p className="text-[12px] mt-6" style={{ color: '#666666' }}>
          Powered by Gemini 2.5 Flash · 13 specialized urban analysis tools
        </p>
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
