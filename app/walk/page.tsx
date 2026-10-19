'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import catalog from '../data/catalog.json';
import destinationsData from '../data/destinations.json';
import type { MapPoint } from '../components/NavMap';
import {
  arrivalClockLabel,
  estimateWalkMinutesFromStraightKm,
  formatKm,
  isStrollerBlocked,
  MAX_RECOMMEND_WALK_MINUTES,
  nextTurnHint,
  remainingAlongRoute,
  stepsFromMeters,
  walkMinutesFromMeters,
  type RouteStats,
} from '../lib/walkMetrics';
import {
  amenitiesForCategory,
  readProfile,
  writeProfile,
  type UserProfile,
} from '../lib/profile';
import OnboardingSlides from '../components/OnboardingSlides';
import SetupForm from '../components/SetupForm';
import RecommendCarousel from '../components/RecommendCarousel';

const NavMap = dynamic(() => import('../components/NavMap'), { ssr: false });

type Point = { latitude: number; longitude: number };
type Entrance = { id: string; name: string; location: Point };
type Complex = { id: string; name: string; entrances: Entrance[] };
type Destination = {
  destination_id: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lon: number;
  nearest_complex: string;
  straight_km: number;
  estimated_minutes: number;
  stroller_access: string;
  evidence: string;
};
type WalkValidation = {
  policy: typeof policy;
  elapsedSeconds: number;
  distanceMeters: number;
  remainingMeters: number | null;
  timeMet: boolean;
  distanceMet: boolean;
  arrivalMet: boolean;
  accuracyMeters: number | null;
};
type WalkRecord = {
  id: string;
  destinationId: string;
  destinationName: string;
  completedAt: string;
  durationSeconds: number;
  distanceMeters: number;
  rating?: number;
  note?: string;
  complexId?: string;
  entranceId?: string;
  validation?: WalkValidation;
};
type View =
  | 'onboarding'
  | 'setup'
  | 'home'
  | 'explore'
  | 'saved'
  | 'history'
  | 'mypage'
  | 'departure'
  | 'walk'
  | 'complete';
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
type GeoIssue = 'unsupported' | 'denied' | 'unavailable' | 'timeout' | null;

const complexes = catalog.residential_complexes as Complex[];
const destinations = destinationsData as Destination[];
const policy = catalog.validation_policy;

const storage = {
  saved: 'mampyeonhan:saved',
  records: 'mampyeonhan:records',
  complex: 'mampyeonhan:complex',
  visits: 'mampyeonhan:visits',
  validationLog: 'mampyeonhan:validation-log',
} as const;

const COMPLEX_LABELS: Record<string, string> = {
  raemian_lagrande: '래미안 라그란데',
  imun_ipark_xi: '이문 아이파크자이',
};

const COMPLEX_TO_NEAREST: Record<string, string> = {
  raemian_lagrande: '래미안 라그란데',
  imun_ipark_xi: '이문아이파크자이',
};

const readList = <T,>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as T[];
  } catch {
    return [];
  }
};

const radians = (value: number) => (value * Math.PI) / 180;
const distanceBetween = (a: Point, b: Point) => {
  const radius = 6371000;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const geoMessage = (issue: GeoIssue) => {
  switch (issue) {
    case 'unsupported':
      return '이 브라우저에서는 위치 기능을 사용할 수 없어요. HTTPS 모바일 브라우저에서 열어주세요.';
    case 'denied':
      return '위치 권한이 거부되었어요. 브라우저 설정에서 위치 접근을 허용한 뒤 다시 시도해주세요.';
    case 'timeout':
      return '위치를 제시간에 받지 못했어요. 야외에서 다시 시도해주세요.';
    case 'unavailable':
      return '위치를 확인할 수 없어요. 잠시 후 다시 시도해주세요.';
    default:
      return '목적지까지 길을 안내하고 있어요.';
  }
};

const canUseDom = () => typeof window !== 'undefined';

const isDevMode = () => {
  if (!canUseDom()) return false;
  return new URLSearchParams(window.location.search).get('dev') === '1';
};

export default function Home() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<View>('home');
  const [bootReady, setBootReady] = useState(false);
  const [complexId, setComplexId] = useState('raemian_lagrande');
  const [category, setCategory] = useState('전체');
  const [selected, setSelected] = useState<Destination | null>(null);
  const [entranceId, setEntranceId] = useState('');
  const [saved, setSaved] = useState<string[]>(() =>
    canUseDom() ? readList<string>(storage.saved) : [],
  );
  const [records, setRecords] = useState<WalkRecord[]>(() =>
    canUseDom() ? readList<WalkRecord>(storage.records) : [],
  );
  const [visits, setVisits] = useState(() =>
    canUseDom() ? Number(localStorage.getItem(storage.visits) || '0') : 0,
  );
  const [elapsed, setElapsed] = useState(0);
  const [walkDistance, setWalkDistance] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [routeRemaining, setRouteRemaining] = useState<number | null>(null);
  const [routeEta, setRouteEta] = useState<number | null>(null);
  const [routeSteps, setRouteSteps] = useState<number | null>(null);
  const [routeCrosswalks, setRouteCrosswalks] = useState<number | null>(null);
  const [routeStairs, setRouteStairs] = useState<number | null>(null);
  const [routeSlopes, setRouteSlopes] = useState<number | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [routeTotalMeters, setRouteTotalMeters] = useState<number | null>(null);
  const [showWalkMenu, setShowWalkMenu] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [geoIssue, setGeoIssue] = useState<GeoIssue>(null);
  const [walkStatus, setWalkStatus] = useState('현재 위치를 확인하고 있어요.');
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [exportNote, setExportNote] = useState('');
  const [devMode] = useState(() => isDevMode());

  const startedAt = useRef<number | null>(null);
  const previousPoint = useRef<Point | null>(null);
  const watchId = useRef<number | null>(null);
  const selectedRef = useRef<Destination | null>(null);
  const visitCounted = useRef(false);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    const nextProfile = readProfile();
    const storedComplex =
      nextProfile.complexId || localStorage.getItem(storage.complex) || 'raemian_lagrande';
    setProfile(nextProfile);
    setComplexId(storedComplex);
    if (!nextProfile.onboardingDone) setView('onboarding');
    else if (!nextProfile.setupDone) setView('setup');
    else setView('home');
    setBootReady(true);
  }, []);

  const stopWatch = useCallback(() => {
    if (watchId.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
    }
    watchId.current = null;
  }, []);

  useEffect(() => {
    if (!visitCounted.current) {
      visitCounted.current = true;
      const nextVisits = Number(localStorage.getItem(storage.visits) || '0') + 1;
      localStorage.setItem(storage.visits, String(nextVisits));
      setVisits(nextVisits);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    window.addEventListener('beforeinstallprompt', capturePrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', capturePrompt);
      stopWatch();
    };
  }, [stopWatch]);

  useEffect(() => {
    if (view !== 'walk' || !startedAt.current) return;
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current!) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [view]);

  const activeComplex = complexes.find((item) => item.id === complexId) ?? complexes[0];
  const activeEntrance = activeComplex.entrances.find((item) => item.id === entranceId);
  const categories = useMemo(
    () => ['전체', ...Array.from(new Set(destinations.map((item) => item.category)))],
    [],
  );

  const visible = useMemo(() => {
    const nearest = COMPLEX_TO_NEAREST[complexId];
    return destinations
      .filter((item) => {
        if (item.nearest_complex !== nearest) return false;
        if (isStrollerBlocked(item.destination_id)) return false;
        if (category !== '전체' && item.category !== category) return false;
        const walkMin = estimateWalkMinutesFromStraightKm(item.straight_km);
        return walkMin <= MAX_RECOMMEND_WALK_MINUTES;
      })
      .sort((a, b) => a.straight_km - b.straight_km);
  }, [category, complexId]);

  const applyRouteStats = (info: RouteStats | null) => {
    if (!info) {
      setRouteRemaining(null);
      setRouteTotalMeters(null);
      setRouteEta(null);
      setRouteSteps(null);
      setRouteCrosswalks(null);
      setRouteStairs(null);
      setRouteSlopes(null);
      setRouteCoordinates([]);
      return;
    }
    const total = Math.round(info.distanceMeters);
    setRouteTotalMeters(total);
    setRouteRemaining(total);
    setRouteEta(info.durationMinutes);
    setRouteSteps(info.steps);
    setRouteCrosswalks(info.crosswalks);
    setRouteStairs(info.stairs);
    setRouteSlopes(info.slopes);
    setRouteCoordinates(info.coordinates);
  };

  const savedDestinations = destinations
    .filter((item) => saved.includes(item.destination_id) && !isStrollerBlocked(item.destination_id))
    .sort((a, b) => a.straight_km - b.straight_km);

  const requirements = {
    time: elapsed >= policy.minimum_duration_minutes * 60,
    distance: walkDistance >= policy.minimum_distance_meters,
    arrival: remaining !== null && remaining <= policy.arrival_radius_meters,
  };

  useEffect(() => {
    if (view !== 'walk' || !routeCoordinates.length) return;
    const rem = remainingAlongRoute(routeCoordinates, currentPoint);
    setRouteRemaining(rem);
    setRouteEta(walkMinutesFromMeters(rem));
    setRouteSteps(stepsFromMeters(rem));
  }, [view, currentPoint, routeCoordinates]);

  const appendValidationLog = (entry: WalkValidation & { at: string; destinationId: string }) => {
    const log = readList<unknown>(storage.validationLog);
    const next = [entry, ...log].slice(0, 100);
    localStorage.setItem(storage.validationLog, JSON.stringify(next));
  };

  const toggleSaved = (id: string) => {
    const next = saved.includes(id)
      ? saved.filter((item) => item !== id)
      : [...saved, id];
    setSaved(next);
    localStorage.setItem(storage.saved, JSON.stringify(next));
  };

  const selectComplex = (id: string) => {
    setComplexId(id);
    localStorage.setItem(storage.complex, id);
    setCategory('전체');
    if (profile) {
      const next = { ...profile, complexId: id };
      setProfile(next);
      writeProfile(next);
    }
  };

  const finishOnboarding = () => {
    const next = {
      ...(profile || {
        nickname: '',
        birthYear: '',
        birthMonth: '',
        complexId,
        onboardingDone: false,
        setupDone: false,
      }),
      onboardingDone: true,
    };
    setProfile(next);
    writeProfile(next);
    setView('setup');
  };

  const finishSetup = (next: UserProfile) => {
    setProfile(next);
    writeProfile(next);
    setComplexId(next.complexId);
    localStorage.setItem(storage.complex, next.complexId);
    setView('home');
  };

  const resetOnboarding = () => {
    const next = {
      nickname: '',
      birthYear: '',
      birthMonth: '',
      complexId,
      onboardingDone: false,
      setupDone: false,
    };
    setProfile(next);
    writeProfile(next);
    setView('onboarding');
  };

  const requestInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
    } else {
      setShowInstallHelp(true);
    }
  };

  const chooseDestination = (item: Destination) => {
    setSelected(item);
    setEntranceId(activeComplex.entrances[0]?.id || '');
    setView('departure');
  };

  const beginWatch = useCallback(() => {
    stopWatch();
    setGeoIssue(null);
    previousPoint.current = null;
    setRemaining(null);
    setAccuracy(null);
    setCurrentPoint(null);
    setHeading(null);

    if (!navigator.geolocation) {
      setGeoIssue('unsupported');
      setWalkStatus(geoMessage('unsupported'));
      return;
    }

    setWalkStatus('현재 위치를 확인하고 있어요.');
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const dest = selectedRef.current;
        if (!dest) return;
        const point = { latitude: coords.latitude, longitude: coords.longitude };
        setAccuracy(coords.accuracy);
        setCurrentPoint(point);
        setGeoIssue(null);
        if (typeof coords.heading === 'number' && !Number.isNaN(coords.heading) && coords.heading >= 0) {
          setHeading(coords.heading);
        } else if (previousPoint.current) {
          const dLon = radians(point.longitude - previousPoint.current.longitude);
          const lat1 = radians(previousPoint.current.latitude);
          const lat2 = radians(point.latitude);
          const y = Math.sin(dLon) * Math.cos(lat2);
          const x =
            Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
          const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
          if (distanceBetween(previousPoint.current, point) > 4) setHeading(bearing);
        }

        if (coords.accuracy <= 100 && previousPoint.current) {
          const added = distanceBetween(previousPoint.current, point);
          if (added < 200) {
            setWalkDistance((value) => value + added);
          }
        }
        previousPoint.current = point;
        setRemaining(
          distanceBetween(point, { latitude: dest.lat, longitude: dest.lon }),
        );
        setWalkStatus(
          coords.accuracy > 100
            ? `GPS 정확도 ${Math.round(coords.accuracy)}m · 야외에서 잠시 기다려주세요.`
            : geoMessage(null),
        );
      },
      (error) => {
        const issue: GeoIssue =
          error.code === 1
            ? 'denied'
            : error.code === 3
              ? 'timeout'
              : 'unavailable';
        setGeoIssue(issue);
        setWalkStatus(geoMessage(issue));
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 },
    );
  }, [stopWatch]);

  const startWalk = () => {
    if (!selected || !activeEntrance) return;
    setElapsed(0);
    setWalkDistance(0);
    setRemaining(null);
    setRouteRemaining(null);
    setRouteEta(null);
    setRouteSteps(null);
    setRouteCrosswalks(null);
    setRouteStairs(null);
    setRouteSlopes(null);
    setRouteCoordinates([]);
    setRouteTotalMeters(null);
    setShowWalkMenu(false);
    startedAt.current = Date.now();
    setView('walk');
    beginWatch();
  };

  const leaveWalk = (next: View) => {
    stopWatch();
    setView(next);
  };

  const completeWalk = () => {
    if (!selected) return;
    stopWatch();
    const validation: WalkValidation = {
      policy,
      elapsedSeconds: elapsed,
      distanceMeters: Math.round(walkDistance),
      remainingMeters: remaining,
      timeMet: requirements.time,
      distanceMet: requirements.distance,
      arrivalMet: requirements.arrival,
      accuracyMeters: accuracy,
    };
    appendValidationLog({
      ...validation,
      at: new Date().toISOString(),
      destinationId: selected.destination_id,
    });
    const record: WalkRecord = {
      id: crypto.randomUUID(),
      destinationId: selected.destination_id,
      destinationName: selected.name,
      completedAt: new Date().toISOString(),
      durationSeconds: elapsed,
      distanceMeters: Math.round(walkDistance),
      complexId,
      entranceId,
      validation,
    };
    const next = [record, ...records];
    setRecords(next);
    localStorage.setItem(storage.records, JSON.stringify(next));
    setView('complete');
  };

  const updateReview = (recordId: string, patch: { rating?: number; note?: string }) => {
    const next = records.map((item) =>
      item.id === recordId ? { ...item, ...patch } : item,
    );
    setRecords(next);
    localStorage.setItem(storage.records, JSON.stringify(next));
  };

  const exportBetaData = async () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      visits,
      complexId,
      saved,
      records,
      validationLog: readList(storage.validationLog),
      policy,
    };
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setExportNote('베타 데이터를 클립보드에 복사했어요.');
    } catch {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `mampyeonhan-beta-${Date.now()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setExportNote('베타 데이터 파일을 내려받았어요.');
    }
    window.setTimeout(() => setExportNote(''), 3000);
  };

  const latestRecord = records[0];
  const policyLabel = `${policy.minimum_duration_minutes}분 · ${policy.minimum_distance_meters}m · 목적지 ${policy.arrival_radius_meters}m 이내`;
  const originPoint: MapPoint | null = activeEntrance
    ? {
        latitude: activeEntrance.location.latitude,
        longitude: activeEntrance.location.longitude,
      }
    : null;
  const destinationPoint: MapPoint | null = selected
    ? { latitude: selected.lat, longitude: selected.lon }
    : null;
  const displayName = profile?.nickname?.trim() || '보호자';
  const featured = visible.slice(0, 3);

  if (!bootReady) {
    return <main className="loading-shell">맘편한 산책을 준비 중이에요…</main>;
  }

  if (view === 'onboarding') {
    return <OnboardingSlides onDone={finishOnboarding} />;
  }

  if (view === 'setup') {
    return (
      <SetupForm
        complexes={complexes}
        labels={COMPLEX_LABELS}
        initial={
          profile || {
            nickname: '',
            birthYear: '',
            birthMonth: '',
            complexId,
            onboardingDone: true,
            setupDone: false,
          }
        }
        onSubmit={finishSetup}
      />
    );
  }

  if (view === 'departure' && selected && originPoint && destinationPoint) {
    return (
      <main className="app-shell subpage">
        <SubHeader title="출발지 확인" onBack={() => setView('home')} />
        <section className="page-content">
          <p className="eyebrow">{selected.name}까지</p>
          <h1 className="page-heading">어디에서 출발할까요?</h1>
          <p className="page-description">
            출입구를 고르면 현재 위치 기준으로 목적지까지 길을 안내해요.
          </p>
          <div className="entrance-list">
            {activeComplex.entrances.map((item) => (
              <button
                key={item.id}
                className={entranceId === item.id ? 'entrance active' : 'entrance'}
                onClick={() => setEntranceId(item.id)}
                type="button"
              >
                <span className="radio-dot" />
                <div>
                  <strong>{item.name}</strong>
                  <small>출발 기준점 · 좌표 확인됨</small>
                </div>
                <b>✓</b>
              </button>
            ))}
          </div>
          <NavMap
            mode="preview"
            className="map-preview-live"
            origin={originPoint}
            destination={destinationPoint}
            destinationName={selected.name}
            onRouteInfo={applyRouteStats}
          />
          {routeEta === null && (
            <div className="route-loading-banner inline" role="status" aria-live="polite">
              <span className="route-loading-spinner" aria-hidden />
              <div>
                <strong>경로를 찾고 있습니다</strong>
                <p>조금만 기다려 주세요</p>
              </div>
            </div>
          )}
          {routeEta !== null && routeRemaining !== null && (
            <>
              <div className="guide-metrics" aria-label="경로 요약">
                <div>
                  <strong>{routeEta}분</strong>
                  <span>남은 시간</span>
                </div>
                <div>
                  <strong>{formatKm(routeRemaining)}</strong>
                  <span>남은 거리</span>
                </div>
                <div>
                  <strong>{routeSteps ?? '--'}</strong>
                  <span>걸음</span>
                </div>
                <div>
                  <strong>{routeCrosswalks ?? 0}회</strong>
                  <span>횡단보도</span>
                </div>
                <div>
                  <strong>{routeStairs ?? 0}회</strong>
                  <span>계단</span>
                </div>
              </div>
              <div className="route-chip">
                <strong>예상 경로</strong>
                <span>
                  {routeEta}분 · {formatKm(routeRemaining)} · 횡단보도 {routeCrosswalks ?? 0}회
                </span>
              </div>
            </>
          )}
          {devMode && (
            <div className="dev-panel">
              <strong>DEV · 완료 기준</strong>
              <p>{policyLabel}</p>
              <p className="muted-line">추천은 유모차 보행 {MAX_RECOMMEND_WALK_MINUTES}분 이하만 노출</p>
            </div>
          )}
        </section>
        <div className="fixed-action">
          <button
            className="primary-button"
            onClick={startWalk}
            disabled={!entranceId}
            type="button"
          >
            맘편한 산책 시작!
          </button>
        </div>
      </main>
    );
  }

  if (view === 'walk' && selected && activeEntrance && originPoint && destinationPoint) {
    const turn = nextTurnHint(routeCoordinates, currentPoint);
    const turnIcon =
      turn?.label === '좌회전' ? '↰' : turn?.label === '우회전' ? '↱' : turn?.label === '도착' ? '◎' : '↑';
    const progress =
      routeTotalMeters && routeTotalMeters > 0 && routeRemaining !== null
        ? Math.min(
            0.98,
            Math.max(0.04, (routeTotalMeters - routeRemaining) / routeTotalMeters),
          )
        : 0.08;
    const etaLabel = routeEta !== null ? arrivalClockLabel(routeEta) : '도착 시간 확인 중';

    return (
      <main className="app-shell walk-guide">
        <div className="walk-map-layer">
          <NavMap
            mode="navigate"
            className="walk-map-fill"
            origin={originPoint}
            destination={destinationPoint}
            destinationName={selected.name}
            current={currentPoint}
            heading={heading}
            onRouteInfo={applyRouteStats}
          />
        </div>

        <button
          className="walk-back-chip"
          onClick={() => leaveWalk('departure')}
          type="button"
          aria-label="뒤로"
        >
          ‹
        </button>

        <section className="walk-top-card">
          <div className="walk-top-main">
            <strong className="walk-eta">
              {routeEta !== null ? `${routeEta}분` : '--분'}
            </strong>
            <p>남은 거리 {routeRemaining !== null ? formatKm(routeRemaining) : '--'}</p>
            <p>남은 걸음 {routeSteps !== null ? routeSteps.toLocaleString('ko-KR') : '--'}</p>
            <p className={geoIssue ? 'status-warn-text' : 'walk-status-line'}>{walkStatus}</p>
          </div>
          <div className="walk-turn">
            <div className="walk-turn-circle" aria-hidden>
              {turnIcon}
            </div>
            <span>{turn ? `${turn.meters}m` : '--'}</span>
          </div>
        </section>

        <aside className="walk-hazard-stack" aria-label="경로 주의">
          <span className="hazard-tag crosswalk">
            횡단보도 {routeCrosswalks ?? 0}회
          </span>
          <span className="hazard-tag stairs">계단 {routeStairs ?? 0}회</span>
          <span className="hazard-tag slope">경사 {routeSlopes ?? 0}번</span>
        </aside>

        {routeEta === null && (
          <div className="route-loading-banner" role="status" aria-live="polite">
            <span className="route-loading-spinner" aria-hidden />
            <div>
              <strong>경로를 찾고 있습니다</strong>
              <p>조금만 기다려 주세요</p>
            </div>
          </div>
        )}

        {geoIssue && (
          <div className="walk-geo-banner">
            <p>{geoMessage(geoIssue)}</p>
            <button onClick={beginWatch} type="button">
              다시 확인
            </button>
          </div>
        )}

        {devMode && (
          <div className="dev-panel walk-dev-panel">
            <strong>DEV · 검증 상태</strong>
            <Requirement
              label={`최소 산책 시간 ${policy.minimum_duration_minutes}분`}
              met={requirements.time}
              value={requirements.time ? '확인됨' : clock(elapsed)}
            />
            <Requirement
              label={`최소 이동 거리 ${policy.minimum_distance_meters}m`}
              met={requirements.distance}
              value={`${Math.round(walkDistance)}m`}
            />
            <Requirement
              label={`목적지 ${policy.arrival_radius_meters}m 이내`}
              met={requirements.arrival}
              value={
                remaining === null ? '확인 중' : `${Math.round(remaining)}m 남음`
              }
            />
          </div>
        )}

        <footer className="walk-bottom-bar">
          <div className="walk-bottom-row">
            <p>
              {routeEta !== null ? `${routeEta}분` : '--분'} |{' '}
              {routeRemaining !== null ? formatKm(routeRemaining) : '--'} | {etaLabel}
            </p>
            <button
              className="walk-menu-btn"
              type="button"
              aria-label="메뉴"
              onClick={() => setShowWalkMenu(true)}
            >
              ☰
            </button>
          </div>
          <button
            className="walk-complete-btn"
            onClick={completeWalk}
            type="button"
          >
            산책 완료
          </button>
          <div className="walk-progress-track" aria-hidden>
            <div className="walk-progress-fill" style={{ width: `${progress * 100}%` }} />
            <span className="walk-progress-dot" style={{ left: `${progress * 100}%` }}>
              ➤
            </span>
          </div>
        </footer>

        {showWalkMenu && (
          <div className="sheet-backdrop" onClick={() => setShowWalkMenu(false)}>
            <section
              className="detail-sheet walk-menu-sheet"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sheet-handle" />
              <h2>{selected.name}</h2>
              <p className="detail-address">{activeEntrance.name}에서 출발</p>
              <button
                className="primary-button"
                onClick={() => {
                  setShowWalkMenu(false);
                  completeWalk();
                }}
                type="button"
              >
                산책 완료
              </button>
              <button
                className="secondary-button"
                onClick={() => {
                  setShowWalkMenu(false);
                  leaveWalk('departure');
                }}
                type="button"
              >
                안내 종료
              </button>
            </section>
          </div>
        )}
      </main>
    );
  }

  if (view === 'complete' && selected && latestRecord) {
    return (
      <main className="app-shell subpage complete-page">
        <section className="complete-card">
          <div className="complete-icon">✓</div>
          <p className="eyebrow">산책 완료 · 이 기기에 저장됨</p>
          <h1>
            {selected.name}
            <br />
            다녀왔어요!
          </h1>
          <p>
            {Math.floor(elapsed / 60)}분 동안 {Math.round(walkDistance)}m를 걸었어요.
          </p>
          <div className="review-box">
            <strong>오늘 산책은 어땠나요?</strong>
            <div className="rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => updateReview(latestRecord.id, { rating: value })}
                  className={(latestRecord.rating || 0) >= value ? 'active' : ''}
                  type="button"
                  aria-label={`${value}점`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              placeholder="유모차로 걸으며 느낀 점을 남겨주세요."
              defaultValue={latestRecord.note}
              onBlur={(event) =>
                updateReview(latestRecord.id, { note: event.target.value })
              }
            />
          </div>
          <button className="primary-button" onClick={() => setView('history')} type="button">
            산책 기록 보기
          </button>
          <Link
            className="secondary-button"
            href={`/reviews/new?destination=${encodeURIComponent(selected.destination_id)}`}
          >
            후기 남기기
          </Link>
          <button className="text-button" onClick={() => setView('home')} type="button">
            홈으로
          </button>
        </section>
      </main>
    );
  }

  const list = view === 'saved' ? savedDestinations : visible;
  const emptyMessage =
    view === 'saved'
      ? '아직 저장한 장소가 없어요. 하트로 마음에 드는 목적지를 남겨보세요.'
      : category === '전체'
        ? '이 생활권에 표시할 목적지가 없어요.'
        : `'${category}' 카테고리 목적지가 없어요. 다른 필터를 골라보세요.`;
  const openFromCarousel = (id: string) => {
    const item = visible.find((d) => d.destination_id === id);
    if (item) setSelected(item);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <img className="brand-mark" src="/images/brand-mark.png" alt="" />
          <div className="brand-text">
            <h1>맘편한 산책</h1>
          </div>
        </div>
        <button className="install-chip" onClick={requestInstall} type="button">
          앱으로 설치
        </button>
      </header>

      {view === 'history' ? (
        <History
          records={records}
          visits={visits}
          onExport={exportBetaData}
          exportNote={exportNote}
          onUpdateReview={updateReview}
          showValidation={devMode}
        />
      ) : view === 'mypage' ? (
        <section className="content mypage">
          <div className="section-title">
            <div>
              <h2>마이페이지</h2>
              <p>프로필과 생활권 정보를 확인할 수 있어요.</p>
            </div>
          </div>
          <article className="profile-card">
            <p className="eyebrow">내 프로필</p>
            <h3>{displayName}님</h3>
            <p>
              아이 출생{' '}
              {profile?.birthYear && profile?.birthMonth
                ? `${profile.birthYear}년 ${profile.birthMonth}월`
                : '미입력'}
            </p>
            <p>생활권 {COMPLEX_LABELS[complexId] ?? activeComplex.name}</p>
            <p className="muted-line">이 기기 방문 {visits}회 · 저장 {saved.length}곳 · 완료 {records.length}회</p>
          </article>
          <button className="secondary-button" type="button" onClick={() => setView('setup')}>
            프로필·생활권 다시 설정
          </button>
          <button className="text-button" type="button" onClick={resetOnboarding}>
            온보딩 다시 보기
          </button>
          <button className="secondary-button" type="button" onClick={requestInstall}>
            앱으로 설치하기
          </button>
          <a className="secondary-button" href="/reviews">
            동네 후기 보기
          </a>
        </section>
      ) : view === 'home' ? (
        <>
          <section className="hero home-hero">
            <h2 className="hero-greeting">
              {displayName}님,
              <br />
              <span>오늘은 어디까지 천천히 걸어볼까요?</span>
            </h2>
            <p className="hero-sub">
              {COMPLEX_LABELS[complexId] ?? activeComplex.name} 기준 · 후보 {visible.length}곳
            </p>
            <div className="segmented" aria-label="생활권 선택">
              {complexes.map((item) => (
                <button
                  key={item.id}
                  className={complexId === item.id ? 'active' : ''}
                  onClick={() => selectComplex(item.id)}
                  type="button"
                >
                  {COMPLEX_LABELS[item.id] ?? item.name}
                </button>
              ))}
            </div>
          </section>
          <section className="content">
            <RecommendCarousel
              items={featured}
              onOpen={openFromCarousel}
              onSeeAll={() => setView('explore')}
            />
          </section>
        </>
      ) : (
        <>
          <section className="content">
            {view === 'explore' && (
              <button className="back-inline" type="button" onClick={() => setView('home')}>
                ‹ 오늘의 추천으로
              </button>
            )}
            <div className="section-title">
              <div>
                <h2>
                  {view === 'saved'
                    ? '저장한 산책지'
                    : view === 'explore'
                      ? '다른 추천 보기'
                      : '오늘의 산책'}
                </h2>
                <p>
                  {view === 'saved'
                    ? '다시 가고 싶은 장소를 모았어요.'
                    : `유모차 도보 ${MAX_RECOMMEND_WALK_MINUTES}분 이내 · 가까운 순`}
                </p>
              </div>
              <span>{list.length}곳</span>
            </div>
            {view === 'explore' && (
              <div className="filters">
                {categories.map((item) => (
                  <button
                    key={item}
                    className={category === item ? 'active' : ''}
                    onClick={() => setCategory(item)}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
            <DestinationList
              items={list}
              saved={saved}
              emptyMessage={emptyMessage}
              onSave={toggleSaved}
              onSelect={setSelected}
            />
          </section>
        </>
      )}

      <nav className="bottom-nav" aria-label="주 메뉴">
        <button
          className={view === 'home' || view === 'explore' ? 'active' : ''}
          onClick={() => setView('home')}
          type="button"
        >
          <span>⌂</span>홈
        </button>
        <button className={view === 'saved' ? 'active' : ''} onClick={() => setView('saved')} type="button">
          <span>♡</span>저장 {saved.length || ''}
        </button>
        <button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')} type="button">
          <span>◎</span>기록
        </button>
        <button className={view === 'mypage' ? 'active' : ''} onClick={() => setView('mypage')} type="button">
          <span>●</span>마이
        </button>
      </nav>

      {selected && view !== 'departure' && view !== 'walk' && view !== 'complete' && (
        <div className="sheet-backdrop" onClick={() => setSelected(null)}>
          <section className="detail-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-top">
              <button
                className="sheet-back"
                type="button"
                aria-label="돌아가기"
                onClick={() => setSelected(null)}
              >
                ‹
              </button>
              <div className="sheet-handle" />
              <span className="sheet-top-spacer" aria-hidden />
            </div>
            <div className="detail-image">
              <img src="/images/walk-photo.png" alt="" />
            </div>
            <p className="card-kicker">
              {selected.category} · 유모차 접근 {selected.stroller_access}
            </p>
            <h2>{selected.name}</h2>
            <p className="detail-address">{selected.address}</p>
            <div className="amenity-row">
              {amenitiesForCategory(selected.category).map((label) => (
                <span className="amenity-chip" key={label}>
                  {label}
                </span>
              ))}
            </div>
            <div className="route-info-panel">
              <div>
                <strong>유모차 도보</strong>
                <span>약 {estimateWalkMinutesFromStraightKm(selected.straight_km)}분</span>
              </div>
              <div>
                <strong>직선거리</strong>
                <span>{selected.straight_km.toFixed(2)}km</span>
              </div>
              <div>
                <strong>접근</strong>
                <span>{selected.stroller_access}</span>
              </div>
            </div>
            <p className="evidence">{selected.evidence}</p>
            <button
              className="primary-button"
              onClick={() => chooseDestination(selected)}
              type="button"
            >
              오늘 갈 곳으로 선택
            </button>
            <button
              className="secondary-button sheet-secondary"
              type="button"
              onClick={() => toggleSaved(selected.destination_id)}
            >
              {saved.includes(selected.destination_id) ? '저장됨' : '나중에 가기'}
            </button>
          </section>
        </div>
      )}

      {showInstallHelp && (
        <div className="sheet-backdrop" onClick={() => setShowInstallHelp(false)}>
          <section className="detail-sheet install-help" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <h2>홈 화면에 설치하기</h2>
            <ol>
              <li>Safari 아래의 공유 버튼을 눌러요.</li>
              <li>
                <b>홈 화면에 추가</b>를 선택해요.
              </li>
              <li>
                오른쪽 위 <b>추가</b>를 눌러요.
              </li>
            </ol>
            <button className="primary-button" onClick={() => setShowInstallHelp(false)} type="button">
              확인
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

function DestinationList({
  items,
  saved,
  emptyMessage,
  onSave,
  onSelect,
}: {
  items: Destination[];
  saved: string[];
  emptyMessage: string;
  onSave: (id: string) => void;
  onSelect: (item: Destination) => void;
}) {
  if (!items.length) return <div className="empty-state">{emptyMessage}</div>;
  return (
    <div className="destination-list">
      {items.map((item) => (
        <article className="destination-card" key={item.destination_id}>
          <button className="card-main" onClick={() => onSelect(item)} type="button">
            <div className={`category-mark ${item.category}`}>{item.category.slice(0, 2)}</div>
            <div>
              <div className="card-kicker">
                {item.category} · {item.stroller_access}
              </div>
              <h3>{item.name}</h3>
              <p>{item.address || '주소 확인 중'}</p>
              <div className="metrics">
                <span className="accent">
                  집에서 {estimateWalkMinutesFromStraightKm(item.straight_km)}분
                </span>
                <span>유모차 OK</span>
                <span>{item.straight_km.toFixed(2)}km</span>
              </div>
            </div>
          </button>
          <button
            aria-label={`${item.name} 저장`}
            className={`save-button ${saved.includes(item.destination_id) ? 'saved' : ''}`}
            onClick={() => onSave(item.destination_id)}
            type="button"
          >
            {saved.includes(item.destination_id) ? '♥' : '♡'}
          </button>
        </article>
      ))}
    </div>
  );
}

function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="sub-header">
      <button onClick={onBack} aria-label="뒤로" type="button">
        ‹
      </button>
      <h1>{title}</h1>
    </header>
  );
}

function Requirement({
  label,
  met,
  value,
}: {
  label: string;
  met: boolean;
  value: string;
}) {
  return (
    <div className="requirement">
      <span className={met ? 'met' : ''}>{met ? '✓' : ''}</span>
      <strong>{label}</strong>
      <small>{value}</small>
    </div>
  );
}

function History({
  records,
  visits,
  onExport,
  exportNote,
  onUpdateReview,
  showValidation,
}: {
  records: WalkRecord[];
  visits: number;
  onExport: () => void;
  exportNote: string;
  onUpdateReview: (id: string, patch: { rating?: number; note?: string }) => void;
  showValidation: boolean;
}) {
  return (
    <section className="content history">
      <div className="section-title">
        <div>
          <h2>산책 기록</h2>
          <p>
            이 기기 기록 {records.length}회 · 재방문 {visits}회.{' '}
            <a href="/reviews">동네 후기 보기</a>
          </p>
        </div>
        <span>{records.length}회</span>
      </div>
      <div className="history-actions">
        <button className="secondary-button" onClick={onExport} type="button">
          베타 데이터 내보내기
        </button>
        {exportNote && <p className="export-note">{exportNote}</p>}
      </div>
      {records.length === 0 ? (
        <div className="empty-state">아직 완료한 산책이 없어요.</div>
      ) : (
        records.map((item) => (
          <article className="record-card" key={item.id}>
            <div>
              <p>{new Date(item.completedAt).toLocaleString('ko-KR')}</p>
              <h3>{item.destinationName}</h3>
            </div>
            <strong>
              {Math.floor(item.durationSeconds / 60)}분 · {item.distanceMeters}m
            </strong>
            <div className="rating compact">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={(item.rating || 0) >= value ? 'active' : ''}
                  onClick={() => onUpdateReview(item.id, { rating: value })}
                  aria-label={`${value}점`}
                >
                  ★
                </button>
              ))}
            </div>
            {item.note ? <p>{item.note}</p> : <p className="muted-line">후기 메모 없음</p>}
            {showValidation && item.validation && (
              <pre className="dev-json">{JSON.stringify(item.validation, null, 2)}</pre>
            )}
          </article>
        ))
      )}
    </section>
  );
}
