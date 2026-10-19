'use client';

import { useState } from 'react';

const ITEMS = [
  {
    q: '지금 바로 쓸 수 있나요?',
    a: '이문동 래미안 라그란데·이문 아이파크자이 생활권에서 목적지 탐색, 출입구 기준 길안내, 산책 후기를 바로 쓸 수 있어요.',
  },
  {
    q: '앱을 다운로드해야 하나요?',
    a: '스토어 앱은 없습니다. 모바일 브라우저에서 바로 쓰거나, 홈 화면에 추가해 PWA처럼 열 수 있어요.',
  },
  {
    q: '어느 지역에서 사용할 수 있나요?',
    a: '현재는 서울 이문동 단지 2곳을 기준으로 목적지 52곳을 안내합니다.',
  },
  {
    q: '후기를 남기면 어디에 저장되나요?',
    a: '산책 후기는 Supabase에 저장되어 새로고침 후에도 남아 있어요. 실명·아이 정보·정확한 위치는 받지 않습니다.',
  },
];

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 py-20">
      <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">자주 묻는 질문</h2>
      <div className="mt-8 divide-y divide-line rounded-2xl border border-line bg-white">
        {ITEMS.map((item, index) => {
          const expanded = open === index;
          return (
            <div key={item.q}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? -1 : index)}
              >
                <span className="font-bold">{item.q}</span>
                <span aria-hidden className="text-muted">
                  {expanded ? '−' : '+'}
                </span>
              </button>
              {expanded && <p className="px-5 pb-5 text-sm leading-7 text-muted">{item.a}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
