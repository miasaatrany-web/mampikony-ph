import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Product } from '../types';
import { useAuth } from '../components/AuthProvider';
import { Package, Plus, Search, Edit2, Trash2, X, AlertCircle, DollarSign, Layers, ArrowLeft, PlusCircle, ArrowRightLeft, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link, useLocation } from 'react-router-dom';

const Stock: React.FC = () => {
  const { user, isAdmin, isAgent, isCashier } = useAuth();
  const canManageStock = isAgent || isCashier;
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferProduct, setTransferProduct] = useState<Product | null>(null);
  const [transferData, setTransferData] = useState({
    boites: '0',
    plaquettes: '0',
    pillules: '0',
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [exitProduct, setExitProduct] = useState<Product | null>(null);
  const [exitData, setExitData] = useState({
    boites: '0',
    plaquettes: '0',
    pillules: '0',
    reason: ''
  });
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    priceBoite: '',
    pricePlaquette: '',
    pricePillule: '',
    purchasePriceBoite: '',
    purchasePricePlaquette: '',
    purchasePricePillule: '',
    packsPerBox: '10',
    pillsPerPack: '10',
    totalQuantityPillules: '',
    pharmacyQuantityPillules: '0',
    addBoites: '0',
    addPlaquettes: '0',
    addPillules: '0',
    lowStockThresholdPillules: '50',
    source: 'pharmacie' as 'pharmacie' | 'grossiste',
    grossisteName: '',
    showInPharmacy: false,
    showInStock: true,
  });

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

  useEffect(() => {
    fetchProducts();
    if (location.state && (location.state as any).openModal) {
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleTransferToPharmacy = (product: Product) => {
    setTransferProduct(product);
    setTransferData({ boites: '0', plaquettes: '0', pillules: '0' });
    setIsTransferModalOpen(true);
  };

  const handleExitStock = (product: Product) => {
    setExitProduct(product);
    setExitData({ boites: '0', plaquettes: '0', pillules: '0', reason: '' });
    setIsExitModalOpen(true);
  };

  const confirmTransfer = async () => {
    if (!transferProduct) return;

    const packsPerBox = transferProduct.packsPerBox || 10;
    const pillsPerPack = transferProduct.pillsPerPack || 10;
    const pillsPerBox = packsPerBox * pillsPerPack;

    const transferPillules = 
      (parseInt(transferData.boites || '0') * pillsPerBox) + 
      (parseInt(transferData.plaquettes || '0') * pillsPerPack) + 
      parseInt(transferData.pillules || '0');

    if (transferPillules > transferProduct.totalQuantityPillules) {
      alert('Quantité insuffisante en stock !');
      return;
    }

    try {
      await api.products.update(transferProduct.id, {
        totalQuantityPillules: transferProduct.totalQuantityPillules - transferPillules,
        pharmacyQuantityPillules: (transferProduct.pharmacyQuantityPillules || 0) + transferPillules,
        showInPharmacy: true,
        showInStock: (transferProduct.totalQuantityPillules - transferPillules) > 0
      });

      await api.inventoryLogs.create({
        productId: transferProduct.id,
        productName: transferProduct.name,
        type: 'transfer_to_pharmacy',
        quantityPillules: transferPillules,
        details: `${transferData.boites} B, ${transferData.plaquettes} Pl, ${transferData.pillules} Pi`,
        userId: user?.uid,
        userName: user?.displayName
      });

      setIsTransferModalOpen(false);
      setTransferProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error transferring product to pharmacy:', error);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.showInStock
  );

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        priceBoite: (product.priceBoite || 0).toString(),
        pricePlaquette: (product.pricePlaquette || 0).toString(),
        pricePillule: (product.pricePillule || 0).toString(),
        purchasePriceBoite: (product.purchasePriceBoite || 0).toString(),
        purchasePricePlaquette: (product.purchasePricePlaquette || 0).toString(),
        purchasePricePillule: (product.purchasePricePillule || 0).toString(),
        packsPerBox: (product.packsPerBox || 10).toString(),
        pillsPerPack: (product.pillsPerPack || 10).toString(),
        totalQuantityPillules: (product.totalQuantityPillules || 0).toString(),
        pharmacyQuantityPillules: (product.pharmacyQuantityPillules || 0).toString(),
        addBoites: '0',
        addPlaquettes: '0',
        addPillules: '0',
        lowStockThresholdPillules: (product.lowStockThresholdPillules || 50).toString(),
        source: product.source || 'pharmacie',
        grossisteName: product.grossisteName || '',
        showInPharmacy: product.showInPharmacy ?? true,
        showInStock: product.showInStock ?? true,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        priceBoite: '',
        pricePlaquette: '',
        pricePillule: '',
        purchasePriceBoite: '',
        purchasePricePlaquette: '',
        purchasePricePillule: '',
        packsPerBox: '10',
        pillsPerPack: '10',
        totalQuantityPillules: '',
        pharmacyQuantityPillules: '0',
        addBoites: '0',
        addPlaquettes: '0',
        addPillules: '0',
        lowStockThresholdPillules: '50',
        source: 'pharmacie',
        grossisteName: '',
        showInPharmacy: false,
        showInStock: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const packsPerBox = parseInt(formData.packsPerBox || '10');
    const pillsPerPack = parseInt(formData.pillsPerPack || '10');
    const pillsPerBox = packsPerBox * pillsPerPack;

    const addedPillules = 
      (parseInt(formData.addBoites || '0') * pillsPerBox) + 
      (parseInt(formData.addPlaquettes || '0') * pillsPerPack) + 
      parseInt(formData.addPillules || '0');

    const data = {
      name: formData.name,
      priceBoite: parseFloat(formData.priceBoite || '0'),
      pricePlaquette: parseFloat(formData.pricePlaquette || '0'),
      pricePillule: parseFloat(formData.pricePillule || '0'),
      purchasePriceBoite: parseFloat(formData.purchasePriceBoite || '0'),
      purchasePricePlaquette: parseFloat(formData.purchasePricePlaquette || '0'),
      purchasePricePillule: parseFloat(formData.purchasePricePillule || '0'),
      packsPerBox,
      pillsPerPack,
      totalQuantityPillules: editingProduct ? (editingProduct.totalQuantityPillules + addedPillules) : addedPillules,
      pharmacyQuantityPillules: editingProduct ? editingProduct.pharmacyQuantityPillules : 0,
      lowStockThresholdPillules: parseInt(formData.lowStockThresholdPillules || '50'),
      source: formData.source,
      grossisteName: formData.grossisteName,
      showInPharmacy: editingProduct ? formData.showInPharmacy : false,
      showInStock: editingProduct ? formData.showInStock : true,
    };

    try {
      let res: any;
      if (editingProduct) {
        const updateData = isAdmin ? data : { 
          totalQuantityPillules: data.totalQuantityPillules, 
          source: data.source,
          grossisteName: data.grossisteName,
          showInPharmacy: data.showInPharmacy,
          showInStock: data.showInStock
        };
        await api.products.update(editingProduct.id, updateData);
        res = { ...editingProduct, ...updateData };
      } else {
        const existingProduct = products.find(
          p => p.name.toLowerCase() === data.name.toLowerCase()
        );

        if (existingProduct) {
          const updatedQuantity = existingProduct.totalQuantityPillules + addedPillules;
          const updateData: any = { 
            totalQuantityPillules: updatedQuantity,
            source: data.source,
            grossisteName: data.grossisteName
          };
          if (isAdmin) {
            updateData.priceBoite = data.priceBoite;
            updateData.pricePlaquette = data.pricePlaquette;
            updateData.pricePillule = data.pricePillule;
            updateData.purchasePriceBoite = data.purchasePriceBoite;
            updateData.purchasePricePlaquette = data.purchasePricePlaquette;
            updateData.purchasePricePillule = data.purchasePricePillule;
            updateData.packsPerBox = data.packsPerBox;
            updateData.pillsPerPack = data.pillsPerPack;
          }
          await api.products.update(existingProduct.id, updateData);
          res = { ...existingProduct, ...updateData };
          alert(`Stock mis à jour pour ${existingProduct.name}. Nouveau total : ${formatStock(updatedQuantity, data.packsPerBox, data.pillsPerPack)}`);
        } else {
          res = await api.products.create(data);
        }
      }

      if (addedPillules > 0 && res) {
        await api.inventoryLogs.create({
          productId: res.id || editingProduct?.id || res.productId,
          productName: res.name || editingProduct?.name,
          type: 'addition',
          quantityPillules: addedPillules,
          details: `${formData.addBoites} B, ${formData.addPlaquettes} Pl, ${formData.addPillules} Pi`,
          userId: user?.uid,
          userName: user?.displayName
        });
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'enregistrement.');
    }
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await api.products.delete(productToDelete);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression.');
    }
  };

  const confirmExitStock = async () => {
    if (!exitProduct || !exitData.reason) {
      alert('Veuillez indiquer la cause de la sortie.');
      return;
    }

    const packsPerBox = exitProduct.packsPerBox || 10;
    const pillsPerPack = exitProduct.pillsPerPack || 10;
    const pillsPerBox = packsPerBox * pillsPerPack;

    const exitPillules = 
      (parseInt(exitData.boites || '0') * pillsPerBox) + 
      (parseInt(exitData.plaquettes || '0') * pillsPerPack) + 
      parseInt(exitData.pillules || '0');

    if (exitPillules <= 0) {
      alert('Veuillez indiquer une quantité valide.');
      return;
    }

    if (exitPillules > exitProduct.totalQuantityPillules) {
      alert('Quantité insuffisante en stock !');
      return;
    }

    try {
      await api.products.update(exitProduct.id, {
        totalQuantityPillules: exitProduct.totalQuantityPillules - exitPillules,
        showInStock: (exitProduct.totalQuantityPillules - exitPillules) > 0
      });

      // Log the exit
      await api.inventoryLogs.create({
        productId: exitProduct.id,
        productName: exitProduct.name,
        type: 'stock_exit',
        quantityPillules: exitPillules,
        details: `Sortie: ${formatStock(exitPillules, packsPerBox, pillsPerPack)} - Cause: ${exitData.reason}`,
        userId: user?.uid || '',
        userName: user?.displayName || 'Admin'
      });

      setIsExitModalOpen(false);
      fetchProducts();
      alert('Sortie de stock enregistrée avec succès.');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la sortie de stock.');
    }
  };

  const handleResetQuantities = async () => {
    try {
      await api.products.resetQuantities();
      setIsResetModalOpen(false);
      fetchProducts();
      alert('Toutes les quantités ont été réinitialisées à zéro.');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la réinitialisation.');
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
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/20">
              <Package size={24} />
            </div>
            Gestion du Stock
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Gérez vos produits et votre inventaire principal.</p>
          <div className="mt-4">
            <Link to="/inventory-history" className="text-brand-600 font-bold hover:underline flex items-center gap-2 text-sm">
              <Clock size={16} />
              Historique des mouvements
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/pos" className="btn-secondary !bg-slate-900 !text-white !border-none">
            <PlusCircle size={24} />
            Nouvelle Vente
          </Link>
          {canManageStock && (
            <button onClick={() => handleOpenModal()} className="btn-primary">
              <Plus size={24} />
              Ajouter un produit
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={() => setIsResetModalOpen(true)} 
              className="btn-danger !bg-rose-50 !text-rose-600 !border-rose-100 hover:!bg-rose-100"
            >
              <Trash2 size={24} />
              Réinitialiser les stocks
            </button>
          )}
        </div>
      </header>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
          <input
            type="text"
            placeholder="Rechercher un médicament..."
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
                  <td colSpan={6} className="px-8 py-20 text-center">
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
                              {product.source === 'grossiste' ? product.grossisteName : product.source}
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
                          {formatStock(product.totalQuantityPillules, product.packsPerBox, product.pillsPerPack)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Total: {product.totalQuantityPillules} Pillules</p>
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
                        <div className="flex items-center justify-end gap-3">
                          {isAdmin && (
                            <button onClick={() => handleTransferToPharmacy(product)} className="btn-secondary !bg-brand-50 !text-brand-600 !border-none !px-4 !py-2 !text-[10px]">
                              <ArrowRightLeft size={16} /> Transférer
                            </button>
                          )}
                          {canManageStock && (
                            <button onClick={() => handleOpenModal(product)} className="btn-info !px-4 !py-2 !text-[10px]">
                              <Edit2 size={16} /> Modifier
                            </button>
                          )}
                          {isAdmin && (
                            <>
                              <button onClick={() => handleExitStock(product)} className="btn-secondary !bg-rose-50 !text-rose-600 !border-none !px-4 !py-2 !text-[10px]">
                                <Trash2 size={16} /> Sortie
                              </button>
                              <button onClick={() => { setProductToDelete(product.id); setIsDeleteModalOpen(true); }} className="btn-danger !px-4 !py-2 !text-[10px]">
                                <Trash2 size={16} /> Supprimer
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-medium">Aucun produit trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
                  {editingProduct ? <Edit2 size={20} /> : <Plus size={20} />}
                </div>
                {editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wider">Nom du médicament</label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text" required disabled={editingProduct !== null && !isAdmin} value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all disabled:opacity-50"
                    placeholder="Ex: Paracétamol 500mg"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  {editingProduct ? 'Ajouter du stock' : 'Stock Initial'}
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Boîtes</label>
                    <input type="number" value={formData.addBoites} onChange={(e) => setFormData({ ...formData, addBoites: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Plaquettes</label>
                    <input type="number" value={formData.addPlaquettes} onChange={(e) => setFormData({ ...formData, addPlaquettes: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Pillules</label>
                    <input type="number" value={formData.addPillules} onChange={(e) => setFormData({ ...formData, addPillules: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl" />
                  </div>
                </div>
                {editingProduct && (
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Stock actuel : {formatStock(editingProduct.totalQuantityPillules, editingProduct.packsPerBox, editingProduct.pillsPerPack)}</p>
                )}
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Provenance & Affichage</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Source</label>
                    <select value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value as any })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold">
                      <option value="pharmacie">Pharmacie</option>
                      <option value="grossiste">Grossiste</option>
                    </select>
                  </div>
                  {formData.source === 'grossiste' && (
                    <div>
                      <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Nom du grossiste</label>
                      <input
                        type="text"
                        value={formData.grossisteName}
                        onChange={(e) => setFormData({ ...formData, grossisteName: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl"
                        placeholder="Ex: Salama..."
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  {editingProduct && isAdmin && (
                    <>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={formData.showInPharmacy} 
                          onChange={(e) => setFormData({ ...formData, showInPharmacy: e.target.checked })}
                          className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-sm font-bold text-slate-700 group-hover:text-brand-600 transition-colors">Afficher dans la page Pharmacie</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={formData.showInStock} 
                          onChange={(e) => setFormData({ ...formData, showInStock: e.target.checked })}
                          className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-sm font-bold text-slate-700 group-hover:text-brand-600 transition-colors">Afficher dans la Gestion de Stock</span>
                      </label>
                    </>
                  )}
                </div>
              </div>

              {!isAdmin && editingProduct && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <p className="text-xs text-amber-800 font-bold leading-tight">
                    En tant qu'agent ou caissier, vous ne pouvez qu'ajouter du stock. Les prix et configurations sont réservés aux administrateurs.
                  </p>
                </div>
              )}

              {isAdmin && (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Configuration des unités</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Plaquettes par Boîte</label>
                        <input type="number" required value={formData.packsPerBox} onChange={(e) => setFormData({ ...formData, packsPerBox: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl" />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Pillules par Plaquette</label>
                        <input type="number" required value={formData.pillsPerPack} onChange={(e) => setFormData({ ...formData, pillsPerPack: e.target.value })} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Prix Vente Boîte</label>
                      <input type="number" required value={formData.priceBoite} onChange={(e) => setFormData({ ...formData, priceBoite: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Prix Vente Plaquette</label>
                      <input type="number" required value={formData.pricePlaquette} onChange={(e) => setFormData({ ...formData, pricePlaquette: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Prix Vente Pillule</label>
                      <input type="number" required value={formData.pricePillule} onChange={(e) => setFormData({ ...formData, pricePillule: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Prix Achat Boîte</label>
                      <input type="number" required value={formData.purchasePriceBoite} onChange={(e) => setFormData({ ...formData, purchasePriceBoite: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Prix Achat Plaquette</label>
                      <input type="number" required value={formData.purchasePricePlaquette} onChange={(e) => setFormData({ ...formData, purchasePricePlaquette: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Prix Achat Pillule</label>
                      <input type="number" required value={formData.purchasePricePillule} onChange={(e) => setFormData({ ...formData, purchasePricePillule: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wider">Seuil d'alerte (Pillules)</label>
                      <input type="number" required value={formData.lowStockThresholdPillules} onChange={(e) => setFormData({ ...formData, lowStockThresholdPillules: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all">Annuler</button>
                <button type="submit" className="btn-primary flex-1">{editingProduct ? 'Mettre à jour' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && transferProduct && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/20">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <h2 className="text-xl font-black flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
                  <ArrowRightLeft size={20} />
                </div>
                Transférer vers Pharmacie
              </h2>
              <button onClick={() => setIsTransferModalOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <p className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Produit: <span className="text-slate-900">{transferProduct.name}</span></p>
                <p className="text-xs font-bold text-slate-400 mb-6 uppercase">Disponible en stock: {formatStock(transferProduct.totalQuantityPillules, transferProduct.packsPerBox, transferProduct.pillsPerPack)}</p>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Boîtes</label>
                    <input type="number" value={transferData.boites} onChange={(e) => setTransferData({ ...transferData, boites: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Plaquettes</label>
                    <input type="number" value={transferData.plaquettes} onChange={(e) => setTransferData({ ...transferData, plaquettes: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Pillules</label>
                    <input type="number" value={transferData.pillules} onChange={(e) => setTransferData({ ...transferData, pillules: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={confirmTransfer} className="flex-1 bg-brand-600 text-white font-black py-4 rounded-2xl hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/20 active:scale-95">Confirmer le transfert</button>
                <button onClick={() => setIsTransferModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all active:scale-95">Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center">
            <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
              <Trash2 size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3">Supprimer ?</h2>
            <p className="text-slate-500 mb-10">Cette action est irréversible.</p>
            <div className="flex flex-col gap-4">
              <button onClick={confirmDelete} className="w-full bg-rose-600 text-white font-black py-5 rounded-2xl hover:bg-rose-500 transition-all text-lg">Oui, supprimer</button>
              <button onClick={() => setIsDeleteModalOpen(false)} className="w-full bg-slate-100 text-slate-600 font-black py-5 rounded-2xl hover:bg-slate-200 transition-all text-lg">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Quantities Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center">
            <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
              <AlertCircle size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3">Réinitialiser ?</h2>
            <p className="text-slate-500 mb-10">Voulez-vous vraiment remettre à zéro toutes les quantités en stock et en pharmacie ? Les noms et prix resteront inchangés.</p>
            <div className="flex flex-col gap-4">
              <button onClick={handleResetQuantities} className="w-full bg-rose-600 text-white font-black py-5 rounded-2xl hover:bg-rose-500 transition-all text-lg">Oui, réinitialiser tout</button>
              <button onClick={() => setIsResetModalOpen(false)} className="w-full bg-slate-100 text-slate-600 font-black py-5 rounded-2xl hover:bg-slate-200 transition-all text-lg">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Stock Modal */}
      {isExitModalOpen && exitProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20">
            <div className="bg-rose-600 p-8 text-white flex justify-between items-center">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Trash2 size={20} />
                </div>
                Sortie de Stock (Gratuit)
              </h2>
              <button onClick={() => setIsExitModalOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <p className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Produit: <span className="text-slate-900">{exitProduct.name}</span></p>
                <p className="text-xs font-bold text-slate-400 mb-6 uppercase">Disponible en stock: {formatStock(exitProduct.totalQuantityPillules, exitProduct.packsPerBox, exitProduct.pillsPerPack)}</p>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Boîtes</label>
                    <input type="number" value={exitData.boites} onChange={(e) => setExitData({ ...exitData, boites: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Plaquettes</label>
                    <input type="number" value={exitData.plaquettes} onChange={(e) => setExitData({ ...exitData, plaquettes: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Pillules</label>
                    <input type="number" value={exitData.pillules} onChange={(e) => setExitData({ ...exitData, pillules: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1 uppercase">Cause de la sortie</label>
                  <textarea 
                    value={exitData.reason} 
                    onChange={(e) => setExitData({ ...exitData, reason: e.target.value })} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[100px]"
                    placeholder="Ex: Produit périmé, Don, Échantillon gratuit..."
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={confirmExitStock} className="flex-1 bg-rose-600 text-white font-black py-4 rounded-2xl hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/20 active:scale-95">Confirmer la sortie</button>
                <button onClick={() => setIsExitModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all active:scale-95">Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stock;
