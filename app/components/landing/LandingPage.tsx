import Link from 'next/link';
import { buttonVariants } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { cn } from '@/app/lib/utils';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import Faq from './Faq';

const PROBLEMS = [
  {
    title: '갈 만한 곳이 없어요',
    body: '아이와 눈치 보지 않고 머물거나 수유·기저귀를 해결할 공간이 부족합니다.',
  },
  {
    title: '유모차 안심 길인지 알 수 없어요',
    body: '경사·턱·계단·좁은 보도 때문에 단둘이 외출할 때 이동이 막막합니다.',
  },
  {
    title: '결국 외출을 미루게 돼요',
    body: '장소와 경로에 대한 안심이 없어, 익숙한 곳만 반복하거나 집에 머물게 됩니다.',
  },
];

const FEATURES = [
  {
    title: '유모차로 이동하기 편한 경로',
    body: '선택한 단지 출입구에서 목적지까지 길을 안내하고, 계단·횡단·경사 횟수를 출발 전에 확인합니다.',
  },
  {
    title: '맘 편히 쉬어갈 수 있는 장소',
    body: '카페, 도서관, 공원 등 이문동 생활권 목적지를 가까운 거리 순으로 추천합니다.',
  },
  {
    title: '같은 동네의 실제 후기',
    body: '걸어본 보호자가 별점·메모·사진을 남기면, 지도만으로는 모르는 현실 정보가 쌓입니다.',
  },
];

const STORIES = [
  {
    quote:
      '차량이 적고 보도가 비교적 넓어서 혼자 걷기 편했어요. 처음엔 긴장했는데 막상 나가보니 생각보다 괜찮더라고요.',
    by: '생후 5개월 아이 보호자',
  },
  {
    quote:
      '여기 카페는 유모차 두기 편했고, 아이가 울어도 괜찮다며 기다려 주셨어요. 마음 편히 머물렀습니다.',
    by: '생후 8개월 아이 보호자',
  },
  {
    quote: '지도에는 가까웠지만 입구에 턱이 있었어요. 옆쪽 출입구가 더 편합니다. 이런 정보가 미리 있으면 좋겠어요.',
    by: '생후 3개월 아이 보호자',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-surface text-ink">
      <SiteHeader />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-sm font-bold text-plum">아이와 걷는 길을 미리 확인해요</p>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
              아이와 갈 만한 곳,
              <br />늘 비슷하지 않나요?
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted md:text-lg">
              맘편한 산책은 이문동에서 유모차로 가기 편한 목적지와 출입구 기준 길, 실제로 다녀온 후기를
              한곳에서 보여 줍니다.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/reviews" className={cn(buttonVariants({ variant: 'default', size: 'lg' }))}>
                동네 후기 보기
              </Link>
              <Link href="/walk" className={cn(buttonVariants({ variant: 'brand', size: 'lg' }))}>
                산책 시작하기
              </Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-line bg-white">
            <img
              src="/images/onboarding_problem.png"
              alt="유모차를 끌고 계단과 언덕이 있는 길을 걷는 보호자와 아이 일러스트"
              className="h-full w-full object-cover"
            />
          </div>
        </section>

        <section id="problem" className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-sm font-bold text-plum">문제</p>
            <h2 className="mt-3 max-w-3xl text-2xl font-extrabold tracking-tight md:text-4xl">
              출산 후 집 앞 첫 산책은 생각보다 간단하지 않습니다.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {PROBLEMS.map((item) => (
                <Card key={item.title}>
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.body}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-20">
          <div className="mx-auto max-w-6xl px-5">
            <p className="text-sm font-bold text-plum">해결</p>
            <h2 className="mt-3 max-w-3xl text-2xl font-extrabold tracking-tight md:text-4xl">
              새롭게 갈 곳을 찾고, 아이와 가도 괜찮다는 확신까지.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {FEATURES.map((item) => (
                <Card key={item.title} className="bg-white">
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.body}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <div className="mt-8 overflow-hidden rounded-3xl border border-line bg-white md:grid md:grid-cols-2">
              <img
                src="/images/onboarding_route.png"
                alt="유모차 기준으로 골목길을 안내하는 경로 일러스트"
                className="h-full w-full object-cover"
              />
              <img
                src="/images/onboarding_destination.png"
                alt="카페에 도착해 아이와 쉬는 보호자 일러스트"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section id="stories" className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
              같은 동네에서 남긴 진짜 산책 이야기
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {STORIES.map((item) => (
                <Card key={item.by}>
                  <CardContent className="pt-6">
                    <p className="text-sm leading-7">“{item.quote}”</p>
                    <p className="mt-4 text-xs font-bold text-muted">— {item.by}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Link
              href="/reviews"
              className={cn(buttonVariants({ variant: 'outline' }), 'mt-8 inline-flex')}
            >
              등록된 후기 보기
            </Link>
          </div>
        </section>

        <section id="cta" className="py-20">
          <div className="mx-auto max-w-4xl rounded-3xl bg-ink px-6 py-14 text-center text-white md:px-12">
            <h2 className="text-2xl font-extrabold md:text-4xl">
              집 앞 산책이 하루를 조금 가볍게 만들 수 있도록
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/80 md:text-base">
              유모차로 편하게 갈 수 있는 길과 쉬어갈 장소를 소개합니다. 다녀온 길을 후기로 남겨 주세요.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/reviews/new" className={cn(buttonVariants({ variant: 'brand', size: 'lg' }))}>
                후기 남기기
              </Link>
              <Link
                href="/walk"
                className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'border-white bg-transparent text-white hover:bg-white/10')}
              >
                길안내 시작
              </Link>
            </div>
          </div>
        </section>

        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}
