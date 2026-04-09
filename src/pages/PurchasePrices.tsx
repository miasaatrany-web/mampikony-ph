import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Product } from '../types';
import { useAuth } from '../components/AuthProvider';
import { Package, Search, DollarSign, TrendingUp, TrendingDown, Trash2, X } from 'lucide-react';
import { cn } from '../lib/utils';

const PurchasePrices: React.FC = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.products.list();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPrices = async () => {
    try {
      await api.products.resetPurchasePrices();
      setIsResetModalOpen(false);
      fetchProducts();
      alert('Tous les prix d\'achat ont été remis à zéro.');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la réinitialisation des prix d\'achat.');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total inventory value based on purchase price per pillule
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.purchasePricePillule || 0) * p.totalQuantityPillules, 0);
  const totalPotentialRevenue = products.reduce((acc, p) => acc + (p.pricePillule || 0) * p.totalQuantityPillules, 0);
  const potentialProfit = totalPotentialRevenue - totalInventoryValue;

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900">Accès Refusé</h2>
          <p className="text-slate-500 mt-2">Seuls les administrateurs peuvent voir cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Prix d'Achat & Marges (Lié)</h1>
          <p className="text-slate-500 mt-2 text-lg">Suivi de la rentabilité basée sur le stock total</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="bg-rose-600 text-white font-black py-5 px-8 rounded-[2rem] flex items-center gap-4 hover:bg-rose-500 transition-all shadow-2xl shadow-rose-600/40 active:scale-95 text-xl group"
          >
            <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
              <Trash2 size={28} />
            </div>
            Réinitialiser les Prix
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center"><Package size={24} /></div>
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Valeur Stock (Achat)</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{totalInventoryValue.toLocaleString()} Ar</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center"><TrendingUp size={24} /></div>
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Revenu Potentiel</span>
          </div>
          <p className="text-3xl font-black text-brand-600">{totalPotentialRevenue.toLocaleString()} Ar</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center"><DollarSign size={24} /></div>
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Marge Potentielle</span>
          </div>
          <p className="text-3xl font-black text-brand-600">{potentialProfit.toLocaleString()} Ar</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
          <input type="text" placeholder="Rechercher un produit..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 font-medium text-lg transition-all" />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Produit</th>
                <th className="px-8 py-4">Conf. (B/Pl/Pi)</th>
                <th className="px-8 py-4">P.A (Boîte)</th>
                <th className="px-8 py-4">P.V (Boîte)</th>
                <th className="px-8 py-4">Marge (Boîte)</th>
                <th className="px-8 py-4">Valeur Totale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div></td></tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const margin = (product.priceBoite || 0) - (product.purchasePriceBoite || 0);
                  const totalValue = (product.purchasePricePillule || 0) * product.totalQuantityPillules;
                  
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors"><Package size={20} /></div>
                          <p className="font-black text-slate-900">{product.name}</p>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-xs font-bold text-slate-500">
                        1B={product.packsPerBox || 10}Pl / 1Pl={product.pillsPerPack || 10}Pi
                      </td>
                      <td className="px-8 py-5 font-bold text-slate-600">{(product.purchasePriceBoite || 0).toLocaleString()} Ar</td>
                      <td className="px-8 py-5 font-bold text-brand-600">{(product.priceBoite || 0).toLocaleString()} Ar</td>
                      <td className="px-8 py-5">
                        <div className={cn("inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", margin > 0 ? "bg-brand-100 text-brand-700" : "bg-rose-100 text-rose-700")}>
                          {margin > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {margin.toLocaleString()} Ar
                        </div>
                      </td>
                      <td className="px-8 py-5 font-black text-slate-900 text-lg">{totalValue.toLocaleString()} Ar</td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-medium">Aucun produit trouvé.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Prices Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 p-10 border border-white/20 text-center">
            <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-rose-600/10">
              <Trash2 size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Réinitialiser les prix ?</h2>
            <p className="text-slate-500 mb-10 font-medium">Cette action remettra TOUS les prix d'achat à 0 Ar. Voulez-vous continuer ?</p>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={handleResetPrices}
                className="w-full bg-rose-600 text-white font-black py-5 rounded-2xl hover:bg-rose-500 transition-all shadow-xl shadow-rose-600/20 active:scale-95 text-lg"
              >
                Oui, réinitialiser
              </button>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="w-full bg-slate-100 text-slate-600 font-black py-5 rounded-2xl hover:bg-slate-200 transition-all active:scale-95 text-lg"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasePrices;
