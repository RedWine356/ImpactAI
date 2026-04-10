import { useState } from 'react';
import { useNavigate } from 'react-router';

const chips = [
  { text: '🚩 Accountability — Mirpur', borderColor: '#facc15', bgColor: 'rgba(250,204,21,0.08)', hoverBg: 'rgba(250,204,21,0.15)', query: 'Run infrastructure delivery gap analysis for Mirpur', route: '/accountability' },
  { text: '🏥 Healthcare gaps', borderColor: '#00d4ff', bgColor: 'rgba(0,212,255,0.08)', hoverBg: 'rgba(0,212,255,0.15)', query: 'Find hospitals and clinics near my area', route: '/chat' },
  { text: '🌊 Flood risk', borderColor: '#3b82f6', bgColor: 'rgba(59,130,246,0.08)', hoverBg: 'rgba(59,130,246,0.15)', query: 'Assess flood risk in Mohammadpur', route: '/chat' },
  { text: '📊 Compare areas', borderColor: '#6366f1', bgColor: 'rgba(99,102,241,0.08)', hoverBg: 'rgba(99,102,241,0.15)', query: 'Compare healthcare between Mirpur and Dhanmondi', route: '/chat' },
];

interface QueryChipsProps {
  dimmed?: boolean;
}

export function QueryChips({ dimmed = false }: QueryChipsProps) {
  const [hoveredChip, setHoveredChip] = useState<number | null>(null);
  const navigate = useNavigate();

  return (
    <div className="shrink-0 flex gap-2 px-4 py-3 overflow-x-auto">
      {chips.map((chip, i) => (
        <button
          key={chip.text}
          onClick={() => navigate(chip.route, { state: { query: chip.query } })}
          onMouseEnter={() => setHoveredChip(i)}
          onMouseLeave={() => setHoveredChip(null)}
          className="shrink-0 h-8 px-3.5 rounded-full text-[12px] cursor-pointer transition-all duration-200"
          style={{
            border: `1px solid ${chip.borderColor}`,
            background: hoveredChip === i ? chip.hoverBg : chip.bgColor,
            color: '#94a3b8',
            opacity: dimmed ? 0.6 : 1,
            transform: hoveredChip === i ? 'scale(1.02)' : 'scale(1)',
          }}
        >
          {chip.text}
        </button>
      ))}
    </div>
  );
}
