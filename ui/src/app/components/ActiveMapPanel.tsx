import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNagorMind, type MapRenderMsg } from '../NagorMindContext';

const DHAKA_CENTER = { lat: 23.8103, lon: 90.4125 };

function createCircleIcon(size: number, color: string, label: string) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};display:flex;align-items:center;
      justify-content:center;font-size:${size * 0.45}px;
      font-weight:700;color:#000;box-shadow:0 0 10px ${color}44;
      cursor:pointer;transition:transform 0.2s;
    " onmouseover="this.style.transform='scale(1.3)'"
       onmouseout="this.style.transform='scale(1)'"
    >${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function addLayerToMap(map: L.Map, msg: MapRenderMsg) {
  const { geojson, style, label, fit_bounds } = msg;
  if (!geojson?.features?.length) return;

  const leafletLayers: L.Layer[] = [];

  for (const feature of geojson.features) {
    const props = feature.properties || {};
    const geom = feature.geometry;
    if (!geom) continue;

    const color = (style.color as string) || '#00d4ff';
    const fillColor = (style.fill_color as string) || color;
    const opacity = (style.opacity as number) ?? 0.7;
    const fillOpacity = (style.fill_opacity as number) ?? 0.2;
    const weight = (style.weight as number) ?? 2;
    const radius = (style.radius as number) ?? null;
    const icon = (style.icon as string) || null;
    const styleType = (style.type as string) || 'marker';

    const name = props.name || props.project_name || label || '';
    const popupContent = `
      <div style="font-family:Inter,sans-serif;min-width:180px;max-width:240px">
        ${name ? `<div style="font-size:13px;font-weight:600;color:#fff;margin-bottom:4px">${name}</div>` : ''}
        ${Object.entries(props)
          .filter(([k]) => !['name', 'osm_id', 'tags', 'geometry_type'].includes(k))
          .slice(0, 5)
          .map(([k, v]) => `<div style="font-size:11px;color:#b0b0b0">${k}: <span style="color:#fff">${v}</span></div>`)
          .join('')}
        <div style="font-size:10px;color:#666;margin-top:4px">Source: OSM</div>
      </div>`;

    if (geom.type === 'Point') {
      const [lon, lat] = geom.coordinates as [number, number];
      let marker: L.Marker | L.CircleMarker;

      if (styleType === 'circle' || radius) {
        marker = L.circleMarker([lat, lon], {
          radius: 8,
          color,
          fillColor,
          fillOpacity,
          opacity,
          weight,
        });
      } else if (icon) {
        const divIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="font-size:20px;line-height:1;cursor:pointer">${icon}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        marker = L.marker([lat, lon], { icon: divIcon });
      } else {
        const amenityType = props.type || props.amenity || '';
        const label2 = amenityType === 'hospital' || amenityType === 'hospital_bed' ? 'H'
          : amenityType === 'clinic' ? '+'
          : amenityType === 'school' ? 'S'
          : amenityType === 'pharmacy' ? 'Rx'
          : '•';
        const size = amenityType === 'hospital' ? 24 : 16;
        marker = L.marker([lat, lon], { icon: createCircleIcon(size, color, label2) });
      }
      marker.bindPopup(popupContent, { className: 'dark-popup' });
      marker.addTo(map);
      leafletLayers.push(marker);
    } else if (geom.type === 'LineString' || geom.type === 'MultiLineString') {
      const coords = geom.type === 'LineString'
        ? [(geom.coordinates as [number, number][]).map(([lo, la]) => [la, lo] as [number, number])]
        : (geom.coordinates as [number, number][][]).map((line) => line.map(([lo, la]) => [la, lo] as [number, number]));
      for (const line of coords) {
        const poly = L.polyline(line, { color, opacity, weight }).addTo(map);
        poly.bindPopup(popupContent, { className: 'dark-popup' });
        leafletLayers.push(poly);
      }
    } else if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
      const rings = geom.type === 'Polygon'
        ? [geom.coordinates as [number, number][][]]
        : geom.coordinates as [number, number][][][];
      for (const ring of rings) {
        const latlngs = ring.map((r) => r.map(([lo, la]) => [la, lo] as [number, number]));
        const poly = L.polygon(latlngs, { color, fillColor, fillOpacity, opacity, weight }).addTo(map);
        poly.bindPopup(popupContent, { className: 'dark-popup' });
        leafletLayers.push(poly);
      }
    }
  }

  if (fit_bounds && leafletLayers.length > 0) {
    const group = L.featureGroup(leafletLayers);
    map.fitBounds(group.getBounds().pad(0.2));
  }
}

export function ActiveMapPanel() {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedLayersRef = useRef<number>(0);
  const prevLayerCountRef = useRef<number>(0);
  const { mapLayers } = useNagorMind();

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [DHAKA_CENTER.lat, DHAKA_CENTER.lon],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
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

  // Clear map when a new query starts (mapLayers resets to empty array)
  // and add new layers as they arrive
  useEffect(() => {
    if (!mapRef.current) return;

    // If context reset layers to [] (new query), clear the map
    if (mapLayers.length === 0 && prevLayerCountRef.current > 0) {
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) return;
        layer.remove();
      });
      renderedLayersRef.current = 0;
    }

    prevLayerCountRef.current = mapLayers.length;

    // Render any new layers
    const newLayers = mapLayers.slice(renderedLayersRef.current);
    for (const layerMsg of newLayers) {
      addLayerToMap(mapRef.current, layerMsg);
    }
    renderedLayersRef.current = mapLayers.length;
  }, [mapLayers]);

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
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(10,10,10,0.85)'; }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Layer count badge */}
      {mapLayers.length > 0 && (
        <div
          className="absolute top-4 left-4 px-3 py-1.5 rounded-lg z-[1000] text-[12px]"
          style={{
            background: 'rgba(10,10,10,0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#B0B0B0',
          }}
        >
          {mapLayers.length} layer{mapLayers.length !== 1 ? 's' : ''} rendered
        </div>
      )}

      {/* Empty state */}
      {mapLayers.length === 0 && messages.length === 0 && (
        <div
          className="absolute inset-0 flex items-center justify-center z-[500] pointer-events-none"
        >
          <p className="text-[13px]" style={{ color: '#333' }}>
            Map layers will appear here after a query
          </p>
        </div>
      )}

      <style>{`
        .custom-marker { background: none !important; border: none !important; }
        .dark-popup .leaflet-popup-content-wrapper {
          background: #0a0a0a !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.8) !important;
          color: #fff !important;
        }
        .dark-popup .leaflet-popup-tip { background: #0a0a0a !important; }
        .dark-popup .leaflet-popup-close-button { color: #666 !important; }
        .dark-popup .leaflet-popup-close-button:hover { color: #fff !important; }
      `}</style>
    </div>
  );
}
