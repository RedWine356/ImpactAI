/**
 * Tool 12: render_on_map — Push GeoJSON to client via WebSocket
 */

let sendFn = null;

export function setRenderSender(fn) {
  sendFn = fn;
}

let layerCounter = 0;

export async function render_on_map({ geojson, style, label, fit_bounds, layer_group }) {
  layerCounter++;
  const layerId = `layer_${Date.now()}_${layerCounter}`;

  const featureCount = geojson?.features?.length || 0;

  const payload = {
    type: 'map_render',
    action: 'add_layer',
    layer_id: layerId,
    geojson,
    style: {
      type: style?.type || 'marker',
      color: style?.color || '#00d4ff',
      opacity: style?.opacity ?? 0.7,
      radius: style?.radius,
      weight: style?.weight,
      fill_color: style?.fill_color,
      fill_opacity: style?.fill_opacity,
      icon: style?.icon,
    },
    label: label || `Layer ${layerCounter}`,
    fit_bounds: fit_bounds ?? true,
  };

  if (sendFn) {
    sendFn(payload);
  }

  return {
    layer_id: layerId,
    feature_count: featureCount,
    rendered: !!sendFn,
    message: `Rendered ${featureCount} features on map as "${label || layerId}"`,
  };
}
