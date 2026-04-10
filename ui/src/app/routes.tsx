import { createBrowserRouter } from 'react-router';
import { DashboardLayout } from './components/DashboardLayout';
import { WelcomePanel } from './components/WelcomePanel';
import { HomeMapPanel } from './components/HomeMapPanel';
import { ActiveChatPanel } from './components/ActiveChatPanel';
import { ActiveMapPanel } from './components/ActiveMapPanel';
import { AccountabilityChatPanel } from './components/AccountabilityChatPanel';
import { FlagMapPanel } from './components/FlagMapPanel';

function WelcomePage() {
  return (
    <div className="size-full flex" style={{ background: '#000000', fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full md:w-[40%] h-full shrink-0">
        <WelcomePanel />
      </div>
      <div className="hidden md:block w-[1px] h-full shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="hidden md:flex md:flex-1 h-full min-w-0">
        <HomeMapPanel />
      </div>
    </div>
  );
}

function ActiveChatPage() {
  return (
    <div className="size-full flex" style={{ background: '#000000', fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full md:w-[40%] h-full shrink-0">
        <ActiveChatPanel />
      </div>
      <div className="hidden md:block w-[1px] h-full shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="hidden md:flex md:flex-1 h-full min-w-0">
        <ActiveMapPanel />
      </div>
    </div>
  );
}

function AccountabilityPage() {
  return (
    <div className="size-full flex" style={{ background: '#000000', fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full md:w-[40%] h-full shrink-0">
        <AccountabilityChatPanel />
      </div>
      <div className="hidden md:block w-[1px] h-full shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="hidden md:flex md:flex-1 h-full min-w-0">
        <FlagMapPanel />
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  { path: '/', Component: WelcomePage },
  { path: '/chat', Component: ActiveChatPage },
  { path: '/accountability', Component: AccountabilityPage },
  { path: '*', Component: WelcomePage },
]);