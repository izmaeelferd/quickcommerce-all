import { get, post, put, patch, del } from './api';

/** Vendor-scoped endpoints (the backend resolves the restaurant from the token). */
export const vendorApi = {
  restaurant: () => get('/restaurants/mine/details'),
  createRestaurant: (b) => post('/restaurants', b),
  updateRestaurant: (b) => put('/restaurants/mine/details', b),
  setStatus: (b) => patch('/restaurants/mine/status', b),
  setTimings: (timings) => put('/restaurants/mine/timings', { timings }),
  stats: (days) => get('/orders/vendor/stats', { days }),
  orders: (params) => get('/orders/vendor/list', params),
  order: (id) => get(`/orders/${id}`),
  updateOrder: (id, status, reason) => patch(`/orders/vendor/${id}/status`, { status, reason }),
  payouts: (page) => get('/orders/vendor/payouts', { page }),
  categories: () => get('/menu/categories'),
  createCategory: (b) => post('/menu/categories', b),
  updateCategory: (id, b) => put(`/menu/categories/${id}`, b),
  deleteCategory: (id) => del(`/menu/categories/${id}`),
  reorderCategories: (ids) => put('/menu/categories/reorder', { ids }),
  items: (category) => get('/menu/items', { category }),
  createItem: (b) => post('/menu/items', b),
  updateItem: (id, b) => put(`/menu/items/${id}`, b),
  deleteItem: (id) => del(`/menu/items/${id}`),
  toggleItem: (id, isAvailable) => patch(`/menu/items/${id}/availability`, { isAvailable }),
};
