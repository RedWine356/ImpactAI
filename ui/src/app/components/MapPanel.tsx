import { Plus, Minus, Layers } from 'lucide-react';

export function MapPanel() {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#0a0f1e' }}>
      {/* Grid pattern */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.035 }}>
        <defs>
          <pattern id="mapGrid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mapGrid)" />
      </svg>

      {/* Road network */}
      <svg className="absolute inset-0 w-full h-full">
        {/* Major arteries */}
        <line x1="15%" y1="0" x2="45%" y2="100%" stroke="#1e293b" strokeWidth="3" />
        <line x1="50%" y1="0" x2="55%" y2="100%" stroke="#1e293b" strokeWidth="2.5" />
        <line x1="75%" y1="0" x2="60%" y2="100%" stroke="#1e293b" strokeWidth="2" />
        <line x1="0" y1="35%" x2="100%" y2="40%" stroke="#1e293b" strokeWidth="3" />
        <line x1="0" y1="60%" x2="100%" y2="55%" stroke="#1e293b" strokeWidth="2" />
        <line x1="0" y1="20%" x2="100%" y2="25%" stroke="#1e293b" strokeWidth="1.5" />

        {/* Secondary roads */}
        <line x1="30%" y1="0" x2="32%" y2="100%" stroke="#1e293b" strokeWidth="1" opacity="0.6" />
        <line x1="65%" y1="0" x2="68%" y2="100%" stroke="#1e293b" strokeWidth="1" opacity="0.6" />
        <line x1="0" y1="48%" x2="100%" y2="50%" stroke="#1e293b" strokeWidth="1" opacity="0.6" />
        <line x1="0" y1="75%" x2="100%" y2="72%" stroke="#1e293b" strokeWidth="1" opacity="0.6" />
        <line x1="85%" y1="0" x2="80%" y2="100%" stroke="#1e293b" strokeWidth="1" opacity="0.5" />
        <line x1="10%" y1="10%" x2="90%" y2="90%" stroke="#1e293b" strokeWidth="1" opacity="0.4" />
        <line x1="85%" y1="10%" x2="15%" y2="85%" stroke="#1e293b" strokeWidth="1" opacity="0.3" />

        {/* Buriganga River */}
        <path
          d="M 0,680 Q 150,640 350,690 Q 550,740 750,700 Q 900,670 1100,710"
          fill="none"
          stroke="#0c4a6e"
          strokeWidth="14"
          opacity="0.35"
        />
        <path
          d="M 0,680 Q 150,640 350,690 Q 550,740 750,700 Q 900,670 1100,710"
          fill="none"
          stroke="#083344"
          strokeWidth="8"
          opacity="0.5"
        />
      </svg>

      {/* Watermark text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[16px]" style={{ color: '#64748b', opacity: 0.3 }}>
          Explore Dhaka's infrastructure
        </span>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        {[
          { icon: <Plus size={15} />, label: 'Zoom in' },
          { icon: <Minus size={15} />, label: 'Zoom out' },
          { icon: <Layers size={15} />, label: 'Layers' },
        ].map((btn) => (
          <button
            key={btn.label}
            title={btn.label}
            className="w-8 h-8 rounded-md flex items-center justify-center text-white transition-colors"
            style={{
              background: 'rgba(17,24,39,0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(17,24,39,0.7)'; }}
          >
            {btn.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
