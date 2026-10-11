import { post, get, tokens } from './api';

export async function login(identifier, password) {
  const data = await post('/auth/login', { identifier, password, role: 'admin' });
  tokens.set(data.accessToken, data.refreshToken);
  return data.user;
}

export async function me() {
  const data = await get('/auth/me');
  return data.user;
}

export async function logout() {
  try {
    await post('/auth/logout', { refreshToken: tokens.refresh });
  } catch (e) {
    // ignore
  }
  tokens.clear();
}
