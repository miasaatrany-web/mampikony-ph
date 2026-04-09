import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Product } from '../types';
import { useAuth } from '../components/AuthProvider';
import { Package, Search, ArrowLeft, PlusCircle, ArrowRightLeft, X, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

const Pharmacy: React.FC = () => {
  const { user, isAdmin, isAgent, isCashier } = useAuth();
  const canManagePharmacy = isAgent || isCashier;
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [returnProduct, setReturnProduct] = useState<Product | null>(null);
  const [returnData, setReturnData] = useState({
    boites: '0',
    plaquettes: '0',
    pillules: '0',
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.products.list();
      // Filter only products that should be shown in pharmacy
      setProducts(data.filter(p => p.showInPharmacy));
    } catch (error) {
      console.error('Error fetching pharmacy products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendBackToStock = (product: Product) => {
    setReturnProduct(product);
    setReturnData({ boites: '0', plaquettes: '0', pillules: '0' });
    setIsReturnModalOpen(true);
  };

  const confirmReturn = async () => {
    if (!returnProduct) return;

    const packsPerBox = returnProduct.packsPerBox || 10;
    const pillsPerPack = returnProduct.pillsPerPack || 10;
    const pillsPerBox = packsPerBox * pillsPerPack;

    const returnPillules = 
      (parseInt(returnData.boites || '0') * pillsPerBox) + 
      (parseInt(returnData.plaquettes || '0') * pillsPerPack) + 
      parseInt(returnData.pillules || '0');

    if (returnPillules > returnProduct.pharmacyQuantityPillules) {
      alert('Quantité insuffisante en pharmacie !');
      return;
    }

    try {
      await api.products.update(returnProduct.id, {
        pharmacyQuantityPillules: returnProduct.pharmacyQuantityPillules - returnPillules,
        totalQuantityPillules: (returnProduct.totalQuantityPillules || 0) + returnPillules,
        showInStock: true,
        showInPharmacy: (returnProduct.pharmacyQuantityPillules - returnPillules) > 0
      });

      await api.inventoryLogs.create({
        productId: returnProduct.id,
        productName: returnProduct.name,
        type: 'return_to_stock',
        quantityPillules: returnPillules,
        details: `${returnData.boites} B, ${returnData.plaquettes} Pl, ${returnData.pillules} Pi`,
        userId: user?.uid,
        userName: user?.displayName
      });

      setIsReturnModalOpen(false);
      setReturnProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error sending product back to stock:', error);
    }
  };

  const handleClearPharmacy = async () => {
    try {
      await api.products.clearPharmacy();
      setIsClearModalOpen(false);
      fetchProducts();
      alert('La pharmacie a été vidée avec succès.');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression des produits de la pharmacie.');
    }
  };

  const formatStock = (totalPillules: number, packsPerBox: number = 10, pillsPerPack: number = 10) => {
    const pillsPerBox = packsPerBox * pillsPerPack;
    
    const boites = Math.floor(totalPillules / pillsPerBox);
    const remainingAfterBoites = totalPillules % pillsPerBox;
    const plaquettes = Math.floor(remainingAfterBoites / pillsPerPack);
    const pillules = remainingAfterBoites % pillsPerPack;

    const parts = [];
    if (boites > 0) parts.push(`${boites} Boîte${boites > 1 ? 's' : ''}`);
    if (plaquettes > 0) parts.push(`${plaquettes} Plaquette${plaquettes > 1 ? 's' : ''}`);
    if (pillules > 0) parts.push(`${pillules} Pillule${pillules > 1 ? 's' : ''}`);
    
    return parts.length > 0 ? parts.join(', ') : '0 Pillule';
  };

  return (
    <div className="space-y-10 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link to="/" className="text-brand-600 hover:text-brand-700 font-black flex items-center gap-1 text-sm mb-3 uppercase tracking-widest">
            <ArrowLeft size={16} />
            Retour
          </Link>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Pharmacie</h1>
          <p className="text-slate-500 mt-2 text-lg">Produits en stock interne (Pharmacie)</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/pos" className="btn-secondary !bg-slate-900 !text-white !border-none">
            <PlusCircle size={24} />
            Nouvelle Vente
          </Link>
          {isAdmin && (
            <button 
              onClick={() => setIsClearModalOpen(true)} 
              className="btn-danger !bg-rose-50 !text-rose-600 !border-rose-100 hover:!bg-rose-100"
            >
              <Trash2 size={24} />
              Vider la Pharmacie
            </button>
          )}
        </div>
      </header>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
          <input
            type="text"
            placeholder="Rechercher dans la pharmacie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 font-medium text-lg placeholder:text-slate-400 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Produit</th>
                <th className="px-8 py-4">Configuration</th>
                <th className="px-8 py-4">Stock Total</th>
                <th className="px-8 py-4">Prix Vente (B/Pl/Pi)</th>
                <th className="px-8 py-4">Statut</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const isLowStock = product.totalQuantityPillules <= (product.lowStockThresholdPillules || 50);
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                            isLowStock ? "bg-amber-100 text-amber-600" : "bg-brand-50 text-brand-600"
                          )}>
                            <Package size={24} />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-lg">{product.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Source: {product.source === 'grossiste' ? product.grossisteName : product.source}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs font-bold text-slate-600">1 B = {product.packsPerBox || 10} Pl</p>
                        <p className="text-xs font-bold text-slate-600">1 Pl = {product.pillsPerPack || 10} Pi</p>
                      </td>
                      <td className="px-8 py-5">
                        <p className={cn("font-black text-lg", isLowStock ? "text-amber-600" : "text-slate-900")}>
                          {formatStock(product.pharmacyQuantityPillules, product.packsPerBox, product.pillsPerPack)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Total: {product.pharmacyQuantityPillules} Pillules</p>
                      </td>
                      <td className="px-8 py-5 font-bold text-slate-600 text-sm">
                        {(product.priceBoite || 0).toLocaleString()} / {(product.pricePlaquette || 0).toLocaleString()} / {(product.pricePillule || 0).toLocaleString()} Ar
                      </td>
                      <td className="px-8 py-5">
                        {isLowStock ? (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-full">Stock Faible</span>
                        ) : (
                          <span className="px-3 py-1 bg-brand-100 text-brand-700 text-[10px] font-black uppercase tracking-wider rounded-full">En Stock</span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right">
                        {isAdmin && (
                          <button onClick={() => handleSendBackToStock(product)} className="btn-secondary !bg-slate-100 !text-slate-600 !border-none !px-4 !py-2 !text-[10px]">
                            <ArrowRightLeft size={16} /> Renvoyer au Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium">Aucun produit trouvé dans la pharmacie.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return to Stock Modal */}
      {isReturnModalOpen && returnProduct && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/20">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <h2 className="text-xl font-black flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
                  <ArrowRightLeft size={20} />
                </div>
                Renvoyer au Stock Principal
              </h2>
              <button onClick={() => setIsReturnModalOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <p className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Produit: <span className="text-slate-900">{returnProduct.name}</span></p>
                <p className="text-xs font-bold text-slate-400 mb-6 uppercase">Disponible en pharmacie: {formatStock(returnProduct.pharmacyQuantityPillules, returnProduct.packsPerBox, returnProduct.pillsPerPack)}</p>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Boîtes</label>
                    <input type="number" value={returnData.boites} onChange={(e) => setReturnData({ ...returnData, boites: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Plaquettes</label>
                    <input type="number" value={returnData.plaquettes} onChange={(e) => setReturnData({ ...returnData, plaquettes: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Pillules</label>
                    <input type="number" value={returnData.pillules} onChange={(e) => setReturnData({ ...returnData, pillules: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={confirmReturn} className="flex-1 bg-brand-600 text-white font-black py-4 rounded-2xl hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/20 active:scale-95">Confirmer le renvoi</button>
                <button onClick={() => setIsReturnModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all active:scale-95">Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Pharmacy Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center">
            <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
              <Trash2 size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3">Vider la pharmacie ?</h2>
            <p className="text-slate-500 mb-10">Voulez-vous vraiment retirer tous les produits de la pharmacie ? Les quantités seront remises à zéro et les produits ne seront plus visibles dans la pharmacie ni dans la vente.</p>
            <div className="flex flex-col gap-4">
              <button onClick={handleClearPharmacy} className="w-full bg-rose-600 text-white font-black py-5 rounded-2xl hover:bg-rose-500 transition-all text-lg">Oui, tout vider</button>
              <button onClick={() => setIsClearModalOpen(false)} className="w-full bg-slate-100 text-slate-600 font-black py-5 rounded-2xl hover:bg-slate-200 transition-all text-lg">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pharmacy;
