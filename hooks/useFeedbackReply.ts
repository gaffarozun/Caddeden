import { useState } from 'react';
import { useFeedback } from './useFeedback';
export function useFeedbackReply(id: string, kind: 'review' | 'suggestion', initial = '') {
  const { mutate } = useFeedback();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try { await mutate(`${kind}_reply`, { id, text }); setOpen(false); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Cevap gönderilemedi.'); }
    finally { setBusy(false); }
  };
  return { open, setOpen, text, setText, busy, error, submit };
}
