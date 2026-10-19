/** Stroller-friendly walk metrics (Naver-like walking pace). */
export type MapPoint = { latitude: number; longitude: number };

/** ~3.75 km/h — matches Naver walk 2km ≈ 32min. */
export const STROLLER_METERS_PER_MIN = 2000 / 32;

/** Urban detour vs straight-line distance when route API is unavailable. */
export const STRAIGHT_TO_WALK_FACTOR = 1.6;

export const MAX_RECOMMEND_WALK_MINUTES = 20;

export const STEP_LENGTH_METERS = 0.7;

export type RouteStats = {
  distanceMeters: number;
  durationMinutes: number;
  steps: number;
  crosswalks: number;
  stairs: number;
  trafficLights: number;
  slopes: number;
  coordinates: [number, number][];
};

export function walkMinutesFromMeters(distanceMeters: number): number {
  return Math.max(1, Math.round(distanceMeters / STROLLER_METERS_PER_MIN));
}

export function estimateWalkMetersFromStraightKm(straightKm: number): number {
  return straightKm * 1000 * STRAIGHT_TO_WALK_FACTOR;
}

export function estimateWalkMinutesFromStraightKm(straightKm: number): number {
  return walkMinutesFromMeters(estimateWalkMetersFromStraightKm(straightKm));
}

export function formatKm(distanceMeters: number): string {
  const km = distanceMeters / 1000;
  if (km < 1) return `${Math.round(distanceMeters)}m`;
  return `${km.toFixed(1)}km`;
}

export function arrivalClockLabel(durationMinutes: number, now = new Date()): string {
  const arrival = new Date(now.getTime() + durationMinutes * 60_000);
  const hour = arrival.getHours();
  const minute = String(arrival.getMinutes()).padStart(2, '0');
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${period} ${displayHour}:${minute} 도착`;
}

/** Rough next-maneuver hint from route geometry (bearing change). */
export function nextTurnHint(
  coordinates: [number, number][],
  current: MapPoint | null,
): { label: '좌회전' | '우회전' | '직진' | '도착'; meters: number } | null {
  if (coordinates.length < 3) {
    if (!coordinates.length) return null;
    const end = coordinates[coordinates.length - 1];
    const from = current ?? { latitude: coordinates[0][1], longitude: coordinates[0][0] };
    const meters = Math.round(
      haversineMeters(from, { latitude: end[1], longitude: end[0] }),
    );
    return { label: meters < 40 ? '도착' : '직진', meters: Math.max(meters, 1) };
  }

  const startIdx = nearestIndex(coordinates, current);
  let turnIdx = -1;
  let turnLabel: '좌회전' | '우회전' | '직진' = '직진';
  for (let i = Math.max(startIdx, 1); i < coordinates.length - 1; i += 1) {
    const a = coordinates[i - 1];
    const b = coordinates[i];
    const c = coordinates[i + 1];
    const bearing1 = bearingDegrees(a, b);
    const bearing2 = bearingDegrees(b, c);
    let delta = bearing2 - bearing1;
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    if (Math.abs(delta) >= 35) {
      turnIdx = i;
      turnLabel = delta > 0 ? '우회전' : '좌회전';
      break;
    }
  }

  const from = current
    ? { latitude: current.latitude, longitude: current.longitude }
    : {
        latitude: coordinates[startIdx][1],
        longitude: coordinates[startIdx][0],
      };
  if (turnIdx < 0) {
    const end = coordinates[coordinates.length - 1];
    const meters = Math.round(
      haversineMeters(from, { latitude: end[1], longitude: end[0] }),
    );
    return { label: meters < 40 ? '도착' : '직진', meters: Math.max(meters, 1) };
  }
  const turn = coordinates[turnIdx];
  const meters = Math.round(
    haversineMeters(from, { latitude: turn[1], longitude: turn[0] }),
  );
  return { label: turnLabel, meters: Math.max(meters, 1) };
}

function haversineMeters(a: MapPoint, b: MapPoint): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const radius = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function bearingDegrees(a: [number, number], b: [number, number]): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const dLon = toRad(b[0] - a[0]);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function nearestIndex(coordinates: [number, number][], current: MapPoint | null): number {
  if (!current || coordinates.length === 0) return 0;
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < coordinates.length; i += 1) {
    const [lon, lat] = coordinates[i];
    const dist = haversineMeters(current, { latitude: lat, longitude: lon });
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

/** Remaining distance along a fixed entrance→destination polyline from GPS. */
export function remainingAlongRoute(
  coordinates: [number, number][],
  current: MapPoint | null,
): number {
  if (!coordinates.length) return 0;
  const startIdx = nearestIndex(coordinates, current);
  let meters = 0;
  for (let i = startIdx; i < coordinates.length - 1; i += 1) {
    meters += haversineMeters(
      { latitude: coordinates[i][1], longitude: coordinates[i][0] },
      { latitude: coordinates[i + 1][1], longitude: coordinates[i + 1][0] },
    );
  }
  return Math.round(meters);
}

export function stepsFromMeters(distanceMeters: number): number {
  return Math.max(0, Math.round(distanceMeters / STEP_LENGTH_METERS));
}

/** Destinations unsuitable for strollers (stairs / access). Manual + survey. */
export const STROLLER_BLOCKLIST: Record<string, string> = {
  dest_01_돌뫼어린이공원: '놀이터 출입 외 구간 계단 — 유모차 부적합',
};

export function isStrollerBlocked(destinationId: string): boolean {
  return Boolean(STROLLER_BLOCKLIST[destinationId]);
}

function sampleRoute(coordinates: [number, number][], maxPoints = 24): [number, number][] {
  if (coordinates.length <= maxPoints) return coordinates;
  const step = (coordinates.length - 1) / (maxPoints - 1);
  const samples: [number, number][] = [];
  for (let i = 0; i < maxPoints; i += 1) {
    samples.push(coordinates[Math.round(i * step)]);
  }
  return samples;
}

function routePolygon(coordinates: [number, number][], pad = 0.00025): string {
  const samples = sampleRoute(coordinates, 16);
  const lats = samples.map((c) => c[1]);
  const lngs = samples.map((c) => c[0]);
  const minLat = Math.min(...lats) - pad;
  const maxLat = Math.max(...lats) + pad;
  const minLng = Math.min(...lngs) - pad;
  const maxLng = Math.max(...lngs) + pad;
  // Overpass poly: lat lon pairs
  return `${minLat} ${minLng} ${minLat} ${maxLng} ${maxLat} ${maxLng} ${maxLat} ${minLng}`;
}

export async function countRouteHazards(
  coordinates: [number, number][],
): Promise<{ crosswalks: number; stairs: number; trafficLights: number; slopes: number }> {
  if (coordinates.length < 2) {
    return { crosswalks: 0, stairs: 0, trafficLights: 0, slopes: 0 };
  }
  const poly = routePolygon(coordinates);
  const query = `
[out:json][timeout:15];
(
  way(poly:"${poly}")["highway"="steps"];
  node(poly:"${poly}")["highway"="crossing"];
  way(poly:"${poly}")["footway"="crossing"];
  node(poly:"${poly}")["highway"="traffic_signals"];
  node(poly:"${poly}")["crossing"="traffic_signals"];
  way(poly:"${poly}")["incline"];
  way(poly:"${poly}")["highway"="path"]["incline"];
  way(poly:"${poly}")["ramp"];
);
out tags;
`;
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!response.ok) {
      return { crosswalks: 0, stairs: 0, trafficLights: 0, slopes: 0 };
    }
    const data = (await response.json()) as {
      elements?: Array<{ type: string; tags?: Record<string, string> }>;
    };
    let stairs = 0;
    let crosswalks = 0;
    let trafficLights = 0;
    let slopes = 0;
    for (const el of data.elements || []) {
      const tags = el.tags || {};
      if (tags.highway === 'steps') stairs += 1;
      else if (tags.highway === 'crossing' || tags.footway === 'crossing') crosswalks += 1;
      if (tags.highway === 'traffic_signals' || tags.crossing === 'traffic_signals') {
        trafficLights += 1;
      }
      if (tags.incline || tags.ramp === 'yes') slopes += 1;
    }
    return { crosswalks, stairs, trafficLights, slopes };
  } catch {
    return { crosswalks: 0, stairs: 0, trafficLights: 0, slopes: 0 };
  }
}

export async function fetchStrollerRoute(
  from: MapPoint,
  to: MapPoint,
): Promise<RouteStats | null> {
  const url =
    `https://router.project-osrm.org/route/v1/foot/` +
    `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
    `?overview=full&geometries=geojson`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = (await response.json()) as {
      routes?: Array<{
        distance: number;
        geometry: { coordinates: [number, number][] };
      }>;
    };
    const route = data.routes?.[0];
    if (!route) return null;
    const distanceMeters = route.distance;
    const hazards = await countRouteHazards(route.geometry.coordinates);
    return {
      distanceMeters,
      durationMinutes: walkMinutesFromMeters(distanceMeters),
      steps: stepsFromMeters(distanceMeters),
      crosswalks: hazards.crosswalks,
      stairs: hazards.stairs,
      trafficLights: hazards.trafficLights,
      slopes: hazards.slopes,
      coordinates: route.geometry.coordinates,
    };
  } catch {
    return null;
  }
}
