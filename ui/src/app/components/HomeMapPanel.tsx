import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function HomeMapPanel() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map centered on Dhaka
    const map = L.map(containerRef.current, {
      center: [23.8103, 90.4125],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark basemap tiles (CartoDB Dark Matter — free, no key)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors © CARTO',
    }).addTo(map);

    // Attribution in bottom-right, styled dark
    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

    mapRef.current = map;

    // Handle resize
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
      {/* Leaflet Map */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Watermark overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[400]">
        <span
          className="text-[16px] px-4 py-2 rounded-lg"
          style={{
            color: '#888',
            opacity: 0.6,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
          }}
        >
          Explore Dhaka's infrastructure
        </span>
      </div>

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
    </div>
  );
}
