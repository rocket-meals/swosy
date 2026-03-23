/**
 * Hex-tile overlay script for Geonexia.
 *
 * This self-contained IIFE is injected into the MapLibre map HTML via the
 * `injectScript` prop on the `MyMap` component. It hooks into the map's
 * `_mapExtensions` API to:
 *   – Render an H3 hexagonal grid over the map viewport (GeoJSON provided by RN).
 *   – Handle `hexTileLayer` messages to activate/configure/deactivate the grid.
 *   – Fire `{ tag: 'ViewportChanged', west, south, east, north, zoom }` to React
 *     Native whenever the viewport changes so RN can compute H3 cells with h3-js.
 *   – Accept `{ hexTileGeoJSON }` messages from React Native to update the grid data.
 *   – Fire `{ tag: 'HexTileClicked', id }` to React Native when the user taps a
 *     hex cell (id is the H3 cell index string).
 *
 * The H3 grid calculation lives on the React Native side (h3-js package), not
 * inside this injected WebView script.
 */
export const HEX_TILE_SCRIPT = `
(function () {
  // ── Configuration (can be overridden via hexTileLayer message) ─────────────
  // hexTileActive starts as true because injecting this script means the caller
  // wants the hex-tile grid shown immediately. Send { hexTileLayer: null } to
  // hide it or { hexTileLayer: { color, strokeColor } } to reconfigure.
  var hexTileActive = true;
  var hexTileColor = 'rgba(0, 0, 0, 0)';
  var hexTileStrokeColor = '#2563eb';

  // ── MapLibre source / layer IDs ───────────────────────────────────────────
  var HEX_TILE_SOURCE = 'hex-tile-source';
  var HEX_TILE_FILL_LAYER = 'hex-tile-fill';
  var HEX_TILE_STROKE_LAYER = 'hex-tile-stroke';

  // ── GeoJSON data (provided by React Native via hexTileGeoJSON message) ─────
  var hexTileGeoJSON = { type: 'FeatureCollection', features: [] };

  // ── Layer management ──────────────────────────────────────────────────────
  function addHexTileLayer() {
    if (!map || map.getSource(HEX_TILE_SOURCE)) return;
    map.addSource(HEX_TILE_SOURCE, { type: 'geojson', data: hexTileGeoJSON });
    map.addLayer({
      id: HEX_TILE_FILL_LAYER,
      type: 'fill',
      source: HEX_TILE_SOURCE,
      paint: { 'fill-color': hexTileColor, 'fill-opacity': 1 },
    });
    map.addLayer({
      id: HEX_TILE_STROKE_LAYER,
      type: 'line',
      source: HEX_TILE_SOURCE,
      paint: { 'line-color': hexTileStrokeColor, 'line-width': 1, 'line-opacity': 0.6 },
    });
  }

  function removeHexTileLayer() {
    if (!map) return;
    if (map.getLayer(HEX_TILE_STROKE_LAYER)) map.removeLayer(HEX_TILE_STROKE_LAYER);
    if (map.getLayer(HEX_TILE_FILL_LAYER)) map.removeLayer(HEX_TILE_FILL_LAYER);
    if (map.getSource(HEX_TILE_SOURCE)) map.removeSource(HEX_TILE_SOURCE);
  }

  function updateHexTileData() {
    if (!map) return;
    var src = map.getSource(HEX_TILE_SOURCE);
    if (src) src.setData(hexTileGeoJSON);
  }

  // ── Viewport notification ─────────────────────────────────────────────────
  // Fires a ViewportChanged message to React Native so the RN side can compute
  // H3 cells for the current viewport using h3-js and send back hexTileGeoJSON.
  // Always fires regardless of hexTileActive so that reactivating the layer
  // immediately receives fresh data without an extra user interaction.
  function notifyViewport() {
    if (!map) return;
    var bounds = map.getBounds();
    sendToRN({
      tag: 'ViewportChanged',
      west: bounds.getWest(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      north: bounds.getNorth(),
      zoom: map.getZoom(),
    });
  }

  // ── Extension hooks ───────────────────────────────────────────────────────
  window._mapExtensions = window._mapExtensions || {};

  window._mapExtensions.onMapReady = function (m) {
    addHexTileLayer();
    m.on('moveend', notifyViewport);
    m.on('zoomend', notifyViewport);
    m.on('styledata', function () {
      if (hexTileActive && !m.getSource(HEX_TILE_SOURCE)) addHexTileLayer();
    });
    // Request initial hex data from RN for the current viewport.
    notifyViewport();
  };

  window._mapExtensions.onMessage = function (data) {
    if (data.hexTileLayer !== undefined) {
      if (data.hexTileLayer) {
        if (data.hexTileLayer.color) hexTileColor = data.hexTileLayer.color;
        if (data.hexTileLayer.strokeColor) hexTileStrokeColor = data.hexTileLayer.strokeColor;
        hexTileActive = true;
        removeHexTileLayer();
        addHexTileLayer();
        notifyViewport();
      } else {
        hexTileActive = false;
        hexTileGeoJSON = { type: 'FeatureCollection', features: [] };
        removeHexTileLayer();
      }
    }
    if (data.hexTileGeoJSON !== undefined) {
      hexTileGeoJSON = data.hexTileGeoJSON || { type: 'FeatureCollection', features: [] };
      updateHexTileData();
    }
  };

  window._mapExtensions.onMapClick = function (e, m) {
    if (!hexTileActive || !m.getSource(HEX_TILE_SOURCE)) return false;
    var features = m.queryRenderedFeatures(e.point, { layers: [HEX_TILE_FILL_LAYER] });
    if (features && features.length > 0) {
      var props = features[0].properties || {};
      sendToRN({ tag: 'HexTileClicked', id: String(props.id) });
      return true;
    }
    return false;
  };

  // Fallback for the web iframe case: if the map already loaded before this
  // script was injected, call onMapReady immediately.
  if (typeof mapReady !== 'undefined' && mapReady && map) {
    window._mapExtensions.onMapReady(map);
  }
})();
`;
