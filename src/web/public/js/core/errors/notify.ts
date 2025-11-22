import showToast from '../../toast';
import { mapError } from './errorMapper';

let lastMsg: string | null = null;
let lastTs = 0;
const DEDUP_WINDOW = 1500; // ms

export function notifyError(err: any, { prefix }: { prefix?: string } = {}) {
  const msg = mapError(err);
  const full = prefix ? `${prefix}: ${msg}` : msg;
  const now = Date.now();
  if (full === lastMsg && now - lastTs < DEDUP_WINDOW) return;
  lastMsg = full;
  lastTs = now;
  showToast(full, 'error');
}

export function notifySuccess(message: string, { dedup = false } = {}) {
  const now = Date.now();
  if (dedup && message === lastMsg && now - lastTs < 1000) return;
  lastMsg = message;
  lastTs = now;
  showToast(message, 'success');
}

export default { notifyError, notifySuccess };
