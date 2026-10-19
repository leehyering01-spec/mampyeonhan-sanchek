'use client';

import { useEffect, useRef, useState } from 'react';
import {
  fetchStrollerRoute,
  type MapPoint,
  type RouteStats,
} from '../lib/walkMetrics';

export type { MapPoint };

type NavMapProps = {
  mode: 'preview' | 'navigate';
  origin: MapPoint;
  destination: MapPoint;
  destinationName: string;
  current?: MapPoint | null;
  heading?: number | null;
  className?: string;
  onRouteInfo?: (info: RouteStats | null) => void;
};

type MapLibreMap = {
  remove: () => void;
  resize: () => void;
  setCenter: (c: [number, number]) => void;
  setZoom: (z: number) => void;
  setBearing: (b: number) => void;
  setPitch: (p: number) => void;
  easeTo: (opts: Record<string, unknown>) => void;
  fitBounds: (b: [[number, number], [number, number]], opts?: Record<string, unknown>) => void;
  getSource: (id: string) => { setData: (data: unknown) => void } | undefined;
  addSource: (id: string, source: unknown) => void;
  addLayer: (layer: unknown) => void;
  getLayer: (id: string) => unknown;
  loaded: () => boolean;
  on: (event: string, cb: () => void) => void;
};

type MapLibreNS = {
  Map: new (opts: Record<string, unknown>) => MapLibreMap;
  Marker: new (opts?: Record<string, unknown>) => MapLibreMarker;
}

type MapLibreMarker = {
  setLngLat: (lngLat: [number, number]) => MapLibreMarker;
  setRotation: (deg: number) => MapLibreMarker;
  addTo: (map: MapLibreMap) => MapLibreMarker;
  remove: () => void;
  getElement: () => HTMLElement;
};

declare global {
  interface Window {
    maplibregl?: MapLibreNS;
  }
}

let loader: Promise<MapLibreNS> | null = null;

function loadMapLibre(): Promise<MapLibreNS> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('no window'));
  }
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  if (loader) return loader;

  loader = new Promise((resolve, reject) => {
    const existingCss = document.querySelector('link[data-maplibre]');
    if (!existingCss) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/vendor/maplibre/maplibre-gl.css';
      link.setAttribute('data-maplibre', '1');
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector('script[data-maplibre]');
    if (existingScript && window.maplibregl) {
      resolve(window.maplibregl);
      return;
    }

    const script = document.createElement('script');
    script.src = '/vendor/maplibre/maplibre-gl.js';
    script.async = true;
    script.setAttribute('data-maplibre', '1');
    script.onload = () => {
      if (window.maplibregl) resolve(window.maplibregl);
      else reject(new Error('maplibre failed to load'));
    };
    script.onerror = () => reject(new Error('maplibre script error'));
    document.head.appendChild(script);
  });

  return loader;
}

async function fetchFootRoute(from: MapPoint, to: MapPoint): Promise<RouteStats | null> {
  return fetchStrollerRoute(from, to);
}

function styleSpec() {
  return {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenStreetMap',
        maxzoom: 19,
      },
    },
    layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
  };
}

function ensureRouteLayer(map: MapLibreMap, coordinates: [number, number][]) {
  const data = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates },
  };
  const source = map.getSource('route');
  if (source) {
    source.setData(data);
    return;
  }
  map.addSource('route', { type: 'geojson', data });
  map.addLayer({
    id: 'route-line-casing',
    type: 'line',
    source: 'route',
    paint: {
      'line-color': '#ffffff',
      'line-width': 10,
      'line-opacity': 0.9,
    },
    layout: { 'line-cap': 'round', 'line-join': 'round' },
  });
  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route',
    paint: {
      'line-color': '#2f7bff',
      'line-width': 6,
      'line-opacity': 1,
    },
    layout: { 'line-cap': 'round', 'line-join': 'round' },
  });
}

function pointAlong(
  coordinates: [number, number][],
  ratio: number,
): [number, number] | null {
  if (!coordinates.length) return null;
  const idx = Math.min(
    coordinates.length - 1,
    Math.max(0, Math.round((coordinates.length - 1) * ratio)),
  );
  return coordinates[idx];
}

function syncHazardMarkers(
  maplibregl: MapLibreNS,
  map: MapLibreMap,
  route: RouteStats,
  markers: Array<{ remove: () => void }>,
) {
  markers.splice(0).forEach((marker) => marker.remove());
  const specs: Array<{ kind: string; ratio: number; count: number }> = [
    { kind: 'crosswalk', ratio: 0.28, count: route.crosswalks },
    { kind: 'stairs', ratio: 0.52, count: route.stairs },
    { kind: 'slope', ratio: 0.74, count: route.slopes },
  ];
  for (const spec of specs) {
    if (spec.count <= 0) continue;
    const lngLat = pointAlong(route.coordinates, spec.ratio);
    if (!lngLat) continue;
    const el = document.createElement('div');
    el.className = `nav-hazard-dot ${spec.kind}`;
    markers.push(
      new maplibregl.Marker({ element: el }).setLngLat(lngLat).addTo(map) as unknown as {
        remove: () => void;
      },
    );
  }
}

export default function NavMap({
  mode,
  origin,
  destination,
  destinationName,
  current = null,
  heading = null,
  className,
  onRouteInfo,
}: NavMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const userMarkerRef = useRef<{
    remove: () => void;
    setLngLat: (v: [number, number]) => unknown;
    setRotation: (d: number) => unknown;
    getElement: () => HTMLElement;
  } | null>(null);
  const destMarkerRef = useRef<{ remove: () => void } | null>(null);
  const hazardMarkersRef = useRef<Array<{ remove: () => void }>>([]);
  const mapLibreRef = useRef<MapLibreNS | null>(null);
  const onRouteInfoRef = useRef(onRouteInfo);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    onRouteInfoRef.current = onRouteInfo;
  }, [onRouteInfo]);

  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | null = null;

    const boot = async () => {
      if (!containerRef.current) return;
      try {
        const maplibregl = await loadMapLibre();
        if (cancelled || !containerRef.current) return;
        mapLibreRef.current = maplibregl;

        map = new maplibregl.Map({
          container: containerRef.current,
          style: styleSpec(),
          center: [origin.longitude, origin.latitude],
          zoom: mode === 'navigate' ? 17 : 15,
          pitch: mode === 'navigate' ? 55 : 0,
          bearing: 0,
          attributionControl: true,
        });
        mapRef.current = map;

        map.on('load', () => {
          if (cancelled) return;
          setReady(true);
          map?.resize();
        });

        const destEl = document.createElement('div');
        destEl.className = 'nav-dest-marker';
        destEl.title = destinationName;
        destEl.innerHTML = '<span>도착</span>';
        destMarkerRef.current = new maplibregl.Marker({ element: destEl })
          .setLngLat([destination.longitude, destination.latitude])
          .addTo(map) as unknown as { remove: () => void };

        const userEl = document.createElement('div');
        userEl.className = 'nav-user-marker';
        userEl.innerHTML = '<div class="nav-user-cone"></div><div class="nav-user-dot"></div>';
        userMarkerRef.current = new maplibregl.Marker({ element: userEl })
          .setLngLat([
            (current ?? origin).longitude,
            (current ?? origin).latitude,
          ])
          .addTo(map) as unknown as {
          remove: () => void;
          setLngLat: (v: [number, number]) => unknown;
          setRotation: (d: number) => unknown;
          getElement: () => HTMLElement;
        };
      } catch (bootError) {
        setError('지도를 불러오지 못했어요.');
        console.error(bootError);
      }
    };

    void boot();

    return () => {
      cancelled = true;
      userMarkerRef.current?.remove();
      destMarkerRef.current?.remove();
      hazardMarkersRef.current.splice(0).forEach((marker) => marker.remove());
      mapRef.current?.remove();
      userMarkerRef.current = null;
      destMarkerRef.current = null;
      mapLibreRef.current = null;
      mapRef.current = null;
      setReady(false);
    };
    // Map instance is created once per mount; route/position updates happen below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, origin.latitude, origin.longitude, destination.latitude, destination.longitude, destinationName]);

  // Always route from the chosen complex entrance → destination.
  // Do not re-route from live GPS (that can send walkers over hills/parks).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const from = origin;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const route = await fetchFootRoute(from, destination);
      if (cancelled) return;
      onRouteInfoRef.current?.(route);

      if (route?.coordinates?.length) {
        ensureRouteLayer(map, route.coordinates);
        const maplibregl = mapLibreRef.current;
        if (maplibregl && mode === 'navigate') {
          syncHazardMarkers(maplibregl, map, route, hazardMarkersRef.current);
        }
        if (mode === 'preview') {
          const lngs = route.coordinates.map((c) => c[0]);
          const lats = route.coordinates.map((c) => c[1]);
          map.fitBounds(
            [
              [Math.min(...lngs), Math.min(...lats)],
              [Math.max(...lngs), Math.max(...lats)],
            ],
            { padding: 48, duration: 600, pitch: 0 },
          );
        }
      } else {
        hazardMarkersRef.current.splice(0).forEach((marker) => marker.remove());
        ensureRouteLayer(map, [
          [from.longitude, from.latitude],
          [destination.longitude, destination.latitude],
        ]);
        onRouteInfoRef.current?.(null);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    ready,
    mode,
    origin.latitude,
    origin.longitude,
    destination.latitude,
    destination.longitude,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = userMarkerRef.current;
    if (!map || !ready || !marker) return;

    const point = current ?? origin;
    marker.setLngLat([point.longitude, point.latitude]);
    if (typeof heading === 'number') {
      try {
        marker.setRotation(heading);
      } catch {
        marker.getElement().style.transform = `rotate(${heading}deg)`;
      }
    }

    if (mode === 'navigate') {
      const nextBearing = typeof heading === 'number' ? heading : 0;
      map.easeTo({
        center: [point.longitude, point.latitude],
        zoom: 17.5,
        pitch: 55,
        bearing: nextBearing,
        duration: 700,
      });
    }
  }, [
    ready,
    mode,
    current?.latitude,
    current?.longitude,
    origin.latitude,
    origin.longitude,
    heading,
  ]);

  useEffect(() => {
    const onResize = () => mapRef.current?.resize();
    window.addEventListener('resize', onResize);
    const timer = window.setTimeout(onResize, 120);
    return () => {
      window.removeEventListener('resize', onResize);
      window.clearTimeout(timer);
    };
  }, [ready]);

  return (
    <div className={`nav-map-shell ${className || ''}`}>
      <div ref={containerRef} className="nav-map-canvas" />
      {!ready && !error && <div className="nav-map-loading">지도 준비 중…</div>}
      {error && <div className="nav-map-loading">{error}</div>}
    </div>
  );
}
