'use server';

import { revalidatePath } from 'next/cache';
import { redirect, unstable_rethrow } from 'next/navigation';
import {
  REVIEW_ALLOWED_TYPES,
  REVIEW_IMAGE_BUCKET,
  REVIEW_MAX_FILE_BYTES,
  findDestination,
} from './reviews';
import { createSupabaseServer } from './supabase/server';

export type ReviewFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function toActionError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: string }).message ?? '');
    if (message.includes('row-level security')) {
      return '데이터베이스 권한 설정이 필요합니다. supabase/schema.sql을 SQL Editor에서 다시 실행해 주세요.';
    }
    if (message) return message;
  }
  return error instanceof Error ? error.message : '후기를 저장하지 못했어요.';
}

function validateFields(formData: FormData): ReviewFormState | { values: Record<string, string> } {
  const destinationId = readText(formData, 'destination_id');
  const nickname = readText(formData, 'nickname');
  const ratingRaw = readText(formData, 'rating');
  const body = readText(formData, 'body');
  const fieldErrors: Record<string, string> = {};

  const destination = findDestination(destinationId);
  if (!destination) fieldErrors.destination_id = '목적지를 선택해 주세요.';
  if (nickname.length < 1 || nickname.length > 20) {
    fieldErrors.nickname = '별명은 1~20자로 입력해 주세요. 실명은 적지 마세요.';
  }
  const rating = Number(ratingRaw);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    fieldErrors.rating = '별점은 1부터 5까지 선택해 주세요.';
  }
  if (body.length < 10 || body.length > 500) {
    fieldErrors.body = '후기는 10자 이상 500자 이하로 적어 주세요.';
  }

  if (Object.keys(fieldErrors).length) return { fieldErrors };
  return {
    values: {
      destination_id: destination!.destination_id,
      destination_name: destination!.name,
      nickname,
      rating: String(rating),
      body,
    },
  };
}

async function uploadImage(file: File | null, previousPath?: string | null) {
  if (!file || file.size === 0) return previousPath ?? null;
  if (!REVIEW_ALLOWED_TYPES.includes(file.type as (typeof REVIEW_ALLOWED_TYPES)[number])) {
    throw new Error('이미지는 JPG, PNG, WEBP만 올릴 수 있어요.');
  }
  if (file.size > REVIEW_MAX_FILE_BYTES) {
    throw new Error('이미지 용량은 5MB 이하여야 해요.');
  }

  const supabase = createSupabaseServer();
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(REVIEW_IMAGE_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error('사진 업로드에 실패했어요. 잠시 후 다시 시도해 주세요.');

  if (previousPath) {
    await supabase.storage.from(REVIEW_IMAGE_BUCKET).remove([previousPath]);
  }
  return path;
}

export async function createReview(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const parsed = validateFields(formData);
  if (!('values' in parsed)) return parsed;

  try {
    const file = formData.get('image');
    const imagePath = await uploadImage(file instanceof File ? file : null);
    const supabase = createSupabaseServer();
    const { data, error } = await supabase
      .from('walk_reviews')
      .insert({
        destination_id: parsed.values.destination_id,
        destination_name: parsed.values.destination_name,
        nickname: parsed.values.nickname,
        rating: Number(parsed.values.rating),
        body: parsed.values.body,
        image_path: imagePath,
      })
      .select('id')
      .single();
    if (error || !data) throw error ?? new Error('저장에 실패했어요.');
    revalidatePath('/reviews');
    redirect(`/reviews/${data.id}`);
  } catch (error) {
    unstable_rethrow(error);
    return { error: toActionError(error) };
  }
}

export async function updateReview(
  id: string,
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const parsed = validateFields(formData);
  if (!('values' in parsed)) return parsed;

  try {
    const supabase = createSupabaseServer();
    const { data: current, error: currentError } = await supabase
      .from('walk_reviews')
      .select('image_path')
      .eq('id', id)
      .maybeSingle();
    if (currentError) throw currentError;
    if (!current) return { error: '수정할 후기를 찾지 못했어요.' };

    const removeImage = formData.get('remove_image') === 'on';
    const file = formData.get('image');
    let imagePath = current.image_path as string | null;
    if (removeImage && imagePath) {
      await supabase.storage.from(REVIEW_IMAGE_BUCKET).remove([imagePath]);
      imagePath = null;
    }
    imagePath = await uploadImage(file instanceof File ? file : null, imagePath);

    const { error } = await supabase
      .from('walk_reviews')
      .update({
        destination_id: parsed.values.destination_id,
        destination_name: parsed.values.destination_name,
        nickname: parsed.values.nickname,
        rating: Number(parsed.values.rating),
        body: parsed.values.body,
        image_path: imagePath,
      })
      .eq('id', id);
    if (error) throw error;
    revalidatePath('/reviews');
    revalidatePath(`/reviews/${id}`);
    redirect(`/reviews/${id}`);
  } catch (error) {
    unstable_rethrow(error);
    return { error: toActionError(error) };
  }
}

export async function deleteReview(formData: FormData) {
  const id = readText(formData, 'id');
  if (!id) return;
  const supabase = createSupabaseServer();
  const { data } = await supabase.from('walk_reviews').select('image_path').eq('id', id).maybeSingle();
  if (data?.image_path) {
    await supabase.storage.from(REVIEW_IMAGE_BUCKET).remove([data.image_path]);
  }
  const { error } = await supabase.from('walk_reviews').delete().eq('id', id);
  if (error) {
    throw new Error('후기를 삭제하지 못했어요.');
  }
  revalidatePath('/reviews');
  redirect('/reviews');
}
