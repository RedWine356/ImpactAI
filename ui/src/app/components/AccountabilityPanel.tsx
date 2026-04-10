import { useState } from 'react';
import { toast } from 'sonner';
import type { FlagData } from './FlagPopup';

type SeverityFilter = 'all' | 'very-high' | 'high' | 'moderate' | 'low';

function getGapInfo(pct: number) {
  if (pct >= 60) return { label: 'Very High', color: '#ef4444', icon: '🚩', type: 'very-high' as const };
  if (pct >= 40) return { label: 'High', color: '#fb923c', icon: '🔴', type: 'high' as const };
  if (pct >= 20) return { label: 'Moderate', color: '#facc15', icon: '⚠️', type: 'moderate' as const };
  return { label: 'Low', color: '#4ade80', icon: '✅', type: 'low' as const };
}

interface ProjectCardData {
  id: string;
  data: FlagData;
}

interface AccountabilityPanelProps {
  projects: ProjectCardData[];
  onClose: () => void;
  onSelectProject: (id: string) => void;
}

export function AccountabilityPanel({ projects, onClose, onSelectProject }: AccountabilityPanelProps) {
  const [filter, setFilter] = useState<SeverityFilter>('all');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Sort by gap descending
  const sorted = [...projects].sort((a, b) => b.data.gap - a.data.gap);

  // Count by severity
  const counts = { 'very-high': 0, high: 0, moderate: 0, low: 0 };
  sorted.forEach((p) => {
    counts[getGapInfo(p.data.gap).type]++;
  });
  const flaggedCount = counts['very-high'] + counts.high + counts.moderate;
  const totalBudget = sorted.reduce((sum, p) => {
    const match = p.data.budget.match(/([\d.]+)/);
    return sum + (match ? parseFloat(match[1]) : 0);
  }, 0);

  const filtered = filter === 'all' ? sorted : sorted.filter((p) => getGapInfo(p.data.gap).type === filter);

  const filterChips: { key: SeverityFilter; label: string; color: string; count: number }[] = [
    { key: 'all', label: `All (${projects.length})`, color: '#FFFFFF', count: projects.length },
    { key: 'very-high', label: `🚩 Very High (${counts['very-high']})`, color: '#ef4444', count: counts['very-high'] },
    { key: 'high', label: `🔴 High (${counts.high})`, color: '#fb923c', count: counts.high },
    { key: 'moderate', label: `⚠️ Moderate (${counts.moderate})`, color: '#facc15', count: counts.moderate },
    { key: 'low', label: `✅ Low (${counts.low})`, color: '#4ade80', count: counts.low },
  ];

  const handleExport = () => {
    const lines = [
      'NAGORMIND — Accountability Report',
      `Area: Mirpur · 2020-2024`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      `Projects Analyzed: ${projects.length}`,
      `Flagged: ${flaggedCount}`,
      `Total Budget: BDT ${totalBudget.toFixed(1)} Crore`,
      '',
      '─── PROJECT DETAILS ───',
      '',
    ];
    sorted.forEach((p) => {
      const g = getGapInfo(p.data.gap);
      lines.push(`${g.icon} ${p.data.name}`);
      lines.push(`   Budget: ${p.data.budget} (${p.data.budgetYear})`);
      lines.push(`   Agency: ${p.data.agency}`);
      lines.push(`   Expected: ${p.data.expected}`);
      lines.push(`   Found: ${p.data.found}`);
      lines.push(`   Gap: ${p.data.gap}% — ${g.label}`);
      lines.push('');
    });
    lines.push('⚠️ All analysis based on public data only.');
    navigator.clipboard.writeText(lines.join('\n'));
    toast.success('Report copied to clipboard');
  };

  // Mini bar chart max
  const maxBar = Math.max(counts['very-high'], counts.high, counts.moderate, counts.low, 1);

  return (
    <div
      className="absolute top-0 right-0 h-full flex flex-col"
      style={{
        width: 380,
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
        fontFamily: "'Inter', sans-serif",
        zIndex: 1500,
      }}
    >
      {/* ── HEADER ── */}
      <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between">
          <span className="text-[18px] text-white" style={{ fontWeight: 700 }}>
            🚩 Accountability Flags
          </span>
          <button
            onClick={onClose}
            className="cursor-pointer transition-colors"
            style={{ fontSize: 22, color: '#666666', lineHeight: 1 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#666666'; }}
          >
            ✕
          </button>
        </div>
        <div className="text-[13px] mt-1" style={{ color: '#666666' }}>
          Mirpur Area · 2020-2024
        </div>
      </div>

      {/* ── SUMMARY CARD ── */}
      <div style={{ padding: '0 16px' }}>
        <div
          className="rounded-lg"
          style={{
            marginTop: 16,
            padding: 16,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* 3 stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[24px]" style={{ color: '#FFFFFF', fontWeight: 700 }}>{projects.length}</div>
              <div className="text-[11px]" style={{ color: '#666666' }}>analyzed</div>
            </div>
            <div>
              <div className="text-[24px]" style={{ color: '#ef4444', fontWeight: 700 }}>{flaggedCount}</div>
              <div className="text-[11px]" style={{ color: '#666666' }}>flagged</div>
            </div>
            <div>
              <div className="text-[20px]" style={{ color: '#fff', fontWeight: 700 }}>
                ₿{totalBudget.toFixed(1)}Cr
              </div>
              <div className="text-[11px]" style={{ color: '#666666' }}>total budget</div>
            </div>
          </div>

          {/* Mini bar chart */}
          <div className="mt-3 space-y-1.5">
            {([
              { label: 'Very High', count: counts['very-high'], color: '#ef4444' },
              { label: 'High', count: counts.high, color: '#fb923c' },
              { label: 'Moderate', count: counts.moderate, color: '#facc15' },
              { label: 'Low', count: counts.low, color: '#4ade80' },
            ] as const).map((row) => (
              <div key={row.label} className="flex items-center gap-2">
                <span className="text-[10px] w-16 text-right shrink-0" style={{ color: '#666666' }}>
                  {row.label} ({row.count})
                </span>
                <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: '#111111' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(row.count / maxBar) * 100}%`,
                      background: row.color,
                      minWidth: row.count > 0 ? 6 : 0,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FILTER CHIPS ── */}
      <div className="flex flex-wrap gap-1.5" style={{ padding: '12px 16px 0' }}>
        {filterChips.map((chip) => {
          const active = filter === chip.key;
          return (
            <button
              key={chip.key}
              onClick={() => setFilter(chip.key)}
              className="rounded-full cursor-pointer transition-all text-[11px] shrink-0"
              style={{
                height: 28,
                padding: '0 10px',
                background: active ? '#FFFFFF' : 'transparent',
                border: active ? '1px solid #FFFFFF' : '1px solid rgba(255,255,255,0.15)',
                color: active ? '#000000' : '#B0B0B0',
                fontWeight: active ? 600 : 400,
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* ── PROJECT LIST ── */}
      <div className="flex-1 overflow-y-auto space-y-2.5" style={{ padding: '12px 16px 16px' }}>
        {filtered.map((project) => {
          const g = getGapInfo(project.data.gap);
          const isHovered = hoveredCard === project.id;
          return (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              onMouseEnter={() => setHoveredCard(project.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className="w-full text-left rounded-md cursor-pointer transition-all"
              style={{
                padding: 12,
                background: '#0a0a0a',
                border: '1px solid rgba(255,255,255,0.06)',
                borderLeft: `3px solid ${isHovered ? g.color : g.color + 'cc'}`,
                boxShadow: isHovered ? `0 0 12px ${g.color}22` : 'none',
              }}
            >
              <div className="text-[14px] text-white" style={{ fontWeight: 700 }}>
                {g.icon} {project.data.name}
              </div>
              <div className="text-[12px] mt-1" style={{ color: '#B0B0B0' }}>
                Budget: {project.data.budget} · Gap: {project.data.gap}%
              </div>
              <div
                className="w-full rounded-full overflow-hidden mt-2"
                style={{ height: 6, background: '#1a1a1a' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${project.data.gap}%`,
                    background: `linear-gradient(90deg, #fb923c, ${g.color})`,
                  }}
                />
              </div>
              <div className="text-[11px] mt-1.5" style={{ color: '#666666' }}>
                {project.data.agency} · {project.data.budgetYear}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── BOTTOM BAR ── */}
      <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={handleExport}
          className="w-full rounded-md text-[14px] cursor-pointer transition-colors"
          style={{
            height: 44,
            background: '#FFFFFF',
            color: '#000000',
            fontWeight: 700,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#e0e0e0'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#FFFFFF'; }}
        >
          Export Report
        </button>
        <div className="text-[11px] text-center mt-2" style={{ color: '#666666' }}>
          ⚠️ All analysis based on public data only
        </div>
      </div>
    </div>
  );
}