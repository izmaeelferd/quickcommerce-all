import { get } from './api';

export const configApi = {
  publicConfig: () => get('/config'),
  translations: (lang) => get(`/config/translations/${lang || ''}`),
};
