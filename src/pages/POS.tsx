import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Product, SaleItem } from '../types';
import { useAuth } from '../components/AuthProvider';
import { ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle, User, Receipt, X, ArrowLeft, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const POS: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastSaleId, setLastSaleId] = useState('');

  const fetchProducts = async () => {
    try {
      const data = await api.products.list();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.quantity > 0
  );

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.quantity) {
        setCart(cart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price
      }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (newQty > 0 && newQty <= product.quantity) {
          return { ...item, quantity: newQty };
        }
      }
      return item;
    }));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const saleData = {
        customerName,
        items: cart,
        total,
        agentId: user?.uid,
        agentName: user?.displayName,
        status: 'pending'
      };

      const res = await api.sales.create(saleData);
      setLastSaleId(res.id);
      setIsSuccessModalOpen(true);
      setCart([]);
      setCustomerName('');
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la validation de la vente.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 h-[calc(100vh-12rem)] pb-12">
      {/* Product Selection */}
      <div className="lg:col-span-2 flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Link to="/" className="text-brand-600 hover:text-brand-700 font-black flex items-center gap-1 text-sm uppercase tracking-widest">
            <ArrowLeft size={16} />
            Retour
          </Link>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/20">
              <ShoppingCart size={24} />
            </div>
            Caisse
          </h1>
        </header>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="relative">
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

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:border-brand-500 hover:shadow-xl transition-all text-left flex flex-col justify-between group relative overflow-hidden active:scale-95"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-600/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-brand-600/10 transition-colors" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <span className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full",
                    product.quantity <= 5 ? "bg-amber-100 text-amber-700" : "bg-brand-100 text-brand-700"
                  )}>
                    {product.quantity} en stock
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-brand-600 group-hover:text-white transition-all shadow-sm">
                    <Plus size={20} />
                  </div>
                </div>
                <h3 className="font-black text-slate-900 text-xl leading-tight mb-2">{product.name}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 mb-4">
                  <Calendar size={12} />
                  Exp: {format(new Date(product.expirationDate), 'MM/yyyy')}
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <p className="text-2xl font-black text-brand-600">{product.price.toLocaleString()} Ar</p>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Ajouter</span>
                </div>
              </div>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Search className="text-slate-300" size={40} />
              </div>
              <p className="text-slate-900 font-black text-xl mb-2">Aucun produit trouvé</p>
              <p className="text-slate-500 font-medium">Essayez de modifier vos critères de recherche.</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart / Checkout */}
      <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden text-white border border-white/10 relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-brand-600/10 blur-3xl -translate-y-1/2" />
        <div className="p-8 border-b border-white/10 relative z-10 flex items-center justify-between">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <Receipt size={24} className="text-brand-500" />
            Panier
          </h2>
          <div className="flex items-center gap-3">
            {cart.length > 0 && (
              <button 
                onClick={() => setCart([])}
                className="text-white/40 hover:text-rose-500 transition-colors p-2 rounded-xl hover:bg-rose-500/10"
                title="Vider le panier"
              >
                <Trash2 size={20} />
              </button>
            )}
            <span className="bg-brand-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
              {cart.length} articles
            </span>
          </div>
        </div>

        <div className="p-6 border-b border-white/10 relative z-10 space-y-4">
          <p className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em]">Informations Client</p>
          <div className="relative">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-500" size={20} />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white/10 border-2 border-white/10 rounded-2xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 outline-none font-black text-lg placeholder:text-white/20 transition-all text-white"
              placeholder="NOM DU CLIENT..."
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10">
          {cart.length > 0 ? (
            cart.map(item => (
              <div key={item.productId} className="bg-white/5 p-5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg leading-tight truncate">{item.productName}</p>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">{item.price.toLocaleString()} Ar / unité</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                    title="Retirer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 bg-white/10 rounded-2xl p-1.5 border border-white/10">
                    <button
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-brand-600 text-white transition-all shadow-sm active:scale-90"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-8 text-center font-black text-lg">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-brand-600 text-white transition-all shadow-sm active:scale-90"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <p className="font-black text-2xl text-brand-500">{(item.price * item.quantity).toLocaleString()} Ar</p>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-white/20 gap-4 py-12">
              <ShoppingCart size={64} strokeWidth={1} className="opacity-20" />
              <p className="font-black text-xl italic">Le panier est vide</p>
            </div>
          )}
        </div>

        <div className="p-8 bg-white/5 border-t border-white/10 space-y-6 relative z-10">
          <div className="flex justify-between items-end">
            <span className="text-white/40 font-black uppercase tracking-widest text-xs">Total à payer</span>
            <span className="text-4xl font-black text-brand-500">{total.toLocaleString()} Ar</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={cn(
              "w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95",
              cart.length > 0
                ? "bg-brand-600 text-white hover:bg-brand-500 shadow-brand-600/30"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            )}
          >
            Valider la vente
            <CheckCircle size={24} />
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 text-center p-10 border border-white/20">
            <div className="w-24 h-24 bg-brand-100 text-brand-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-brand-600/10">
              <CheckCircle size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Vente validée !</h2>
            <p className="text-slate-500 mb-10 font-medium">La transaction a été enregistrée avec succès.<br/><span className="text-brand-600 font-bold">Facture #{lastSaleId.slice(-6)}</span></p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setIsSuccessModalOpen(false)}
                className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95 text-lg"
              >
                Nouvelle vente
              </button>
              <button
                onClick={() => setIsSuccessModalOpen(false)}
                className="w-full bg-slate-100 text-slate-600 font-black py-5 rounded-2xl hover:bg-slate-200 transition-all active:scale-95 text-lg"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
