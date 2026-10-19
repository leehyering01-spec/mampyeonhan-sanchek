'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import type { ReviewFormState } from '@/app/lib/review-actions';
import type { DestinationOption, WalkReview } from '@/app/lib/reviews';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="brand" size="full" disabled={pending}>
      {pending ? '저장 중…' : label}
    </Button>
  );
}

export default function ReviewForm({
  destinations,
  action,
  review,
  defaultDestinationId,
  imageUrl,
}: {
  destinations: DestinationOption[];
  action: (state: ReviewFormState, formData: FormData) => Promise<ReviewFormState>;
  review?: WalkReview;
  defaultDestinationId?: string;
  imageUrl?: string | null;
}) {
  const [state, formAction] = useActionState(action, {});
  const [preview, setPreview] = useState<string | null>(imageUrl ?? null);

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <p className="rounded-xl bg-plum/10 px-4 py-3 text-sm font-semibold text-plum" role="alert">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="destination_id">목적지</Label>
        <select
          id="destination_id"
          name="destination_id"
          defaultValue={review?.destination_id ?? defaultDestinationId ?? ''}
          required
          className="flex h-11 w-full rounded-xl border border-line bg-white px-3 text-sm"
        >
          <option value="">목적지를 선택해 주세요</option>
          {destinations.map((item) => (
            <option key={item.destination_id} value={item.destination_id}>
              {item.name}
            </option>
          ))}
        </select>
        {state.fieldErrors?.destination_id && (
          <p className="text-sm text-plum">{state.fieldErrors.destination_id}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nickname">별명</Label>
        <Input
          id="nickname"
          name="nickname"
          defaultValue={review?.nickname}
          maxLength={20}
          placeholder="예: 이문동 산책러"
          required
        />
        <p className="text-xs text-muted">실명, 연락처, 아이 이름은 적지 마세요.</p>
        {state.fieldErrors?.nickname && <p className="text-sm text-plum">{state.fieldErrors.nickname}</p>}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">별점</legend>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                name="rating"
                value={value}
                defaultChecked={(review?.rating ?? 5) === value}
                required
              />
              {value}
            </label>
          ))}
        </div>
        {state.fieldErrors?.rating && <p className="text-sm text-plum">{state.fieldErrors.rating}</p>}
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="body">후기</Label>
        <Textarea
          id="body"
          name="body"
          defaultValue={review?.body}
          minLength={10}
          maxLength={500}
          placeholder="유모차로 걷기 어땠는지, 턱이나 쉼터는 어땠는지 적어 주세요."
          required
        />
        {state.fieldErrors?.body && <p className="text-sm text-plum">{state.fieldErrors.body}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">사진 (선택, JPG/PNG/WEBP · 5MB 이하)</Label>
        <Input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setPreview(URL.createObjectURL(file));
          }}
        />
        {preview ? (
          <img src={preview} alt="선택한 산책 사진 미리보기" className="mt-2 h-48 w-full rounded-xl object-cover" />
        ) : (
          <p className="text-sm text-muted">사진이 없으면 상세 화면에 ‘사진 없음’으로 보여요.</p>
        )}
        {review?.image_path && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="remove_image" />
            기존 사진 삭제
          </label>
        )}
      </div>

      <SubmitButton label={review ? '후기 수정하기' : '후기 등록하기'} />
    </form>
  );
}
