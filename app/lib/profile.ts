export type UserProfile = {
  nickname: string;
  birthYear: string;
  birthMonth: string;
  complexId: string;
  onboardingDone: boolean;
  setupDone: boolean;
};

export const PROFILE_KEY = 'mampyeonhan:profile';

export const defaultProfile = (): UserProfile => ({
  nickname: '',
  birthYear: '',
  birthMonth: '',
  complexId: 'raemian_lagrande',
  onboardingDone: false,
  setupDone: false,
});

export function readProfile(): UserProfile {
  if (typeof window === 'undefined') return defaultProfile();
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return defaultProfile();
    return { ...defaultProfile(), ...(JSON.parse(raw) as Partial<UserProfile>) };
  } catch {
    return defaultProfile();
  }
}

export function writeProfile(profile: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function amenitiesForCategory(category: string): string[] {
  if (category.includes('도서관') || category.includes('문화')) {
    return ['수유실', '기저귀 교환대', '실내 휴식 가능', '유모차 출입 가능'];
  }
  if (category.includes('카페')) {
    return ['아기의자', '화장실', '유모차 출입 가능', '짧은 휴식'];
  }
  if (category.includes('산책') || category.includes('숲') || category.includes('공원')) {
    return ['벤치', '그늘', '유모차 이동 OK', '완만한 길'];
  }
  if (category.includes('놀이')) {
    return ['놀이 공간', '벤치', '유모차 이동 OK', '짧은 체류'];
  }
  return ['유모차 이동 쉬움', '가까운 거리', '짧은 체류', '실외 가능'];
}

export function tipForCategory(category: string): string {
  if (category.includes('도서관')) {
    return '조용히 쉬기 좋고 아이와 잠깐 머물기 편해요.';
  }
  if (category.includes('산책') || category.includes('공원') || category.includes('숲')) {
    return '유모차로 가볍게 다녀오기 좋은 코스예요.';
  }
  if (category.includes('카페')) {
    return '아이와 잠시 쉬었다 오기 좋아요.';
  }
  return '아이와 편하게 다녀올 수 있는 추천이에요.';
}

export function placeKind(category: string): '장소' | '산책 코스' {
  if (category.includes('산책') || category.includes('숲') || category.includes('공원')) {
    return '산책 코스';
  }
  return '장소';
}
