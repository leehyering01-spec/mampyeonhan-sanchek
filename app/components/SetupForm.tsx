'use client';

import { useState } from 'react';
import type { UserProfile } from '../lib/profile';

type Complex = { id: string; name: string };

const YEARS = ['2022', '2023', '2024', '2025', '2026'];
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1));

export default function SetupForm({
  complexes,
  labels,
  initial,
  onSubmit,
}: {
  complexes: Complex[];
  labels: Record<string, string>;
  initial: UserProfile;
  onSubmit: (profile: UserProfile) => void;
}) {
  const [nickname, setNickname] = useState(initial.nickname);
  const [birthYear, setBirthYear] = useState(initial.birthYear);
  const [birthMonth, setBirthMonth] = useState(initial.birthMonth);
  const [complexId, setComplexId] = useState(initial.complexId || complexes[0]?.id || '');
  const [touched, setTouched] = useState(false);

  const missingBirth = !birthYear || !birthMonth;
  const canSubmit = Boolean(complexId) && !missingBirth;

  return (
    <main className="app-shell flow-shell setup-shell">
      <header className="flow-top">
        <div className="brand-lockup compact">
          <img className="brand-mark" src="/images/brand-mark.png" alt="" />
          <strong>맘편한 산책</strong>
        </div>
      </header>

      <section className="setup-hero">
        <h1>
          아이와 편한
          <br />
          외출을 시작해 볼까요?
        </h1>
        <p>아이 월령과 생활권에 맞는 장소와 산책 코스를 추천해 드릴게요.</p>
      </section>

      <section className="setup-card">
        <label className="field">
          <span>닉네임</span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="사용할 닉네임을 입력해 주세요"
          />
        </label>

        <label className="field">
          <span>아이 출생연월</span>
          <div className="field-row">
            <select
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              aria-label="출생연도"
            >
              <option value="">연도</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
            <select
              value={birthMonth}
              onChange={(e) => setBirthMonth(e.target.value)}
              aria-label="출생월"
            >
              <option value="">월</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
          </div>
          {touched && missingBirth && (
            <em className="field-error">아이 출생연월을 선택해 주세요.</em>
          )}
        </label>

        <label className="field">
          <span>생활권</span>
          <select
            value={complexId}
            onChange={(e) => setComplexId(e.target.value)}
            aria-label="생활권"
          >
            {complexes.map((item) => (
              <option key={item.id} value={item.id}>
                {labels[item.id] ?? item.name}
              </option>
            ))}
          </select>
        </label>

        <button
          className="primary-button"
          type="button"
          onClick={() => {
            setTouched(true);
            if (!canSubmit) return;
            onSubmit({
              nickname: nickname.trim(),
              birthYear,
              birthMonth,
              complexId,
              onboardingDone: true,
              setupDone: true,
            });
          }}
        >
          맘편한 산책 시작하기
        </button>
      </section>

      <p className="setup-note">입력한 정보는 추천을 위해서만 사용돼요.</p>
    </main>
  );
}
