import { post, get, tokens } from './api';

export async function login(identifier, password) {
  const data = await post('/auth/login', { identifier, password, role: 'vendor' });
  tokens.set(data.accessToken, data.refreshToken);
  return data;
}

export async function register(body) {
  const data = await post('/auth/register', { ...body, role: 'vendor' });
  tokens.set(data.accessToken, data.refreshToken);
  return data;
}

export const me = () => get('/auth/me');

export async function logout() {
  try {
    await post('/auth/logout', { refreshToken: tokens.refresh });
  } catch (e) {
    // ignore
  }
  tokens.clear();
}
