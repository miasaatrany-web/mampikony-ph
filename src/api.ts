import { UserProfile, Product, Sale } from './types';

const API_URL = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const api = {
  auth: {
    login: async (data: any) => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Email ou mot de passe incorrect');
      }
      const result = await res.json();
      if (result.user) {
        result.user = { ...result.user, uid: result.user.id };
      }
      return result;
    },
    register: async (data: any) => {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erreur lors de l\'inscription');
      }
      const result = await res.json();
      if (result.user) {
        result.user = { ...result.user, uid: result.user.id };
      }
      return result;
    },
    me: async () => {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Non autorisé');
      const user = await res.json();
      return { ...user, uid: user.id };
    },
    list: async (): Promise<any[]> => {
      const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Erreur lors de la récupération des utilisateurs');
      return res.json();
    },
    approve: async (id: string) => {
      const res = await fetch(`${API_URL}/users/${id}/approve`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Erreur lors de l\'approbation de l\'utilisateur');
      return res.json();
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression de l\'utilisateur');
      return res.json();
    }
  },
  products: {
    list: async (): Promise<Product[]> => {
      const res = await fetch(`${API_URL}/products`, { headers: getHeaders() });
      return res.json();
    },
    create: async (data: any): Promise<Product> => {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Erreur lors de la création du produit');
      return res.json();
    },
    update: async (id: string, data: any): Promise<Product> => {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Erreur lors de la mise à jour du produit');
      return res.json();
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Erreur lors de la suppression du produit');
    }
  },
  sales: {
    list: async (): Promise<Sale[]> => {
      const res = await fetch(`${API_URL}/sales`, { headers: getHeaders() });
      return res.json();
    },
    create: async (data: any): Promise<Sale> => {
      const res = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Erreur lors de la création de la vente');
      return res.json();
    },
    update: async (id: string, data: any): Promise<Sale> => {
      const res = await fetch(`${API_URL}/sales/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Erreur lors de la mise à jour de la vente');
      return res.json();
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/sales/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Erreur lors de la suppression de la vente');
    }
  }
};
