import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Toaster } from 'sonner';
import { FlagPopup } from './FlagPopup';
import { AccountabilityPanel } from './AccountabilityPanel';
import type { FlagData } from './FlagPopup';
import { useNagorMind, type AccountabilityFlag } from '../NagorMindContext';

interface FlagState {
  id: string;
  lat: number;
  lon: number;
  data: FlagData;
  color: string;
  glowColor: string;
  icon: string;
  size: number;
  label: string;
}

function flagFromServer(f: AccountabilityFlag): FlagState {
  return {
    id: f.id,
    lat: f.lat,
    lon: f.lon,
    color: f.gap_color || '#ef4444',
    glowColor: `${f.gap_color || '#ef4444'}66`,
    icon: f.gap_icon || '🚩',
    size: f.gap_percent >= 60 ? 16 : f.gap_percent >= 40 ? 14 : 12,
    label: `${f.project_name} · ${f.gap_percent}%`,
    data: {
      name: f.project_name,
      budget: `BDT ${(f.budget_bdt / 10_000_000).toFixed(1)} Crore`,
      budgetYear: String(f.year),
      agency: f.agency,
      expected: `~${f.expected_count} units`,
      found: `${f.osm_count} found on OSM`,
      gap: f.gap_percent,
      thana: '',
      sourceUrl: f.source_url,
    },
  };
}

const DHAKA_CENTER: [number, number] = [23.807, 90.368];

export function FlagMapPanel() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  const { accountabilityFlags } = useNagorMind();
  const flags = accountabilityFlags.map(flagFromServer);
  const selected = flags.find((f) => f.id === selectedId);
  const highFlags = flags.filter((f) => f.data.gap >= 40);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DHAKA_CENTER,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.circle(DHAKA_CENTER, {
      radius: 2000,
      color: '#ffffff',
      weight: 1.5,
      dashArray: '8 5',
      opacity: 0.15,
      fill: false,
    }).addTo(map);

    mapRef.current = map;

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync flags to map markers
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Remove stale markers
    const currentIds = new Set(flags.map((f) => f.id));
    for (const [id, marker] of markersRef.current) {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    // Add new markers
    for (const flag of flags) {
      if (markersRef.current.has(flag.id)) continue;

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="position:relative">
          <div style="
            position:absolute;bottom:100%;left:50%;transform:translateX(-50%);
            margin-bottom:6px;white-space:nowrap;padding:3px 8px;border-radius:999px;
            font-size:11px;color:#fff;font-weight:500;font-family:Inter,sans-serif;
            background:rgba(0,0,0,0.85);border:1px solid rgba(255,255,255,0.08);
            pointer-events:none;max-width:200px;overflow:hidden;text-overflow:ellipsis;
          ">${flag.data.name.slice(0, 30)}${flag.data.name.length > 30 ? '…' : ''} · ${flag.data.gap}%</div>
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
        if (containerRef.current) {
          const point = map.latLngToContainerPoint([flag.lat, flag.lon]);
          setPopupPosition({ x: point.x, y: point.y });
        }
        setSelectedId(flag.id);
      });
      markersRef.current.set(flag.id, marker);
    }

    // Fit to flags if any
    if (flags.length > 0) {
      const group = L.featureGroup(Array.from(markersRef.current.values()));
      map.fitBounds(group.getBounds().pad(0.3));
    }
  }, [accountabilityFlags]);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#000000' }}>
      <div ref={containerRef} className="absolute inset-0" />

      {/* Flag popup overlay */}
      {selected && popupPosition && (
        <>
          <div
            className="absolute inset-0 cursor-pointer"
            style={{ background: 'rgba(0,0,0,0.3)', zIndex: 1100 }}
            onClick={() => setSelectedId(null)}
          />
          <div
            className="absolute"
            style={{
              left: `${Math.min(popupPosition.x, (containerRef.current?.offsetWidth || 600) - 360)}px`,
              top: `${Math.max(popupPosition.y - 380, 16)}px`,
              zIndex: 1200,
            }}
          >
            <FlagPopup data={selected.data} onClose={() => setSelectedId(null)} />
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
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(10,10,10,0.85)'; }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div
        className="absolute bottom-4 right-4 p-3 rounded-xl z-[1000]"
        style={{ width: 200, background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}
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

      {/* Flags button — only shown when flags exist */}
      {flags.length > 0 && (
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all hover:scale-[1.03]"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            backdropFilter: 'blur(12px)',
            animation: 'flagButtonPulse 3s ease-in-out infinite',
          }}
        >
          <span className="text-[13px] text-white" style={{ fontWeight: 700 }}>
            🚩 {highFlags.length} Flag{highFlags.length !== 1 ? 's' : ''} Found
          </span>
          <span
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white"
            style={{ background: '#ef4444', fontWeight: 700 }}
          >
            {highFlags.length}
          </span>
        </button>
      )}

      {/* Empty state */}
      {flags.length === 0 && (
        <div
          className="absolute inset-0 flex items-center justify-center z-[500] pointer-events-none"
        >
          <p className="text-[13px]" style={{ color: '#333' }}>
            Accountability flags will appear here after running a delivery gap analysis
          </p>
        </div>
      )}

      <style>{`
        .custom-marker { background: none !important; border: none !important; }
        @keyframes flagButtonPulse {
          0%, 100% { box-shadow: 0 0 8px rgba(239,68,68,0.2); }
          50% { box-shadow: 0 0 20px rgba(239,68,68,0.35); }
        }
      `}</style>

      {/* Accountability panel */}
      {showPanel && (
        <AccountabilityPanel
          projects={flags.map((f) => ({ id: f.id, data: f.data }))}
          onClose={() => setShowPanel(false)}
          onSelectProject={(id) => {
            setShowPanel(false);
            const flag = flags.find((f) => f.id === id);
            if (flag && mapRef.current && containerRef.current) {
              const point = mapRef.current.latLngToContainerPoint([flag.lat, flag.lon]);
              setPopupPosition({ x: point.x, y: point.y });
            }
            setSelectedId(id);
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
