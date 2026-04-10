import { type ReactNode } from 'react';

interface DashboardLayoutProps {
  left: ReactNode;
  right: ReactNode;
}

export function DashboardLayout({ left, right }: DashboardLayoutProps) {
  return (
    <div className="size-full flex" style={{ background: '#0a0f1e', fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full md:w-[40%] h-full shrink-0">
        {left}
      </div>
      <div className="hidden md:block w-[2px] h-full shrink-0" style={{ background: '#1e293b' }} />
      <div className="hidden md:flex md:flex-1 h-full min-w-0">
        {right}
      </div>
    </div>
  );
}