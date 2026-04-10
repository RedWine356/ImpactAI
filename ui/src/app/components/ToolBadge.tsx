interface ToolBadgeProps {
  name: string;
  status?: 'done' | 'loading' | 'pending';
  variant?: 'default' | 'accountability' | 'space-black';
}

export function ToolBadge({ name, status = 'done', variant = 'default' }: ToolBadgeProps) {
  const statusIcon =
    status === 'done' ? '✅' : status === 'loading' ? '⏳' : '○';

  const isAmber = variant === 'accountability';
  const isSpaceBlack = variant === 'space-black';

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[11px] leading-none"
        style={{
          background: isSpaceBlack
            ? 'rgba(255,255,255,0.08)'
            : isAmber ? 'rgba(250,204,21,0.15)' : 'rgba(99,102,241,0.2)',
          border: isSpaceBlack
            ? '1px solid rgba(255,255,255,0.15)'
            : status === 'loading'
              ? '1px solid rgba(0,212,255,0.5)'
              : isAmber
                ? '1px solid rgba(250,204,21,0.4)'
                : '1px solid rgba(99,102,241,0.4)',
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 500,
          color: isSpaceBlack ? '#FFFFFF' : isAmber ? '#fde68a' : '#a5b4fc',
          animation: status === 'loading' ? 'pulse 2s infinite' : undefined,
        }}
      >
        🛠️ {name}
      </span>
      <span className="text-[12px]">{statusIcon}</span>
    </span>
  );
}

interface ResultLineProps {
  text: string;
  color?: string;
  bold?: boolean;
}

export function ResultLine({ text, color = '#4ade80', bold = false }: ResultLineProps) {
  return (
    <div className="pl-7 text-[12px]" style={{ color, fontFamily: "'Inter', sans-serif", fontWeight: bold ? 700 : 400 }}>
      → {text}
    </div>
  );
}