import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MIRPUR_10 = { lat: 23.8069, lon: 90.3687 };
const SEARCH_RADIUS = 2000; // meters

const hospitals = [
  { id: 'h1', name: 'Mirpur General Hospital', lat: 23.808, lon: 90.367, dist: '450m' },
  { id: 'h2', name: 'Kafrul Clinic & Hospital', lat: 23.815, lon: 90.378, dist: '1.1km' },
  { id: 'h3', name: 'Ibn Sina Hospital Mirpur', lat: 23.800, lon: 90.362, dist: '1.4km' },
  { id: 'h4', name: 'City Hospital Mirpur', lat: 23.812, lon: 90.382, dist: '1.6km' },
  { id: 'h5', name: 'Shaheed Suhrawardy', lat: 23.798, lon: 90.375, dist: '1.9km' },
];

const clinics = [
  { id: 'c1', name: 'Mirpur Community Clinic', lat: 23.809, lon: 90.370 },
  { id: 'c2', name: 'Pallabi Health Center', lat: 23.818, lon: 90.365 },
  { id: 'c3', name: 'Rupnagar Clinic', lat: 23.803, lon: 90.372 },
  { id: 'c4', name: 'Kazipara Clinic', lat: 23.805, lon: 90.358 },
  { id: 'c5', name: 'Mirpur-10 Govt Clinic', lat: 23.810, lon: 90.369 },
  { id: 'c6', name: 'Section 12 Clinic', lat: 23.813, lon: 90.385 },
  { id: 'c7', name: 'Mirpur DNCC Clinic', lat: 23.802, lon: 90.366 },
  { id: 'c8', name: 'Pallabi Maternity', lat: 23.816, lon: 90.360 },
  { id: 'c9', name: 'Shah Ali Clinic', lat: 23.801, lon: 90.355 },
];

function createCircleIcon(size: number, color: string, label: string) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${size}px; height: ${size}px; border-radius: 50%;
      background: ${color}; display: flex; align-items: center;
      justify-content: center; font-size: ${size * 0.45}px;
      font-weight: 700; color: #000; box-shadow: 0 0 10px ${color}44;
      cursor: pointer; transition: transform 0.2s;
    " onmouseover="this.style.transform='scale(1.3)'"
       onmouseout="this.style.transform='scale(1)'"
    >${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function ActiveMapPanel() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [MIRPUR_10.lat, MIRPUR_10.lon],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark basemap
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Search radius circle (dashed)
    L.circle([MIRPUR_10.lat, MIRPUR_10.lon], {
      radius: SEARCH_RADIUS,
      color: '#ffffff',
      weight: 1.5,
      dashArray: '8 5',
      opacity: 0.2,
      fillColor: '#ffffff',
      fillOpacity: 0.02,
    }).addTo(map).bindTooltip('2km search radius', {
      direction: 'bottom',
      className: 'dark-tooltip',
      offset: [0, 10],
    });

    // Pulsing center marker
    const pulseIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="position:relative">
        <div style="width:12px;height:12px;background:#ef4444;border-radius:50%;box-shadow:0 0 12px rgba(239,68,68,0.6);animation:mapPulse 2s ease-in-out infinite"></div>
        <span style="position:absolute;left:16px;top:-2px;color:#ef4444;font-size:12px;font-weight:600;white-space:nowrap;font-family:Inter,sans-serif">Mirpur 10</span>
      </div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
    L.marker([MIRPUR_10.lat, MIRPUR_10.lon], { icon: pulseIcon }).addTo(map);

    // Hospital markers
    hospitals.forEach((h) => {
      const icon = createCircleIcon(24, '#ffffff', 'H');
      L.marker([h.lat, h.lon], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:180px">
            <div style="font-size:13px;font-weight:600;color:#fff;margin-bottom:4px">${h.name}</div>
            <div style="font-size:11px;color:#b0b0b0">Type: Hospital</div>
            <div style="font-size:11px;color:#fff">Distance: ${h.dist}</div>
            <div style="font-size:10px;color:#666;margin-top:4px">Source: OpenStreetMap</div>
          </div>
        `, { className: 'dark-popup' });
    });

    // Clinic markers
    clinics.forEach((c) => {
      const icon = createCircleIcon(16, 'rgba(255,255,255,0.6)', '+');
      L.marker([c.lat, c.lon], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:160px">
            <div style="font-size:13px;font-weight:600;color:#fff;margin-bottom:4px">${c.name}</div>
            <div style="font-size:11px;color:#b0b0b0">Type: Clinic</div>
            <div style="font-size:10px;color:#666;margin-top:4px">Source: OpenStreetMap</div>
          </div>
        `, { className: 'dark-popup' });
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
          width: 180,
          background: 'rgba(10,10,10,0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="text-[12px] mb-2" style={{ color: '#FFFFFF', fontWeight: 600 }}>
          Healthcare Facilities
        </div>
        {[
          { label: 'Hospital (5)', dotSize: 10, color: '#FFFFFF' },
          { label: 'Clinic (9)', dotSize: 7, color: 'rgba(255,255,255,0.6)' },
          { label: 'Search radius', dashed: true },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 py-[2px]">
            {'dashed' in item ? (
              <span
                className="rounded-full shrink-0"
                style={{ width: 10, height: 10, border: '1.5px dashed rgba(255,255,255,0.3)' }}
              />
            ) : (
              <span
                className="rounded-full shrink-0"
                style={{ width: item.dotSize, height: item.dotSize, background: item.color }}
              />
            )}
            <span className="text-[11px]" style={{ color: '#B0B0B0' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Dark popup & tooltip styles */}
      <style>{`
        @keyframes mapPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .custom-marker { background: none !important; border: none !important; }
        .dark-popup .leaflet-popup-content-wrapper {
          background: #0a0a0a !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.8) !important;
          color: #fff !important;
        }
        .dark-popup .leaflet-popup-tip {
          background: #0a0a0a !important;
        }
        .dark-popup .leaflet-popup-close-button {
          color: #666 !important;
        }
        .dark-popup .leaflet-popup-close-button:hover {
          color: #fff !important;
        }
        .dark-tooltip {
          background: rgba(0,0,0,0.8) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          color: #888 !important;
          font-size: 11px !important;
          font-family: Inter, sans-serif !important;
          border-radius: 6px !important;
          padding: 3px 8px !important;
          box-shadow: none !important;
        }
        .dark-tooltip::before { border-bottom-color: rgba(0,0,0,0.8) !important; }
      `}</style>
    </div>
  );
}
