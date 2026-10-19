'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { deleteReview } from '@/app/lib/review-actions';

export default function ConfirmDelete({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          삭제
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>이 후기를 삭제할까요?</DialogTitle>
        <DialogDescription>
          {name} 후기는 삭제하면 목록에서 사라집니다. 올린 사진도 함께 지워집니다.
        </DialogDescription>
        <form
          action={async (formData) => {
            setPending(true);
            try {
              await deleteReview(formData);
            } finally {
              setPending(false);
            }
          }}
          className="mt-6 flex justify-end gap-2"
        >
          <input type="hidden" name="id" value={id} />
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button type="submit" variant="plum" disabled={pending}>
            {pending ? '삭제 중…' : '삭제하기'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
