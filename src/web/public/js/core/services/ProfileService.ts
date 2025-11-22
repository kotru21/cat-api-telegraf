import { getProfile, getUserLikesCount } from '../../api';
import { setState, emit } from '../state/store';

let lastProfileTs = 0;
const PROFILE_TTL = 30_000;

export async function loadProfile({ force = false } = {}) {
  const now = Date.now();
  if (!force && now - lastProfileTs < PROFILE_TTL) return;
  emit('profile:loading');
  setState({ loading: { profile: true }, errors: { profile: null } });
  try {
    const profile = await getProfile();
    lastProfileTs = Date.now();
    setState({ profile, loading: { profile: false } });
    emit('profile:loaded', profile);
    try {
      const { count } = await getUserLikesCount();
      setState({ likesCount: count });
      emit('likes:count', count);
    } catch (_) {
      // ignore
    }
    return profile;
  } catch (err) {
    setState({ loading: { profile: false }, errors: { profile: err } });
    emit('profile:error', err);
    throw err;
  }
}

export default { loadProfile };
