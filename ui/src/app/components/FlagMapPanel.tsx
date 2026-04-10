import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Toaster } from 'sonner';
import { FlagPopup } from './FlagPopup';
import { AccountabilityPanel } from './AccountabilityPanel';
import type { FlagData } from './FlagPopup';

interface Flag {
  id: string;
  lat: number;
  lon: number;
  icon: string;
  type: 'very-high' | 'high' | 'low';
  label: string;
  color: string;
  glowColor: string;
  size: number;
  data: FlagData;
}

const flags: Flag[] = [
  {
    id: 'f1', lat: 23.807, lon: 90.368, icon: '🚩', type: 'very-high',
    label: 'Drainage Phase 2 · 67%',
    color: '#ef4444', glowColor: 'rgba(239,68,68,0.4)', size: 16,
    data: { name: 'Mirpur Drainage Phase 2', budget: 'BDT 4.5 Crore', budgetYear: '2022', agency: 'DNCC', expected: '~18 drain segments', found: '6 segments', gap: 67, thana: 'Mirpur', sourceUrl: 'https://imed.gov.bd' },
  },
  {
    id: 'f2', lat: 23.815, lon: 90.375, icon: '🚩', type: 'very-high',
    label: 'Pallabi Road · 72%',
    color: '#ef4444', glowColor: 'rgba(239,68,68,0.4)', size: 16,
    data: { name: 'Pallabi Road Widening', budget: 'BDT 3.2 Crore', budgetYear: '2021', agency: 'DSCC', expected: '~12 road segments', found: '3 segments', gap: 72, thana: 'Pallabi', sourceUrl: 'https://imed.gov.bd' },
  },
  {
    id: 'f3', lat: 23.800, lon: 90.362, icon: '⚠️', type: 'high',
    label: 'Health Clinic · 45%',
    color: '#fb923c', glowColor: 'rgba(251,146,60,0.3)', size: 14,
    data: { name: 'Mirpur-10 Health Clinic', budget: 'BDT 2.1 Crore', budgetYear: '2022', agency: 'DGHS', expected: '1 clinic building', found: 'Partial construction', gap: 45, thana: 'Mirpur-10', sourceUrl: 'https://imed.gov.bd' },
  },
  {
    id: 'f4', lat: 23.812, lon: 90.382, icon: '✅', type: 'low',
    label: 'School Extension · 12%',
    color: '#4ade80', glowColor: 'rgba(74,222,128,0.3)', size: 12,
    data: { name: 'Kazipara Primary School Extension', budget: 'BDT 1.8 Crore', budgetYear: '2023', agency: 'DPE', expected: '3 classrooms', found: '3 classrooms', gap: 12, thana: 'Kazipara', sourceUrl: 'https://imed.gov.bd' },
  },
  {
    id: 'f5', lat: 23.804, lon: 90.374, icon: '✅', type: 'low',
    label: 'WASA Pipeline · 8%',
    color: '#4ade80', glowColor: 'rgba(74,222,128,0.3)', size: 12,
    data: { name: 'Mirpur WASA Pipeline', budget: 'BDT 0.8 Crore', budgetYear: '2023', agency: 'DWASA', expected: '4 pipeline segments', found: '4 pipeline segments', gap: 8, thana: 'Mirpur', sourceUrl: 'https://imed.gov.bd' },
  },
];

// Drain segments as polyline coordinates
const drainSegments: [number, number][][] = [
  [[23.810, 90.365], [23.808, 90.368]],
  [[23.808, 90.368], [23.806, 90.370]],
  [[23.806, 90.370], [23.804, 90.368]],
  [[23.809, 90.362], [23.808, 90.368]],
  [[23.811, 90.372], [23.808, 90.368]],
  [[23.804, 90.368], [23.802, 90.372]],
  [[23.809, 90.358], [23.809, 90.362]],
  [[23.802, 90.372], [23.800, 90.375]],
];

export function FlagMapPanel() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);
  const [showAccountabilityPanel, setShowAccountabilityPanel] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  const selected = flags.find((f) => f.id === selectedFlag);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [23.807, 90.368],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark basemap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // 2km dashed radius
    L.circle([23.807, 90.368], {
      radius: 2000,
      color: '#ffffff',
      weight: 1.5,
      dashArray: '8 5',
      opacity: 0.15,
      fill: false,
    }).addTo(map);

    // Drain segment polylines
    drainSegments.forEach((coords) => {
      L.polyline(coords, {
        color: '#ffffff',
        weight: 2,
        opacity: 0.2,
      }).addTo(map);
    });

    // Flag pin markers
    flags.forEach((flag) => {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="position:relative">
          <div style="
            position:absolute;bottom:100%;left:50%;transform:translateX(-50%);
            margin-bottom:6px;white-space:nowrap;padding:3px 8px;border-radius:999px;
            font-size:11px;color:#fff;font-weight:500;font-family:Inter,sans-serif;
            background:rgba(0,0,0,0.85);border:1px solid rgba(255,255,255,0.08);
            pointer-events:none;
          ">${flag.label}</div>
          <div style="
            width:${flag.size + 8}px;height:${flag.size + 8}px;border-radius:50%;
            background:${flag.color};display:flex;align-items:center;justify-content:center;
            box-shadow:0 0 12px ${flag.glowColor};cursor:pointer;
            transition:transform 0.2s;font-size:${flag.size * 0.7}px;
          " onmouseover="this.style.transform='scale(1.2)'"
             onmouseout="this.style.transform='scale(1)'"
          >${flag.icon}</div>
        </div>`,
        iconSize: [flag.size + 8, flag.size + 8 + 30],
        iconAnchor: [(flag.size + 8) / 2, flag.size + 8 + 30],
      });

      const marker = L.marker([flag.lat, flag.lon], { icon }).addTo(map);
      marker.on('click', () => {
        const point = map.latLngToContainerPoint([flag.lat, flag.lon]);
        setPopupPosition({ x: point.x, y: point.y });
        setSelectedFlag(flag.id);
      });
    });

    mapRef.current = map;

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#000000' }}>
      <div ref={containerRef} className="absolute inset-0" />

      {/* Flag Popup overlay */}
      {selected && popupPosition && (
        <>
          <div
            className="absolute inset-0 cursor-pointer"
            style={{ background: 'rgba(0,0,0,0.3)', zIndex: 1100 }}
            onClick={() => setSelectedFlag(null)}
          />
          <div
            className="absolute"
            style={{
              left: `${Math.min(popupPosition.x, (containerRef.current?.offsetWidth || 600) - 360)}px`,
              top: `${Math.max(popupPosition.y - 380, 16)}px`,
              zIndex: 1200,
            }}
          >
            <FlagPopup
              data={selected.data}
              onClose={() => setSelectedFlag(null)}
            />
          </div>
        </>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
        {[
          { label: '+', action: () => mapRef.current?.zoomIn(), title: 'Zoom in' },
          { label: '−', action: () => mapRef.current?.zoomOut(), title: 'Zoom out' },
        ].map((btn) => (
          <button
            key={btn.title}
            title={btn.title}
            onClick={btn.action}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors text-[16px]"
            style={{
              background: 'rgba(10,10,10,0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#B0B0B0',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(10,10,10,0.85)';
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div
        className="absolute bottom-4 right-4 p-3 rounded-xl z-[1000]"
        style={{
          width: 200,
          background: 'rgba(10,10,10,0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="text-[12px] mb-2" style={{ color: '#FFFFFF', fontWeight: 600 }}>
          Infrastructure Delivery Gap
        </div>
        {[
          { icon: '🚩', label: 'Very High (>60%)', color: '#ef4444' },
          { icon: '🔴', label: 'High (40-60%)', color: '#fb923c' },
          { icon: '⚠️', label: 'Moderate (20-40%)', color: '#facc15' },
          { icon: '✅', label: 'Low (<20%)', color: '#4ade80' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 py-[2px]">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
            <span className="text-[11px]" style={{ color: '#B0B0B0' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Accountability Flags button */}
      <button
        onClick={() => setShowAccountabilityPanel(!showAccountabilityPanel)}
        className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03]"
        style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          backdropFilter: 'blur(12px)',
          animation: 'flagButtonPulse 3s ease-in-out infinite',
        }}
      >
        <span className="text-[13px] text-white" style={{ fontWeight: 700 }}>🚩 3 Flags Found</span>
        <span
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white"
          style={{ background: '#ef4444', fontWeight: 700 }}
        >
          3
        </span>
      </button>

      <style>{`
        .custom-marker { background: none !important; border: none !important; }
        @keyframes flagButtonPulse {
          0%, 100% { box-shadow: 0 0 8px rgba(239,68,68,0.2); }
          50% { box-shadow: 0 0 20px rgba(239,68,68,0.35); }
        }
      `}</style>

      {/* Accountability Panel */}
      {showAccountabilityPanel && (
        <AccountabilityPanel
          projects={flags.map((f) => ({ id: f.id, data: f.data }))}
          onClose={() => setShowAccountabilityPanel(false)}
          onSelectProject={(id) => {
            setShowAccountabilityPanel(false);
            const flag = flags.find((f) => f.id === id);
            if (flag && mapRef.current && containerRef.current) {
              const point = mapRef.current.latLngToContainerPoint([flag.lat, flag.lon]);
              setPopupPosition({ x: point.x, y: point.y });
            }
            setSelectedFlag(id);
          }}
        />
      )}

      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#0a0a0a',
            color: '#FFFFFF',
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: "'Inter', sans-serif",
          },
        }}
      />
    </div>
  );
}