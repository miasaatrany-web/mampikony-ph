import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Product } from '../types';
import { useAuth } from '../components/AuthProvider';
import { db, collection, query, onSnapshot, handleFirestoreError, OperationType } from '../firebase';
import { Package, Plus, Search, Edit2, Trash2, X, AlertCircle, Calendar, DollarSign, Layers, ArrowLeft, PlusCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link, useLocation } from 'react-router-dom';

const Stock: React.FC = () => {
  const { isAdmin, isAgent } = useAuth();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    quantity: '',
    expirationDate: '',
    lowStockThreshold: '5'
  });

  useEffect(() => {
    setLoading(true);
    const path = 'products';
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => doc.data() as Product);
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    // Check if we should open the modal from navigation state
    if (location.state && (location.state as any).openModal) {
      setIsModalOpen(true);
      // Clear state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }

    return () => unsubscribe();
  }, [location, isAdmin, isAgent]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        quantity: product.quantity.toString(),
        expirationDate: product.expirationDate,
        lowStockThreshold: (product.lowStockThreshold || 5).toString()
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        quantity: '',
        expirationDate: '',
        lowStockThreshold: '5'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      expirationDate: formData.expirationDate,
      lowStockThreshold: parseInt(formData.lowStockThreshold)
    };

    try {
      if (editingProduct) {
        await api.products.update(editingProduct.id, data);
      } else {
        await api.products.create(data);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'enregistrement du produit.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        await api.products.delete(id);
      } catch (err) {
        console.error(err);
        alert('Erreur lors de la suppression.');
      }
    }
  };

  return (
    <div className="space-y-10 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link to="/" className="text-brand-600 hover:text-brand-700 font-black flex items-center gap-1 text-sm mb-3 uppercase tracking-widest">
            <ArrowLeft size={16} />
            Retour
          </Link>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Gestion du Stock</h1>
          <p className="text-slate-500 mt-2 text-lg">Gérez l'inventaire de vos médicaments en temps réel.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link 
            to="/pos" 
            className="btn-secondary !bg-slate-900 !text-white !border-none"
          >
            <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
              <PlusCircle size={28} />
            </div>
            Nouvelle Vente
          </Link>
          {isAgent && (
            <button
              onClick={() => handleOpenModal()}
              className="btn-primary"
            >
              <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
                <Plus size={28} />
              </div>
              Ajouter un produit
            </button>
          )}
        </div>
      </header>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
          <input
            type="text"
            placeholder="Rechercher un médicament ou un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 font-medium text-lg placeholder:text-slate-400 transition-all"
          />
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Produit</th>
                <th className="px-8 py-4">Prix</th>
                <th className="px-8 py-4">Quantité</th>
                <th className="px-8 py-4">Expiration</th>
                <th className="px-8 py-4">Statut</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const isLowStock = product.quantity <= (product.lowStockThreshold || 5);
                  const isExpired = new Date(product.expirationDate) < new Date();

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                            isExpired ? "bg-rose-100 text-rose-600" : isLowStock ? "bg-amber-100 text-amber-600" : "bg-brand-50 text-brand-600"
                          )}>
                            <Package size={24} />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-lg">{product.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {product.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-black text-slate-900 text-lg">{product.price.toLocaleString()} Ar</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-black text-lg",
                            isLowStock ? "text-amber-600" : "text-slate-900"
                          )}>
                            {product.quantity}
                          </span>
                          <span className="text-slate-400 font-bold text-sm">unités</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className={cn(
                          "flex items-center gap-2 font-bold",
                          isExpired ? "text-rose-600" : "text-slate-500"
                        )}>
                          <Calendar size={16} />
                          {format(new Date(product.expirationDate), 'dd MMM yyyy', { locale: fr })}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        {isExpired ? (
                          <span className="px-3 py-1 bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider rounded-full">Expiré</span>
                        ) : isLowStock ? (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-full">Stock Faible</span>
                        ) : (
                          <span className="px-3 py-1 bg-brand-100 text-brand-700 text-[10px] font-black uppercase tracking-wider rounded-full">En Stock</span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {isAgent && (
                            <button
                              onClick={() => handleOpenModal(product)}
                              className="px-4 py-2 flex items-center gap-2 bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95 border border-brand-100 text-xs font-black uppercase tracking-widest"
                            >
                              <Edit2 size={16} />
                              Modifier
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="px-4 py-2 flex items-center gap-2 bg-danger-50 text-danger-600 hover:bg-danger-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95 border border-danger-100 text-xs font-black uppercase tracking-widest"
                            >
                              <Trash2 size={16} />
                              Supprimer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="max-w-xs mx-auto">
                      <div className="bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <Search className="text-slate-300" size={40} />
                      </div>
                      <p className="text-slate-900 font-black text-xl mb-2">Aucun produit trouvé</p>
                      <p className="text-slate-500 font-medium">Essayez de modifier vos critères de recherche.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-white/20">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <h2 className="text-2xl font-black flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/20">
                  {editingProduct ? <Edit2 size={20} /> : <Plus size={20} />}
                </div>
                {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-colors relative z-10">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du médicament</label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                    placeholder="Ex: Paracétamol 500mg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix (Ar)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'expiration</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="date"
                      required
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seuil d'alerte</label>
                  <div className="relative">
                    <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.lowStockThreshold}
                      onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
                >
                  {editingProduct ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Mobile FAB for Stock */}
      <div className="md:hidden fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
        {isAgent && (
          <>
            <button
              onClick={() => handleOpenModal()}
              className="w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform border-2 border-white/20"
              title="Ajouter Produit"
            >
              <Plus size={24} />
            </button>
            <Link 
              to="/pos" 
              className="w-16 h-16 bg-brand-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform border-4 border-white/20"
              title="Nouvelle Vente"
            >
              <PlusCircle size={32} />
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Stock;
