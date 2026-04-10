import { Settings, Brain } from 'lucide-react';

export function TopBar() {
  return (
    <div
      className="shrink-0 flex items-center justify-between px-5 h-16"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(0,212,255,0.15)' }}
        >
          <Brain size={18} style={{ color: '#00d4ff' }} />
        </div>
        <span
          className="text-[18px] text-white tracking-[-0.02em]"
          style={{ fontWeight: 700 }}
        >
          NagorMind
        </span>
        <span
          className="px-[7px] py-[2px] rounded-full text-[10px]"
          style={{ background: '#6366f1', color: '#e0e7ff', fontWeight: 500 }}
        >
          v2
        </span>
      </div>
      <button className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
        <Settings size={20} style={{ color: '#94a3b8' }} />
      </button>
    </div>
  );
}
