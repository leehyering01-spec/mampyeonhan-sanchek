'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import catalog from './data/catalog.json';
import destinationsData from './data/destinations.json';

type Point = { latitude: number; longitude: number };
type Entrance = { id: string; name: string; location: Point };
type Complex = { id: string; name: string; entrances: Entrance[] };
type Destination = {
  destination_id: string; name: string; category: string; address: string;
  lat: number; lon: number; nearest_complex: string; straight_km: number;
  estimated_minutes: number; stroller_access: string; evidence: string;
};
type WalkRecord = {
  id: string; destinationId: string; destinationName: string; completedAt: string;
  durationSeconds: number; distanceMeters: number; rating?: number; note?: string;
};
type View = 'home' | 'saved' | 'history' | 'departure' | 'walk' | 'complete';
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const complexes = catalog.residential_complexes as Complex[];
const destinations = destinationsData as Destination[];
const policy = catalog.validation_policy;
const storage = {
  saved: 'mampyeonhan:saved', records: 'mampyeonhan:records', complex: 'mampyeonhan:complex', visits: 'mampyeonhan:visits',
};

const readList = <T,>(key: string): T[] => {
  try { return JSON.parse(localStorage.getItem(key) || '[]') as T[]; } catch { return []; }
};
const radians = (value: number) => value * Math.PI / 180;
const distanceBetween = (a: Point, b: Point) => {
  const radius = 6371000;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};
const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export default function Home() {
  const [view, setView] = useState<View>('home');
  const [complexId, setComplexId] = useState('raemian_lagrande');
  const [category, setCategory] = useState('전체');
  const [selected, setSelected] = useState<Destination | null>(null);
  const [entranceId, setEntranceId] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  const [records, setRecords] = useState<WalkRecord[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [walkDistance, setWalkDistance] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [walkStatus, setWalkStatus] = useState('위치 권한을 확인하고 있어요.');
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const startedAt = useRef<number | null>(null);
  const previousPoint = useRef<Point | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    setSaved(readList<string>(storage.saved));
    setRecords(readList<WalkRecord>(storage.records));
    setComplexId(localStorage.getItem(storage.complex) || 'raemian_lagrande');
    const visits = Number(localStorage.getItem(storage.visits) || '0') + 1;
    localStorage.setItem(storage.visits, String(visits));
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    const capturePrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    window.addEventListener('beforeinstallprompt', capturePrompt);
    return () => window.removeEventListener('beforeinstallprompt', capturePrompt);
  }, []);

  useEffect(() => {
    if (view !== 'walk' || !startedAt.current) return;
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current!) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [view]);

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  const activeComplex = complexes.find((item) => item.id === complexId)!;
  const activeEntrance = activeComplex.entrances.find((item) => item.id === entranceId);
  const categories = ['전체', ...new Set(destinations.map((item) => item.category))];
  const visible = useMemo(() => {
    const complexName = complexId === 'raemian_lagrande' ? '래미안' : '아이파크';
    return destinations.filter((item) => item.nearest_complex.includes(complexName) && (category === '전체' || item.category === category));
  }, [category, complexId]);
  const savedDestinations = destinations.filter((item) => saved.includes(item.destination_id));
  const requirements = {
    time: elapsed >= policy.minimum_duration_minutes * 60,
    distance: walkDistance >= policy.minimum_distance_meters,
    arrival: remaining !== null && remaining <= policy.arrival_radius_meters,
  };
  const canComplete = requirements.time && requirements.distance && requirements.arrival;

  const toggleSaved = (id: string) => {
    const next = saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id];
    setSaved(next); localStorage.setItem(storage.saved, JSON.stringify(next));
  };
  const selectComplex = (id: string) => { setComplexId(id); localStorage.setItem(storage.complex, id); };
  const requestInstall = async () => {
    if (installPrompt) { await installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null); }
    else setShowInstallHelp(true);
  };
  const chooseDestination = (item: Destination) => { setSelected(item); setEntranceId(activeComplex.entrances[0]?.id || ''); setView('departure'); };
  const startWalk = () => {
    if (!selected || !activeEntrance) return;
    setElapsed(0); setWalkDistance(0); setRemaining(null); previousPoint.current = null; startedAt.current = Date.now(); setView('walk');
    if (!navigator.geolocation) { setWalkStatus('이 브라우저에서는 위치 기능을 사용할 수 없어요.'); return; }
    setWalkStatus('현재 위치를 확인하고 있어요.');
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const point = { latitude: coords.latitude, longitude: coords.longitude };
        if (coords.accuracy <= 100 && previousPoint.current) {
          const added = distanceBetween(previousPoint.current, point);
          if (added < 200) setWalkDistance((value) => value + added);
        }
        previousPoint.current = point;
        setRemaining(distanceBetween(point, { latitude: selected.lat, longitude: selected.lon }));
        setWalkStatus('실제 이동 시간과 거리를 확인하고 있어요.');
      },
      (error) => setWalkStatus(error.code === 1 ? '위치 권한을 허용해주세요.' : '위치를 확인하지 못했어요. 잠시 후 다시 시도해주세요.'),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 },
    );
  };
  const completeWalk = () => {
    if (!selected || !canComplete) return;
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    const record: WalkRecord = { id: crypto.randomUUID(), destinationId: selected.destination_id, destinationName: selected.name, completedAt: new Date().toISOString(), durationSeconds: elapsed, distanceMeters: Math.round(walkDistance) };
    const next = [record, ...records]; setRecords(next); localStorage.setItem(storage.records, JSON.stringify(next)); setView('complete');
  };
  const updateReview = (rating?: number, note?: string) => {
    const next = records.map((item, index) => index === 0 ? { ...item, ...(rating ? { rating } : {}), ...(note !== undefined ? { note } : {}) } : item);
    setRecords(next); localStorage.setItem(storage.records, JSON.stringify(next));
  };

  if (view === 'departure' && selected) return (
    <main className="app-shell subpage">
      <SubHeader title="출발지 확인" onBack={() => setView('home')} />
      <section className="page-content">
        <p className="eyebrow">{selected.name}까지</p><h1 className="page-heading">어디에서 출발할까요?</h1>
        <p className="page-description">출입구를 선택하면 GPS 산책 검증을 시작할 수 있어요.</p>
        <div className="entrance-list">
          {activeComplex.entrances.map((item) => <button key={item.id} className={entranceId === item.id ? 'entrance active' : 'entrance'} onClick={() => setEntranceId(item.id)} type="button"><span className="radio-dot" /><div><strong>{item.name}</strong><small>좌표 확인됨</small></div><b>✓</b></button>)}
        </div>
        <img className="map-preview" src="/images/route-map.png" alt="이문동 산책 지역 지도" />
        <div className="policy-summary"><span>✓</span><p><strong>완료 기준</strong>10분 이상 · 400m 이상 · 목적지 200m 이내</p></div>
      </section>
      <div className="fixed-action"><button className="primary-button" onClick={startWalk} disabled={!entranceId} type="button">맘편한 산책 시작!</button></div>
    </main>
  );

  if (view === 'walk' && selected && activeEntrance) return (
    <main className="app-shell subpage">
      <SubHeader title="실시간 산책 경로" onBack={() => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); setView('departure'); }} />
      <section className="page-content walk-content">
        <p className="walk-route">{activeEntrance.name} → {selected.name}</p>
        <div className="walk-metrics"><strong>{clock(elapsed)}</strong><span>·</span><strong>{Math.round(walkDistance)}m 이동</strong></div>
        <div className="live-map"><img src="/images/route-map.png" alt="산책 지역 지도" /><div><span>➤</span>{walkStatus}</div></div>
        <Requirement label={`최소 산책 시간 ${policy.minimum_duration_minutes}분`} met={requirements.time} value={requirements.time ? '확인됨' : `${clock(elapsed)}`} />
        <Requirement label={`최소 이동 거리 ${policy.minimum_distance_meters}m`} met={requirements.distance} value={`${Math.round(walkDistance)}m`} />
        <Requirement label={`목적지 ${policy.arrival_radius_meters}m 이내`} met={requirements.arrival} value={remaining === null ? '확인 중' : `${Math.round(remaining)}m 남음`} />
      </section>
      <div className="fixed-action"><button className="primary-button" onClick={completeWalk} disabled={!canComplete} type="button">다녀왔어요</button></div>
    </main>
  );

  if (view === 'complete' && selected) return (
    <main className="app-shell subpage complete-page">
      <section className="complete-card"><div className="complete-icon">✓</div><p className="eyebrow">산책 완료</p><h1>{selected.name}<br />다녀왔어요!</h1><p>{Math.floor(elapsed / 60)}분 동안 {Math.round(walkDistance)}m를 걸었어요.</p>
        <div className="review-box"><strong>오늘 산책은 어땠나요?</strong><div className="rating">{[1,2,3,4,5].map((value) => <button key={value} onClick={() => updateReview(value)} className={(records[0]?.rating || 0) >= value ? 'active' : ''} type="button">★</button>)}</div><textarea placeholder="유모차로 걸으며 느낀 점을 남겨주세요." defaultValue={records[0]?.note} onBlur={(event) => updateReview(undefined, event.target.value)} /></div>
        <button className="primary-button" onClick={() => setView('history')} type="button">산책 기록 보기</button><button className="text-button" onClick={() => setView('home')} type="button">홈으로</button>
      </section>
    </main>
  );

  const list = view === 'saved' ? savedDestinations : visible;
  return (
    <main className="app-shell">
      <header className="topbar"><div><p className="eyebrow">아이와 걷기 좋은 동네</p><h1>맘편한 산책</h1></div><button className="install-chip" onClick={requestInstall} type="button">앱으로 설치</button></header>
      {view === 'history' ? <History records={records} /> : <>
        <section className="hero"><p>어디에서 출발할까요?</p><div className="segmented" aria-label="생활권 선택">{complexes.map((item) => <button key={item.id} className={complexId === item.id ? 'active' : ''} onClick={() => selectComplex(item.id)} type="button">{item.id === 'raemian_lagrande' ? '래미안 라그란데' : '이문 아이파크자이'}</button>)}</div><div className="status-card"><span className="status-icon">✓</span><div><strong>{activeComplex.entrances.length}개 출입구 확인 완료</strong><p>10분 · 400m · 목적지 200m 이내에서 산책을 기록해요.</p></div></div></section>
        <section className="content"><div className="section-title"><div><h2>{view === 'saved' ? '저장한 산책지' : '오늘 어디로 갈까요?'}</h2><p>{view === 'saved' ? '다시 가고 싶은 장소를 모았어요.' : '유모차로 30분 이내 후보를 모았어요.'}</p></div><span>{list.length}곳</span></div>{view === 'home' && <div className="filters">{categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)} type="button">{item}</button>)}</div>}<DestinationList items={list} saved={saved} onSave={toggleSaved} onSelect={setSelected} /></section>
      </>}
      <nav className="bottom-nav" aria-label="주 메뉴"><button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')} type="button"><span>⌂</span>홈</button><button className={view === 'saved' ? 'active' : ''} onClick={() => setView('saved')} type="button"><span>♡</span>저장 {saved.length || ''}</button><button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')} type="button"><span>◎</span>산책 기록</button></nav>
      {selected && view !== 'departure' && <div className="sheet-backdrop" onClick={() => setSelected(null)}><section className="detail-sheet" onClick={(event) => event.stopPropagation()}><div className="sheet-handle" /><div className="detail-image"><img src="/images/route-map.png" alt="이문동 산책 지역 지도" /></div><p className="card-kicker">{selected.category} · 유모차 접근 {selected.stroller_access}</p><h2>{selected.name}</h2><p className="detail-address">{selected.address}</p><div className="detail-grid"><div><strong>약 {selected.estimated_minutes}분</strong><span>참고 시간</span></div><div><strong>{selected.straight_km.toFixed(2)}km</strong><span>직선거리</span></div></div><p className="evidence">{selected.evidence}</p><button className="primary-button" onClick={() => chooseDestination(selected)} type="button">이곳으로 산책 갈래요</button></section></div>}
      {showInstallHelp && <div className="sheet-backdrop" onClick={() => setShowInstallHelp(false)}><section className="detail-sheet install-help" onClick={(event) => event.stopPropagation()}><div className="sheet-handle" /><h2>홈 화면에 설치하기</h2><ol><li>Safari 아래의 공유 버튼을 눌러요.</li><li><b>홈 화면에 추가</b>를 선택해요.</li><li>오른쪽 위 <b>추가</b>를 눌러요.</li></ol><button className="primary-button" onClick={() => setShowInstallHelp(false)} type="button">확인</button></section></div>}
    </main>
  );
}

function DestinationList({ items, saved, onSave, onSelect }: { items: Destination[]; saved: string[]; onSave: (id: string) => void; onSelect: (item: Destination) => void }) {
  if (!items.length) return <div className="empty-state">아직 저장한 장소가 없어요.</div>;
  return <div className="destination-list">{items.map((item) => <article className="destination-card" key={item.destination_id}><button className="card-main" onClick={() => onSelect(item)} type="button"><div className={`category-mark ${item.category}`}>{item.category.slice(0, 1)}</div><div><div className="card-kicker">{item.category} · {item.stroller_access}</div><h3>{item.name}</h3><p>{item.address || '주소 확인 중'}</p><div className="metrics"><span>약 {item.estimated_minutes}분</span><span>{item.straight_km.toFixed(2)}km</span></div></div></button><button aria-label={`${item.name} 저장`} className={`save-button ${saved.includes(item.destination_id) ? 'saved' : ''}`} onClick={() => onSave(item.destination_id)} type="button">{saved.includes(item.destination_id) ? '♥' : '♡'}</button></article>)}</div>;
}
function SubHeader({ title, onBack }: { title: string; onBack: () => void }) { return <header className="sub-header"><button onClick={onBack} aria-label="뒤로" type="button">‹</button><h1>{title}</h1></header>; }
function Requirement({ label, met, value }: { label: string; met: boolean; value: string }) { return <div className="requirement"><span className={met ? 'met' : ''}>{met ? '✓' : ''}</span><strong>{label}</strong><small>{value}</small></div>; }
function History({ records }: { records: WalkRecord[] }) { return <section className="content history"><div className="section-title"><div><h2>산책 기록</h2><p>완료한 산책과 후기를 확인해요.</p></div><span>{records.length}회</span></div>{records.length === 0 ? <div className="empty-state">아직 완료한 산책이 없어요.</div> : records.map((item) => <article className="record-card" key={item.id}><div><p>{new Date(item.completedAt).toLocaleDateString('ko-KR')}</p><h3>{item.destinationName}</h3></div><strong>{Math.floor(item.durationSeconds / 60)}분 · {item.distanceMeters}m</strong>{item.rating && <span>{'★'.repeat(item.rating)}</span>}{item.note && <p>{item.note}</p>}</article>)}</section>; }
