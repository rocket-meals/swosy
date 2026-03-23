/**
 * Hex-tile overlay script for Geonexia.
 *
 * This self-contained IIFE is injected into the MapLibre map HTML via the
 * `injectScript` prop on the `MyMap` component. It hooks into the map's
 * `_mapExtensions` API to:
 *   – Render a stable Web-Mercator hexagonal grid over the map viewport.
 *   – Handle `hexTileLayer` messages to activate/configure/deactivate the grid.
 *   – Fire `{ tag: 'HexTileClicked', id, row, col }` to React Native when the
 *     user taps a hex cell.
 *
 * The algorithm lives only here (Geonexia), not in the shared common-ui HTML.
 */
export const HEX_TILE_SCRIPT = `
(function () {
  // ── Configuration (can be overridden via hexTileLayer message) ─────────────
  // hexTileActive starts as true because injecting this script means the caller
  // wants the hex-tile grid shown immediately. Send { hexTileLayer: null } to
  // hide it or { hexTileLayer: { radiusMeters, color, strokeColor } } to reconfigure.
  var hexTileActive = true;
  var hexTileColor = 'rgba(0, 0, 0, 0)';
  var hexTileStrokeColor = '#2563eb';
  var hexTileRadiusMeters = 20;

  // ── MapLibre source / layer IDs ───────────────────────────────────────────
  var HEX_TILE_SOURCE = 'hex-tile-source';
  var HEX_TILE_FILL_LAYER = 'hex-tile-fill';
  var HEX_TILE_STROKE_LAYER = 'hex-tile-stroke';

  // ── Safety limits ─────────────────────────────────────────────────────────
  var HEX_TILE_MAX_CELLS = 5000;
  var HEX_TILE_MIN_ZOOM = 14;

  // ── Web Mercator constants ─────────────────────────────────────────────────
  var HEX_WEB_MERCATOR_R = 6378137;
  var HEX_DEG_TO_RAD = Math.PI / 180;

  // ── Coordinate helpers ────────────────────────────────────────────────────
  function lngLatToMercator(lng, lat) {
    var x = HEX_WEB_MERCATOR_R * lng * HEX_DEG_TO_RAD;
    var latRad = lat * HEX_DEG_TO_RAD;
    var y = HEX_WEB_MERCATOR_R * Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    return [x, y];
  }

  function mercatorToLngLat(x, y) {
    var lng = x / (HEX_WEB_MERCATOR_R * HEX_DEG_TO_RAD);
    var lat = (2 * Math.atan(Math.exp(y / HEX_WEB_MERCATOR_R)) - Math.PI / 2) / HEX_DEG_TO_RAD;
    return [lng, lat];
  }

  // ── GeoJSON builder ───────────────────────────────────────────────────────
  function buildHexGeoJSON() {
    if (!map || map.getZoom() < HEX_TILE_MIN_ZOOM) {
      return { type: 'FeatureCollection', features: [] };
    }
    var bounds = map.getBounds();
    var sw = lngLatToMercator(bounds.getWest(), bounds.getSouth());
    var ne = lngLatToMercator(bounds.getEast(), bounds.getNorth());
    var r = hexTileRadiusMeters;
    var W = Math.sqrt(3) * r;
    var rowSpacing = 1.5 * r;
    var pad = r * 2;
    var rowMin = Math.floor((sw[1] - pad) / rowSpacing);
    var rowMax = Math.ceil((ne[1] + pad) / rowSpacing);
    var features = [];
    outer:
    for (var row = rowMin; row <= rowMax; row++) {
      var cy = row * rowSpacing;
      var xOffset = (row & 1) ? W / 2 : 0;
      var colMin = Math.floor((sw[0] - pad - xOffset) / W);
      var colMax = Math.ceil((ne[0] + pad - xOffset) / W);
      for (var col = colMin; col <= colMax; col++) {
        var cx = col * W + xOffset;
        var coords = [];
        for (var i = 0; i < 6; i++) {
          var angle = HEX_DEG_TO_RAD * (60 * i + 30);
          coords.push(mercatorToLngLat(cx + r * Math.cos(angle), cy + r * Math.sin(angle)));
        }
        coords.push(coords[0]);
        features.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [coords] },
          properties: { row: row, col: col, id: row + '_' + col },
        });
        if (features.length >= HEX_TILE_MAX_CELLS) break outer;
      }
    }
    return { type: 'FeatureCollection', features: features };
  }

  // ── Layer management ──────────────────────────────────────────────────────
  function addHexTileLayer() {
    if (!map || map.getSource(HEX_TILE_SOURCE)) return;
    map.addSource(HEX_TILE_SOURCE, { type: 'geojson', data: buildHexGeoJSON() });
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

  function updateHexTileGrid() {
    if (!hexTileActive || !map) return;
    var src = map.getSource(HEX_TILE_SOURCE);
    if (src) src.setData(buildHexGeoJSON());
  }

  // ── Extension hooks ───────────────────────────────────────────────────────
  window._mapExtensions = window._mapExtensions || {};

  window._mapExtensions.onMapReady = function (m) {
    addHexTileLayer();
    m.on('moveend', updateHexTileGrid);
    m.on('zoomend', updateHexTileGrid);
    m.on('styledata', function () {
      if (hexTileActive && !m.getSource(HEX_TILE_SOURCE)) addHexTileLayer();
    });
  };

  window._mapExtensions.onMessage = function (data) {
    if (data.hexTileLayer !== undefined) {
      if (data.hexTileLayer) {
        if (data.hexTileLayer.color) hexTileColor = data.hexTileLayer.color;
        if (data.hexTileLayer.strokeColor) hexTileStrokeColor = data.hexTileLayer.strokeColor;
        if (data.hexTileLayer.radiusMeters) hexTileRadiusMeters = data.hexTileLayer.radiusMeters;
        hexTileActive = true;
        removeHexTileLayer();
        addHexTileLayer();
      } else {
        hexTileActive = false;
        removeHexTileLayer();
      }
    }
  };

  window._mapExtensions.onMapClick = function (e, m) {
    if (!hexTileActive || !m.getSource(HEX_TILE_SOURCE)) return false;
    var features = m.queryRenderedFeatures(e.point, { layers: [HEX_TILE_FILL_LAYER] });
    if (features && features.length > 0) {
      var props = features[0].properties || {};
      var id = String(props.row) + '_' + String(props.col);
      sendToRN({ tag: 'HexTileClicked', id: id, row: props.row, col: props.col });
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
