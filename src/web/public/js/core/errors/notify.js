import showToast from "/js/toast.js";
import { mapError } from "/js/core/errors/errorMapper.js";

let lastMsg = null;
let lastTs = 0;
const DEDUP_WINDOW = 1500; // ms

export function notifyError(err, { prefix } = {}) {
  const msg = mapError(err);
  const full = prefix ? `${prefix}: ${msg}` : msg;
  const now = Date.now();
  if (full === lastMsg && now - lastTs < DEDUP_WINDOW) return;
  lastMsg = full;
  lastTs = now;
  showToast(full, "error");
}

export function notifySuccess(message, { dedup = false } = {}) {
  const now = Date.now();
  if (dedup && message === lastMsg && now - lastTs < 1000) return;
  lastMsg = message;
  lastTs = now;
  showToast(message, "success");
}

export default { notifyError, notifySuccess };
