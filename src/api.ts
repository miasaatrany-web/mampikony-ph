import { UserProfile, Product, Sale } from './types';

const API_URL = '/api';

async function request(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Erreur serveur (${response.status}): ${text.slice(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.message || 'Une erreur est survenue');
    }

    return data;
  } catch (err: any) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  auth: {
    login: async (data: any) => {
      const result = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (result.user) {
        result.user = { ...result.user, uid: result.user.id };
      }
      return result;
    },
    register: async (data: any) => {
      const result = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (result.user) {
        result.user = { ...result.user, uid: result.user.id };
      }
      return result;
    },
    me: async () => {
      const user = await request('/auth/me');
      if (user) {
        return { ...user, uid: user.id };
      }
      return user;
    },
    list: async () => {
      const users = await request('/users');
      return users.map((u: any) => ({ ...u, uid: u.id }));
    },
    approve: (id: string) => request(`/users/${id}/approve`, { method: 'PATCH' }),
    delete: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
  },
  products: {
    list: () => request('/products'),
    create: (data: Partial<Product>) => request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<Product>) => request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request(`/products/${id}`, { method: 'DELETE' }),
  },
  sales: {
    list: () => request('/sales'),
    create: (data: Partial<Sale>) => request('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: Partial<Sale>) => request(`/sales/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => request(`/sales/${id}`, { method: 'DELETE' }),
  },
};
