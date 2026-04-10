import { useState } from 'react';
import { ArrowUp } from 'lucide-react';

interface InputBarProps {
  onSend?: (text: string) => void;
}

export function InputBar({ onSend }: InputBarProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    onSend?.(input.trim());
    setInput('');
  };

  return (
    <div
      className="shrink-0 px-3 pb-3 pt-2"
      style={{
        background: 'rgba(17,24,39,0.9)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about any area in Dhaka..."
          className="flex-1 h-[44px] rounded-full px-4 text-[14px] outline-none"
          style={{
            background: '#1e293b',
            border: '1px solid rgba(255,255,255,0.1)',
            fontFamily: "'Inter', sans-serif",
            color: '#f1f5f9',
          }}
        />
        <button
          onClick={handleSend}
          className="w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0 transition-all duration-200 hover:scale-105 cursor-pointer"
          style={{ background: '#00d4ff' }}
        >
          <ArrowUp size={20} className="text-white" />
        </button>
      </div>
    </div>
  );
}
