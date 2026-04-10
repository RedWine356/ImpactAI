import { useState } from 'react';
import { useNavigate } from 'react-router';

export interface FlagData {
  name: string;
  budget: string;
  budgetYear: string;
  agency: string;
  expected: string;
  found: string;
  gap: number;
  thana?: string;
  sourceUrl?: string;
}

function getGapInfo(pct: number) {
  if (pct >= 60) return { label: 'Very High', color: '#ef4444', icon: '🚩' };
  if (pct >= 40) return { label: 'High', color: '#fb923c', icon: '🔴' };
  if (pct >= 20) return { label: 'Moderate', color: '#facc15', icon: '⚠️' };
  return { label: 'Low', color: '#4ade80', icon: '✅' };
}

interface FlagPopupProps {
  data: FlagData;
  onClose: () => void;
}

export function FlagPopup({ data, onClose }: FlagPopupProps) {
  const gap = getGapInfo(data.gap);
  const navigate = useNavigate();
  const [hoverSource, setHoverSource] = useState(false);
  const [hoverAsk, setHoverAsk] = useState(false);

  const handleViewSource = () => {
    window.open(data.sourceUrl || '#', '_blank');
  };

  const handleAskAI = () => {
    onClose();
    navigate('/chat', {
      state: {
        query: `Tell me more about the ${data.name} project in ${data.thana || 'Mirpur'}. What could explain the delivery gap?`,
      },
    });
  };

  return (
    <div className="relative" style={{ width: 340, fontFamily: "'Inter', sans-serif" }}>
      <div
        className="relative rounded-xl"
        style={{
          width: 340,
          padding: 16,
          background: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-5 h-5 flex items-center justify-center rounded-full transition-colors cursor-pointer"
          style={{ color: '#666666', fontSize: 20, lineHeight: 1 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#666666'; }}
        >
          ✕
        </button>

        {/* ROW 1: Header */}
        <div className="flex items-center gap-2 pr-6">
          <span style={{ fontSize: 20 }}>🚩</span>
          <span className="text-[16px] text-white" style={{ fontWeight: 700 }}>
            {data.name}
          </span>
        </div>

        {/* ROW 2: Info Grid */}
        <div className="grid grid-cols-2 gap-x-4" style={{ marginTop: 12 }}>
          <div>
            <div className="text-[11px]" style={{ color: '#666666' }}>Budget</div>
            <div className="text-[14px] text-white" style={{ fontWeight: 700 }}>{data.budget}</div>
            <div className="text-[11px]" style={{ color: '#B0B0B0' }}>({data.budgetYear})</div>
          </div>
          <div>
            <div className="text-[11px]" style={{ color: '#666666' }}>Agency</div>
            <div className="text-[14px] text-white" style={{ fontWeight: 700 }}>{data.agency}</div>
          </div>
        </div>

        {/* ROW 3: Evidence Grid */}
        <div className="grid grid-cols-2 gap-x-4" style={{ marginTop: 12 }}>
          <div>
            <div className="text-[11px]" style={{ color: '#666666' }}>Expected</div>
            <div className="text-[14px] text-white">{data.expected}</div>
          </div>
          <div>
            <div className="text-[11px]" style={{ color: '#666666' }}>OSM Found</div>
            <div
              className="text-[14px]"
              style={{
                color: data.gap >= 40 ? '#ef4444' : '#4ade80',
                fontWeight: data.gap >= 40 ? 700 : 400,
              }}
            >
              {data.found}
            </div>
          </div>
        </div>

        {/* ROW 4: Gap Score Bar */}
        <div style={{ marginTop: 14 }}>
          <div className="text-[11px]" style={{ color: '#666666' }}>
            Delivery Gap Score
          </div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 10, background: '#111111', border: '1px solid rgba(255,255,255,0.06)', marginTop: 6 }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${data.gap}%`,
                background: 'linear-gradient(90deg, #fb923c, #ef4444)',
              }}
            />
          </div>
          <div className="flex items-center justify-between" style={{ marginTop: 6 }}>
            <span className="text-[10px]" style={{ color: '#666666' }}>0%</span>
            <span className="text-[14px]" style={{ color: gap.color, fontWeight: 700 }}>
              {data.gap}% — {gap.label} {gap.icon}
            </span>
          </div>
        </div>

        {/* ROW 5: Action Buttons */}
        <div className="flex gap-2" style={{ marginTop: 14 }}>
          <button
            onClick={handleViewSource}
            onMouseEnter={() => setHoverSource(true)}
            onMouseLeave={() => setHoverSource(false)}
            className="flex-1 rounded-md text-[13px] cursor-pointer transition-all"
            style={{
              padding: '8px 16px',
              background: hoverSource ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#FFFFFF',
            }}
          >
            View Source ↗
          </button>
          <button
            onClick={handleAskAI}
            onMouseEnter={() => setHoverAsk(true)}
            onMouseLeave={() => setHoverAsk(false)}
            className="flex-1 rounded-md text-[13px] cursor-pointer transition-all"
            style={{
              padding: '8px 16px',
              background: hoverAsk ? '#e0e0e0' : '#FFFFFF',
              color: '#000000',
              fontWeight: 700,
              transform: hoverAsk ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            Ask AI About It
          </button>
        </div>

        {/* ROW 6: Disclaimer */}
        <div
          className="rounded-md"
          style={{
            marginTop: 12,
            padding: '8px 10px',
            background: 'rgba(250,204,21,0.06)',
            border: '1px solid rgba(250,204,21,0.2)',
          }}
        >
          <span className="text-[11px]" style={{ color: 'rgba(250,204,21,0.7)' }}>
            ⚠️ Statistical flag only. Not evidence of wrongdoing.
          </span>
        </div>
      </div>

      {/* Triangle pointer */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: -8,
          width: 0,
          height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: '10px solid #0a0a0a',
        }}
      />
    </div>
  );
}