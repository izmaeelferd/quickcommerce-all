import { get, put, post, del } from './api';

/** Thin wrappers over the dynamic configuration API. */
export const configApi = {
  publicConfig: () => get('/config'),
  translations: (lang) => get(`/config/translations/${lang || ''}`),
  adminConfig: () => get('/admin/config'),
  updateSection: (section, body) => put(`/admin/config/${section}`, body),
  updateLayout: (sections) => put('/admin/config/layout', sections),
  updateLanguages: (body) => put('/admin/config/languages', body),
  banners: () => get('/admin/config/banners'),
  createBanner: (b) => post('/admin/config/banners', b),
  updateBanner: (id, b) => put(`/admin/config/banners/${id}`, b),
  deleteBanner: (id) => del(`/admin/config/banners/${id}`),
  reorderBanners: (ids) => put('/admin/config/banners/reorder', { ids }),
  listTranslations: () => get('/admin/config/translations'),
  getTranslation: (code) => get(`/admin/config/translations/${code}`),
  createTranslation: (body) => post('/admin/config/translations', body),
  updateTranslation: (code, body) => put(`/admin/config/translations/${code}`, body),
  deleteTranslation: (code) => del(`/admin/config/translations/${code}`),
  upsertKey: (key, values) => post('/admin/config/translations/keys', { key, values }),
};
