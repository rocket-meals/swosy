# 3D Model Test Screen

Interactive viewer to browse and preview all 92 GLB models bundled with the Geonexia app.
Uses a Three.js scene rendered inside a React Native WebView.

---

## Bug: "Load error: [object XMLHttpRequestProgressEvent]"

### Symptom

Tapping any model in the list shows the status:

```
Load error: [object XMLHttpRequestProgressEvent]
```

### Root Cause

Three.js `GLTFLoader.load(url, onLoad, onProgress, **onError**)` uses XHR internally.
On Android, the WebView **blocks XHR requests to `file://` URLs** from JavaScript, even
when `allowFileAccess={true}` is set on the `<WebView>` component.

The loader's `onError` callback receives the raw XHR error event
(`XMLHttpRequestProgressEvent`), which has no `.message` property.
`String(event)` therefore produces the misleading string `[object XMLHttpRequestProgressEvent]`.

### Approaches Tried

| # | Approach | Result |
|---|----------|--------|
| 1 | Copy GLB to `cacheDir/model_viewer_v1/model.glb`, load HTML from same directory via `file://`, send `file://` URL to viewer | ❌ XHR blocked on Android → `[object XMLHttpRequestProgressEvent]` |
| 2 | Read GLB as base64 with `FileSystem.readAsStringAsync(..., { encoding: Base64 })`, send `data:model/gltf-binary;base64,...` URI to viewer | ✅ `loader.parse()` is called directly (no XHR) – works on Android & iOS |

### Fix Applied (Approach 2)

`loadModelToCache` in `index.tsx` was changed to:
1. Call `Asset.fromModule(moduleId).downloadAsync()` (unchanged).
2. Read `asset.localUri` as base64 using `expo-file-system`.
3. Return `data:model/gltf-binary;base64,<base64>` instead of a `file://` path.

The viewer HTML (`assets/modelViewer.html`) already had a code path for `data:` URIs that
calls `loader.parse(buffer, …)` directly – no XHR involved.

### Why the WebView still loads from `file://` (HTML only)

The HTML template is still written to
`{cacheDirectory}model_viewer_v1/index.html` and loaded via `{ uri: … }`.
This is required so Three.js's relative asset references (external textures / buffers
inside some GLB files) resolve to the same directory.
Since the models used here are self-contained GLBs with no external references,
this is not strictly necessary but kept for forward compatibility.

---

## Architecture

```
React Native (index.tsx)
  │  Asset.fromModule(id)  →  asset.localUri (bundled GLB)
  │  FileSystem.readAsStringAsync(localUri, Base64)
  │  → "data:model/gltf-binary;base64,..."
  │
  │  injectJavaScript  →  MessageEvent { loadModel: { url, name } }
  ▼
WebView (modelViewer.html)  –  Three.js + GLTFLoader
  │  url.startsWith('data:')  →  loader.parse(buffer)   ← no XHR
  │  otherwise                →  loader.load(url)        ← XHR (web only)
  │
  │  postMessage  →  { tag: 'ViewerReady' | 'modelLoaded' | 'error' | … }
  ▼
React Native handleMessage  →  status bar update
```
