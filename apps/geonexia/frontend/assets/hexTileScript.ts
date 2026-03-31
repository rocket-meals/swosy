/**
 * Hex-tile overlay script for Geonexia.
 *
 * This self-contained IIFE is injected into the MapLibre map HTML via the
 * `injectScript` prop on the `MyMap` component. It hooks into the map's
 * `_mapExtensions` API to:
 *   – Render an H3-based hexagonal grid over the map viewport.
 *   – Notify React Native of viewport changes so that it can compute H3 cells
 *     using H3Helper and send back the GeoJSON via a `hexTileGeoJson` message.
 *   – Handle `hexTileLayer` messages to activate/configure/deactivate the grid.
 *   – Fire `{ tag: 'HexTileClicked', h3Index }` to React Native when the user
 *     taps a hex cell.
 *
 * Hex cell computation is intentionally kept on the React Native side so that
 * the existing H3Helper (helpers/H3Helper.ts) can be reused directly.
 */
export const HEX_TILE_SCRIPT = `
(function () {
  // ── Configuration (can be overridden via hexTileLayer message) ─────────────
  // hexTileActive starts as true because injecting this script means the caller
  // wants the hex-tile grid shown immediately. Send { hexTileLayer: null } to
  // hide it or { hexTileLayer: { color, strokeColor } } to reconfigure.
  // H3 resolution and cell computation are controlled on the React Native side
  // via the H3Helper; this script only renders the GeoJSON it receives.
  var hexTileActive = true;
  var hexDebugPointsVisible = false;
  var hexTileColor = 'rgba(0, 0, 0, 0)';
  // Hex border: light gray, low opacity
  var hexTileStrokeColor = '#d1d5db';
  // Level-based fill colours: level 1 = lightest green, level 10 = darkest green.
  // Levels 1–10 are interpolated linearly between these two endpoints.
  var HEX_COLOR_LEVEL_MIN = '#bbf7d0'; // level  1 – light mint green
  var HEX_COLOR_LEVEL_MAX = '#15803d'; // level 10 – dark forest green
  var HEX_OPACITY_LEVEL_MIN = 0.45;   // level  1
  var HEX_OPACITY_LEVEL_MAX = 0.65;   // level 10
  // Territory border: thick, dark line between level-0 and level>0 tiles
  var HEX_BORDER_COLOR = '#1e3a1e';
  var HEX_BORDER_WIDTH = 2.5;
  var HEX_BORDER_OPACITY = 0.85;
  // Walk path: sandy brown/earth tone for tiles the user has physically walked on
  var WALK_PATH_COLOR = 'rgba(180, 130, 60, 0.85)';
  var WALK_PATH_WIDTH = 2.5;

  // ── MapLibre source / layer IDs ───────────────────────────────────────────
  var HEX_TILE_SOURCE = 'hex-tile-source';
  var HEX_TILE_FILL_LAYER = 'hex-tile-fill';
  var HEX_TILE_STROKE_LAYER = 'hex-tile-stroke';
  var HEX_BORDER_SOURCE = 'hex-border-source';
  var HEX_BORDER_LAYER = 'hex-border-layer';
  var HEX_WALK_PATH_SOURCE = 'hex-walk-path-source';
  var HEX_WALK_PATH_LAYER = 'hex-walk-path-layer';
  var HEX_VERTICES_SOURCE = 'hex-vertices-source';
  var HEX_VERTICES_LAYER = 'hex-vertices-layer';
  var HEX_CENTERS_SOURCE = 'hex-centers-source';
  var HEX_CENTERS_LAYER = 'hex-centers-layer';
  var HEX_MIDPOINTS_SOURCE = 'hex-midpoints-source';
  var HEX_MIDPOINTS_LAYER = 'hex-midpoints-layer';
  // Measure mode: draw tapped waypoints and the connecting polyline
  var MEASURE_ROUTE_SOURCE = 'measure-route-source';
  var MEASURE_ROUTE_LAYER = 'measure-route-layer';
  var MEASURE_POINTS_SOURCE = 'measure-points-source';
  var MEASURE_POINTS_LAYER = 'measure-points-layer';
  var MEASURE_ROUTE_COLOR = '#f97316'; // orange
  var measureModeActive = false;
  // Colours assigned to midpoints between the hex centre and each corner vertex,
  // cycling through: red, orange, yellow, blue, white, black.
  var MIDPOINT_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#ffffff', '#000000'];
  // ── Route edit overlay: neighbor highlight + action labels ───────────────
  var ROUTE_EDIT_NEIGHBOR_SOURCE = 'route-edit-neighbor-source';
  var ROUTE_EDIT_NEIGHBOR_FILL_LAYER = 'route-edit-neighbor-fill';
  var ROUTE_EDIT_NEIGHBOR_STROKE_LAYER = 'route-edit-neighbor-stroke';
  var ROUTE_EDIT_LABELS_SOURCE = 'route-edit-labels-source';
  var ROUTE_EDIT_LABELS_LAYER = 'route-edit-labels';

  // ── Empty FeatureCollection used as initial / cleared state ───────────────
  var EMPTY_FC = { type: 'FeatureCollection', features: [] };

  // ── Build GeoJSON FeatureCollection of unique hex polygon vertices ───────
  // Extracts every corner point from the polygon rings and deduplicates them.
  // Used to render green dots at all hex tile corner positions.
  function buildVerticesGeoJson(features) {
    var PRECISION = 6;
    var seen = {};
    var points = [];
    for (var i = 0; i < features.length; i++) {
      var ring = features[i].geometry && features[i].geometry.coordinates && features[i].geometry.coordinates[0];
      if (!ring) continue;
      // Polygon rings are closed (last vertex === first); skip the last to avoid duplicates.
      for (var j = 0; j < ring.length - 1; j++) {
        var key = ring[j][0].toFixed(PRECISION) + ',' + ring[j][1].toFixed(PRECISION);
        if (!seen[key]) {
          seen[key] = true;
          points.push({ type: 'Feature', geometry: { type: 'Point', coordinates: ring[j] }, properties: {} });
        }
      }
    }
    return { type: 'FeatureCollection', features: points };
  }

  // ── Compute territory border edges ────────────────────────────────────────
  // Returns a GeoJSON FeatureCollection of LineString features representing
  // the edges that lie between a level-0 tile and a level>0 tile.
  // The GeoJSON received from React Native includes ALL tiles in the viewport
  // (level 0 and above), so shared edges between adjacent tiles appear twice.
  // A border edge is therefore one that appears exactly twice and where one
  // tile is level 0 and the other is level > 0.
  function buildBorderEdges(features) {
    // 6 decimal places ≈ 0.1 m precision at the equator – sufficient to
    // uniquely identify shared hex polygon vertices without floating-point drift.
    var PRECISION = 6;
    function edgeKey(v1, v2) {
      var s1 = v1[0].toFixed(PRECISION) + ',' + v1[1].toFixed(PRECISION);
      var s2 = v2[0].toFixed(PRECISION) + ',' + v2[1].toFixed(PRECISION);
      return s1 < s2 ? s1 + '|' + s2 : s2 + '|' + s1;
    }

    var edgeMap = {};
    for (var i = 0; i < features.length; i++) {
      var feature = features[i];
      var level = (feature.properties && feature.properties.level) || 0;
      var ring = feature.geometry && feature.geometry.coordinates && feature.geometry.coordinates[0];
      if (!ring) continue;
      for (var j = 0; j < ring.length - 1; j++) {
        var key = edgeKey(ring[j], ring[j + 1]);
        if (!edgeMap[key]) {
          edgeMap[key] = { coords: [ring[j], ring[j + 1]], minLevel: level, maxLevel: level, count: 0 };
        }
        if (level < edgeMap[key].minLevel) edgeMap[key].minLevel = level;
        if (level > edgeMap[key].maxLevel) edgeMap[key].maxLevel = level;
        edgeMap[key].count += 1;
      }
    }

    var borderFeatures = [];
    for (var k in edgeMap) {
      var entry = edgeMap[k];
      // Interior border: shared by exactly two tiles, one level-0 and one level>0.
      // Outer boundary: the edge belongs to only one tile in the viewport (count===1)
      // because the neighbouring tile lies outside the rendered disk – that
      // neighbour is implicitly unvisited (level 0), so the edge is still a border.
      var isInteriorBorder = entry.count === 2 && entry.minLevel === 0 && entry.maxLevel > 0;
      var isOuterBorder = entry.count === 1 && entry.maxLevel > 0;
      if (isInteriorBorder || isOuterBorder) {
        borderFeatures.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: entry.coords },
          properties: {},
        });
      }
    }

    return { type: 'FeatureCollection', features: borderFeatures };
  }

  // ── Build GeoJSON FeatureCollection of hex polygon centroids ─────────────
  // Computes the centroid of each polygon by averaging its vertices (excluding
  // the closing duplicate). The result is a Point feature at the exact centre
  // of each hex tile, used to render a small purple dot per hexagon.
  function buildCentersGeoJson(features) {
    var points = [];
    for (var i = 0; i < features.length; i++) {
      var feature = features[i];
      var ring = feature.geometry && feature.geometry.coordinates && feature.geometry.coordinates[0];
      if (!ring || ring.length < 2) continue;
      // Polygon rings are closed (last === first); exclude the last vertex.
      var n = ring.length - 1;
      var sumLng = 0, sumLat = 0;
      for (var j = 0; j < n; j++) {
        sumLng += ring[j][0];
        sumLat += ring[j][1];
      }
      points.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [sumLng / n, sumLat / n] },
        properties: {},
      });
    }
    return { type: 'FeatureCollection', features: points };
  }

  // ── Build GeoJSON FeatureCollection of midpoints between centre and corners ─
  // For each hex polygon, computes the centroid and then the midpoint between
  // the centroid and each of the 6 corner vertices. Each midpoint is assigned
  // one of six colours in order: red, orange, yellow, blue, white, black.
  function buildMidpointsGeoJson(features) {
    var points = [];
    for (var i = 0; i < features.length; i++) {
      var feature = features[i];
      var ring = feature.geometry && feature.geometry.coordinates && feature.geometry.coordinates[0];
      if (!ring || ring.length < 2) continue;
      // Polygon rings are closed (last === first); exclude the last vertex.
      var n = ring.length - 1;
      var sumLng = 0, sumLat = 0;
      for (var j = 0; j < n; j++) {
        sumLng += ring[j][0];
        sumLat += ring[j][1];
      }
      var centerLng = sumLng / n;
      var centerLat = sumLat / n;
      for (var j = 0; j < n; j++) {
        var color = MIDPOINT_COLORS[j % MIDPOINT_COLORS.length];
        points.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [(centerLng + ring[j][0]) / 2, (centerLat + ring[j][1]) / 2],
          },
          properties: { midpointColor: color },
        });
      }
    }
    return { type: 'FeatureCollection', features: points };
  }

  // ── Measure route layer ───────────────────────────────────────────────────
  // Draws the tapped waypoints (circles) and connecting polyline for measure mode.
  function updateMeasureRouteLayer(coords) {
    if (!map) return;
    var fc = {
      type: 'FeatureCollection',
      features: coords && coords.length >= 2 ? [{
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
        properties: {}
      }] : []
    };
    if (map.getSource(MEASURE_ROUTE_SOURCE)) {
      map.getSource(MEASURE_ROUTE_SOURCE).setData(fc);
    } else {
      map.addSource(MEASURE_ROUTE_SOURCE, { type: 'geojson', data: fc });
      map.addLayer({
        id: MEASURE_ROUTE_LAYER,
        type: 'line',
        source: MEASURE_ROUTE_SOURCE,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': MEASURE_ROUTE_COLOR,
          'line-width': 3,
          'line-dasharray': [2, 1],
          'line-opacity': 0.9,
        }
      });
    }
  }

  function updateMeasurePointsLayer(points) {
    if (!map) return;
    var features = (points || []).map(function(p) {
      return { type: 'Feature', geometry: { type: 'Point', coordinates: p }, properties: {} };
    });
    var fc = { type: 'FeatureCollection', features: features };
    if (map.getSource(MEASURE_POINTS_SOURCE)) {
      map.getSource(MEASURE_POINTS_SOURCE).setData(fc);
    } else {
      map.addSource(MEASURE_POINTS_SOURCE, { type: 'geojson', data: fc });
      map.addLayer({
        id: MEASURE_POINTS_LAYER,
        type: 'circle',
        source: MEASURE_POINTS_SOURCE,
        paint: {
          'circle-radius': 6,
          'circle-color': MEASURE_ROUTE_COLOR,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 1,
        }
      });
    }
  }

  // ── Notify React Native about the current viewport ────────────────────────
  function notifyViewport() {
    if (!hexTileActive || !map) return;
    var bounds = map.getBounds();
    sendToRN({
      tag: 'MapViewportChanged',
      bounds: {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      },
      zoom: map.getZoom(),
    });
  }

  // ── Layer management ──────────────────────────────────────────────────────
  // ── Route edit overlay layers ─────────────────────────────────────────────
  // Added lazily when the first routeEditLabels/routeEditNeighbors message
  // arrives so they are always rendered on top of the base hex tile layers.
  function addRouteEditLayers() {
    if (!map || map.getSource(ROUTE_EDIT_NEIGHBOR_SOURCE)) return;
    map.addSource(ROUTE_EDIT_NEIGHBOR_SOURCE, { type: 'geojson', data: EMPTY_FC });
    map.addLayer({
      id: ROUTE_EDIT_NEIGHBOR_FILL_LAYER,
      type: 'fill',
      source: ROUTE_EDIT_NEIGHBOR_SOURCE,
      paint: {
        'fill-color': '#3b82f6',
        'fill-opacity': 0.45,
      },
    });
    map.addLayer({
      id: ROUTE_EDIT_NEIGHBOR_STROKE_LAYER,
      type: 'line',
      source: ROUTE_EDIT_NEIGHBOR_SOURCE,
      paint: {
        'line-color': '#1d4ed8',
        'line-width': 2,
        'line-opacity': 0.9,
      },
    });
    map.addSource(ROUTE_EDIT_LABELS_SOURCE, { type: 'geojson', data: EMPTY_FC });
    map.addLayer({
      id: ROUTE_EDIT_LABELS_LAYER,
      type: 'symbol',
      source: ROUTE_EDIT_LABELS_SOURCE,
      layout: {
        'text-field': ['get', 'label'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 9, 12, 13, 18, 16, 24],
        'text-anchor': 'center',
        'text-allow-overlap': true,
        'text-ignore-placement': true,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 2,
      },
    });
  }

  function removeRouteEditLayers() {
    if (!map) return;
    if (map.getLayer(ROUTE_EDIT_LABELS_LAYER)) map.removeLayer(ROUTE_EDIT_LABELS_LAYER);
    if (map.getSource(ROUTE_EDIT_LABELS_SOURCE)) map.removeSource(ROUTE_EDIT_LABELS_SOURCE);
    if (map.getLayer(ROUTE_EDIT_NEIGHBOR_STROKE_LAYER)) map.removeLayer(ROUTE_EDIT_NEIGHBOR_STROKE_LAYER);
    if (map.getLayer(ROUTE_EDIT_NEIGHBOR_FILL_LAYER)) map.removeLayer(ROUTE_EDIT_NEIGHBOR_FILL_LAYER);
    if (map.getSource(ROUTE_EDIT_NEIGHBOR_SOURCE)) map.removeSource(ROUTE_EDIT_NEIGHBOR_SOURCE);
  }

  function addHexTileLayer() {
    if (!map || map.getSource(HEX_TILE_SOURCE)) return;
    map.addSource(HEX_TILE_SOURCE, { type: 'geojson', data: EMPTY_FC });
    map.addLayer({
      id: HEX_TILE_FILL_LAYER,
      type: 'fill',
      source: HEX_TILE_SOURCE,
      paint: {
        'fill-color': ['case',
          ['has', 'colorIndex'],
          ['match', ['get', 'colorIndex'],
            0, '#ffffff',
            1, '#ef4444',
            2, '#eab308',
            3, '#22c55e',
            4, '#3b82f6',
            5, '#a855f7',
            6, '#f97316',
            '#ffffff'
          ],
          ['case',
            ['==', ['get', 'level'], 0], hexTileColor,
            ['interpolate', ['linear'], ['get', 'level'],
              1, HEX_COLOR_LEVEL_MIN,
              10, HEX_COLOR_LEVEL_MAX
            ]
          ]
        ],
        'fill-opacity': ['case',
          ['has', 'colorIndex'],
          0.75,
          ['case',
            ['==', ['get', 'level'], 0], 0,
            ['interpolate', ['linear'], ['get', 'level'],
              1, HEX_OPACITY_LEVEL_MIN,
              10, HEX_OPACITY_LEVEL_MAX
            ]
          ]
        ],
      },
    });
    map.addLayer({
      id: HEX_TILE_STROKE_LAYER,
      type: 'line',
      source: HEX_TILE_SOURCE,
      paint: {
        'line-color': hexTileStrokeColor,
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 1.4, 12, 1.0, 15, 0.7],
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0.5, 12, 0.4, 15, 0.3],
      },
    });
    // Territory border: separate source/layer for thick dark boundary lines
    map.addSource(HEX_BORDER_SOURCE, { type: 'geojson', data: EMPTY_FC });
    map.addLayer({
      id: HEX_BORDER_LAYER,
      type: 'line',
      source: HEX_BORDER_SOURCE,
      paint: {
        'line-color': HEX_BORDER_COLOR,
        'line-width': HEX_BORDER_WIDTH,
        'line-opacity': HEX_BORDER_OPACITY,
      },
    });
    // Walk path: sandy brown lines connecting centres of adjacent visited tiles
    map.addSource(HEX_WALK_PATH_SOURCE, { type: 'geojson', data: EMPTY_FC });
    map.addLayer({
      id: HEX_WALK_PATH_LAYER,
      type: 'line',
      source: HEX_WALK_PATH_SOURCE,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': WALK_PATH_COLOR,
        'line-width': WALK_PATH_WIDTH,
        'line-opacity': 1,
      },
    });
    // Hex tile corner vertices: green dots at every polygon vertex
    map.addSource(HEX_VERTICES_SOURCE, { type: 'geojson', data: EMPTY_FC });
    map.addLayer({
      id: HEX_VERTICES_LAYER,
      type: 'circle',
      source: HEX_VERTICES_SOURCE,
      layout: { visibility: hexDebugPointsVisible ? 'visible' : 'none' },
      paint: {
        'circle-radius': 4,
        'circle-color': '#22c55e',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#166534',
        'circle-opacity': 0.9,
      },
    });
    // Hex tile centres: small purple dot at the exact centre of each hexagon
    map.addSource(HEX_CENTERS_SOURCE, { type: 'geojson', data: EMPTY_FC });
    map.addLayer({
      id: HEX_CENTERS_LAYER,
      type: 'circle',
      source: HEX_CENTERS_SOURCE,
      layout: { visibility: hexDebugPointsVisible ? 'visible' : 'none' },
      paint: {
        'circle-radius': 5,
        'circle-color': '#a855f7',
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#6b21a8',
        'circle-opacity': 0.9,
      },
    });
    // Hex tile midpoints: coloured dots halfway between centre and each corner
    // Colours cycle through red, orange, yellow, blue, white, black per vertex.
    map.addSource(HEX_MIDPOINTS_SOURCE, { type: 'geojson', data: EMPTY_FC });
    map.addLayer({
      id: HEX_MIDPOINTS_LAYER,
      type: 'circle',
      source: HEX_MIDPOINTS_SOURCE,
      layout: { visibility: hexDebugPointsVisible ? 'visible' : 'none' },
      paint: {
        'circle-radius': 4,
        'circle-color': ['get', 'midpointColor'],
        'circle-stroke-width': 1,
        'circle-stroke-color': 'rgba(0, 0, 0, 0.5)',
        'circle-opacity': 0.9,
      },
    });
    // Raise any route track / segment layers above the hex tile layers so the
    // GPS route is always rendered on top of the hex grid.  These layers are
    // created lazily (only once the first routeCoordinates message arrives), so
    // they may not exist yet – the guard keeps this a no-op in that case.
    var ROUTE_LAYER_IDS = [
      'route-track-layer-border',
      'route-track-layer',
      'route-seg-border-layer',
      'route-seg-color-layer',
    ];
    for (var ri = 0; ri < ROUTE_LAYER_IDS.length; ri++) {
      if (map.getLayer(ROUTE_LAYER_IDS[ri])) map.moveLayer(ROUTE_LAYER_IDS[ri]);
    }
    // Raise the billboard 3D layer above hex tile layers so billboards are
    // always rendered on top of the grid, even after hex tile layer recreation.
    // NOTE: Must match BILLBOARD_LAYER_ID in the MapLibre HTML (index.html).
    var BILLBOARD_LAYER_REF = 'billboard-3d-layer';
    if (map.getLayer(BILLBOARD_LAYER_REF)) {
      map.moveLayer(BILLBOARD_LAYER_REF);
    }
    notifyViewport();
  }

  function removeHexTileLayer() {
    if (!map) return;
    if (map.getLayer(HEX_CENTERS_LAYER)) map.removeLayer(HEX_CENTERS_LAYER);
    if (map.getSource(HEX_CENTERS_SOURCE)) map.removeSource(HEX_CENTERS_SOURCE);
    if (map.getLayer(HEX_MIDPOINTS_LAYER)) map.removeLayer(HEX_MIDPOINTS_LAYER);
    if (map.getSource(HEX_MIDPOINTS_SOURCE)) map.removeSource(HEX_MIDPOINTS_SOURCE);
    if (map.getLayer(HEX_VERTICES_LAYER)) map.removeLayer(HEX_VERTICES_LAYER);
    if (map.getSource(HEX_VERTICES_SOURCE)) map.removeSource(HEX_VERTICES_SOURCE);
    if (map.getLayer(HEX_WALK_PATH_LAYER)) map.removeLayer(HEX_WALK_PATH_LAYER);
    if (map.getSource(HEX_WALK_PATH_SOURCE)) map.removeSource(HEX_WALK_PATH_SOURCE);
    if (map.getLayer(HEX_BORDER_LAYER)) map.removeLayer(HEX_BORDER_LAYER);
    if (map.getSource(HEX_BORDER_SOURCE)) map.removeSource(HEX_BORDER_SOURCE);
    if (map.getLayer(HEX_TILE_STROKE_LAYER)) map.removeLayer(HEX_TILE_STROKE_LAYER);
    if (map.getLayer(HEX_TILE_FILL_LAYER)) map.removeLayer(HEX_TILE_FILL_LAYER);
    if (map.getSource(HEX_TILE_SOURCE)) map.removeSource(HEX_TILE_SOURCE);
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
  };

  window._mapExtensions.onMessage = function (data) {
    if (data.hexTileLayer !== undefined) {
      if (data.hexTileLayer) {
        if (data.hexTileLayer.color) hexTileColor = data.hexTileLayer.color;
        if (data.hexTileLayer.strokeColor) hexTileStrokeColor = data.hexTileLayer.strokeColor;
        hexTileActive = true;
        removeHexTileLayer();
        addHexTileLayer();
      } else {
        hexTileActive = false;
        removeHexTileLayer();
      }
      return;
    }
    if (data.hexTileGeoJson !== undefined) {
      if (!hexTileActive) return;
      var src = map && map.getSource(HEX_TILE_SOURCE);
      var fc = data.hexTileGeoJson || EMPTY_FC;
      if (src) src.setData(fc);
      // Recompute territory border edges whenever tile data changes
      var borderSrc = map && map.getSource(HEX_BORDER_SOURCE);
      if (borderSrc) borderSrc.setData(buildBorderEdges(fc.features || []));
      // Update green corner-vertex dots
      var verticesSrc = map && map.getSource(HEX_VERTICES_SOURCE);
      if (verticesSrc) verticesSrc.setData(buildVerticesGeoJson(fc.features || []));
      // Update purple centre dots
      var centersSrc = map && map.getSource(HEX_CENTERS_SOURCE);
      if (centersSrc) centersSrc.setData(buildCentersGeoJson(fc.features || []));
      // Update midpoint dots between centre and each corner
      var midpointsSrc = map && map.getSource(HEX_MIDPOINTS_SOURCE);
      if (midpointsSrc) midpointsSrc.setData(buildMidpointsGeoJson(fc.features || []));
    }
    if (data.hexWalkPathGeoJson !== undefined) {
      if (!hexTileActive) return;
      var walkSrc = map && map.getSource(HEX_WALK_PATH_SOURCE);
      if (walkSrc) walkSrc.setData(data.hexWalkPathGeoJson || EMPTY_FC);
    }
    if (data.hexDebugPoints !== undefined) {
      hexDebugPointsVisible = data.hexDebugPoints;
      var visibility = hexDebugPointsVisible ? 'visible' : 'none';
      var debugLayers = [HEX_VERTICES_LAYER, HEX_CENTERS_LAYER, HEX_MIDPOINTS_LAYER];
      for (var di = 0; di < debugLayers.length; di++) {
        if (map && map.getLayer(debugLayers[di])) {
          map.setLayoutProperty(debugLayers[di], 'visibility', visibility);
        }
      }
    }
    if (data.routeEditLabels !== undefined) {
      if (!map) return;
      if (!map.getSource(ROUTE_EDIT_LABELS_SOURCE)) addRouteEditLayers();
      var editLabelsSrc = map.getSource(ROUTE_EDIT_LABELS_SOURCE);
      if (editLabelsSrc) editLabelsSrc.setData(data.routeEditLabels || EMPTY_FC);
      // Clearing labels also clears neighbors (edit mode exited)
      if (!data.routeEditLabels) {
        var clearNeighborSrc = map.getSource(ROUTE_EDIT_NEIGHBOR_SOURCE);
        if (clearNeighborSrc) clearNeighborSrc.setData(EMPTY_FC);
      }
      return;
    }
    if (data.routeEditNeighbors !== undefined) {
      if (!map) return;
      if (!map.getSource(ROUTE_EDIT_NEIGHBOR_SOURCE)) addRouteEditLayers();
      var editNeighborSrc = map.getSource(ROUTE_EDIT_NEIGHBOR_SOURCE);
      if (editNeighborSrc) editNeighborSrc.setData(data.routeEditNeighbors || EMPTY_FC);
      return;
    }
    if (data.measureMode !== undefined) {
      measureModeActive = data.measureMode;
      if (!measureModeActive) {
        updateMeasureRouteLayer([]);
        updateMeasurePointsLayer([]);
      }
    }
    if (data.measureRouteCoords !== undefined) {
      updateMeasureRouteLayer(data.measureRouteCoords);
    }
    if (data.measurePoints !== undefined) {
      updateMeasurePointsLayer(data.measurePoints);
    }
  };

  window._mapExtensions.onMapClick = function (e, m) {
    // Measure mode: capture tap coordinates and send back to React Native
    if (measureModeActive) {
      sendToRN({ tag: 'MapMeasurePoint', lat: e.lngLat.lat, lng: e.lngLat.lng });
      return true;
    }
    // Route edit neighbor layer takes priority: tapping a highlighted candidate
    // tile fires HexNeighborClicked so the React Native side can insert it.
    if (m.getSource(ROUTE_EDIT_NEIGHBOR_SOURCE) && m.getLayer(ROUTE_EDIT_NEIGHBOR_FILL_LAYER)) {
      var neighborFeatures = m.queryRenderedFeatures(e.point, { layers: [ROUTE_EDIT_NEIGHBOR_FILL_LAYER] });
      if (neighborFeatures && neighborFeatures.length > 0) {
        var nProps = neighborFeatures[0].properties || {};
        sendToRN({ tag: 'HexNeighborClicked', h3Index: nProps.h3Index });
        return true;
      }
    }
    if (!hexTileActive || !m.getSource(HEX_TILE_SOURCE)) return false;
    var features = m.queryRenderedFeatures(e.point, { layers: [HEX_TILE_FILL_LAYER] });
    if (features && features.length > 0) {
      var props = features[0].properties || {};
      // Query all rendered features at the click point to collect underlying map info
      var allRendered = m.queryRenderedFeatures(e.point);
      var mapFeatures = [];
      for (var fi = 0; fi < allRendered.length; fi++) {
        var f = allRendered[fi];
        var fp = f.properties || {};
        if (fp.name || fp.highway || fp.waterway || fp.building || fp.natural || fp.landuse || fp.amenity) {
          mapFeatures.push({
            layerId: (f.layer && f.layer.id) || null,
            name: fp.name || fp['name:de'] || null,
            highway: fp.highway || null,
            waterway: fp.waterway || null,
            building: fp.building || null,
            natural: fp.natural || null,
            landuse: fp.landuse || null,
            amenity: fp.amenity || null,
          });
        }
      }
      sendToRN({ tag: 'HexTileClicked', h3Index: props.h3Index, mapFeatures: mapFeatures });
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
