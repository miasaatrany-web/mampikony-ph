import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Product, SaleItem, Sale } from '../types';
import { useAuth } from '../components/AuthProvider';
import { db, collection, query, onSnapshot, handleFirestoreError, OperationType } from '../firebase';
import { ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle, User, Receipt, X, ArrowLeft, Calendar, PlusCircle, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const POS: React.FC = () => {
  const { user, isAgent, isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastSaleId, setLastSaleId] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [hasTransmitted, setHasTransmitted] = useState(false);

  const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products');

  useEffect(() => {
    const path = 'products';
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => doc.data() as Product);
      setProducts(productsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
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

  const handleCheckout = async (transmit: boolean = false) => {
    if (cart.length === 0 || isCheckingOut) return;
    setIsCheckingOut(true);

    try {
      const saleData: Partial<Sale> = {
        customerName,
        items: cart,
        total,
        agentId: user?.uid || '',
        agentName: user?.displayName || '',
        status: 'pending'
      };

      const res = await api.sales.create(saleData);
      setLastSaleId(res.id);
      setIsSuccessModalOpen(true);
      setHasTransmitted(false);
      
      if (transmit) {
        await handleTransmitToAdmin();
      }

      setCart([]);
      setCustomerName('');
      setActiveTab('products');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la validation de la vente. Veuillez réessayer.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleTransmitToAdmin = async () => {
    setIsTransmitting(true);
    // Simulate API call to notify admin
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsTransmitting(false);
    setHasTransmitted(true);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full lg:h-[calc(100vh-10rem)] pb-6">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex bg-slate-100 p-1.5 rounded-2xl mb-2">
        <button
          onClick={() => setActiveTab('products')}
          className={cn(
            "flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2",
            activeTab === 'products' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500"
          )}
        >
          <PlusCircle size={18} />
          Produits
        </button>
        <button
          onClick={() => setActiveTab('cart')}
          className={cn(
            "flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 relative",
            activeTab === 'cart' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500"
          )}
        >
          <ShoppingCart size={18} />
          Panier
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Product Selection */}
      <div className={cn(
        "lg:flex lg:flex-col lg:flex-1 gap-6 min-w-0",
        activeTab === 'products' ? "flex flex-col" : "hidden lg:flex"
      )}>
        <header className="flex flex-col gap-2">
          <Link to="/" className="text-brand-600 hover:text-brand-700 font-black flex items-center gap-1 text-xs uppercase tracking-widest">
            <ArrowLeft size={14} />
            Retour
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/20">
              <ShoppingCart size={20} />
            </div>
            Caisse / Vente
          </h1>
        </header>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un médicament..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500 font-medium text-base placeholder:text-slate-400 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 min-h-[400px]">
          {filteredProducts.map(product => {
            const cartItem = cart.find(item => item.productId === product.id);
            
            return (
              <div
                key={product.id}
                className={cn(
                  "bg-white p-5 rounded-[1.5rem] shadow-sm border transition-all flex flex-col justify-between group relative overflow-hidden",
                  cartItem ? "border-brand-500 ring-4 ring-brand-500/5 shadow-xl" : "border-slate-100 hover:border-brand-300 hover:shadow-md"
                )}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-brand-600/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-brand-600/10 transition-colors" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <span className={cn(
                      "px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full",
                      product.quantity <= 5 ? "bg-amber-100 text-amber-700" : "bg-brand-100 text-brand-700"
                    )}>
                      {product.quantity} en stock
                    </span>
                    
                    {cartItem ? (
                      <div className="flex items-center gap-1.5 bg-brand-600 text-white p-1 rounded-lg shadow-lg animate-in zoom-in duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(product.id, -1);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/20 transition-colors active:scale-90"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-5 text-center font-black text-xs">{cartItem.quantity}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(product.id, 1);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/20 transition-colors active:scale-90"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 hover:bg-brand-600 hover:text-white transition-all shadow-sm active:scale-90 border border-brand-100"
                        title="Ajouter au panier"
                      >
                        <Plus size={20} />
                      </button>
                    )}
                  </div>
                  
                  <div className="cursor-pointer flex-1" onClick={() => !cartItem && addToCart(product)}>
                    <h3 className="font-black text-slate-900 text-lg leading-tight mb-1">{product.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 mb-3">
                      <Calendar size={10} />
                      Exp: {format(new Date(product.expirationDate), 'MM/yyyy')}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <p className="text-xl font-black text-brand-600">{product.price.toLocaleString()} Ar</p>
                    {!cartItem && (
                      <button 
                        onClick={() => addToCart(product)}
                        className="text-[9px] font-black text-brand-600 uppercase tracking-widest hover:underline"
                      >
                        Ajouter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <Search className="text-slate-200 mx-auto mb-4" size={48} />
              <p className="text-slate-900 font-black text-lg">Aucun produit trouvé</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart / Checkout */}
      <div className={cn(
        "lg:flex lg:flex-col lg:w-[400px] bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden text-white border border-white/10 relative shrink-0",
        activeTab === 'cart' ? "flex flex-col h-[85vh] lg:h-full" : "hidden lg:flex"
      )}>
        <div className="absolute top-0 left-0 w-full h-32 bg-brand-600/10 blur-3xl -translate-y-1/2" />
        <div className="p-6 border-b border-white/10 relative z-10 flex items-center justify-between">
          <h2 className="text-xl font-black flex items-center gap-3">
            <Receipt size={20} className="text-brand-500" />
            Panier
          </h2>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button 
                onClick={() => setCart([])}
                className="text-white/40 hover:text-danger-500 transition-colors p-2 rounded-lg hover:bg-danger-500/10"
                title="Vider"
              >
                <Trash2 size={18} />
              </button>
            )}
            <span className="bg-brand-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
              {cart.length} articles
            </span>
          </div>
        </div>

        <div className="p-5 border-b border-white/10 relative z-10 space-y-3">
          <p className="text-[9px] font-black text-brand-500 uppercase tracking-[0.2em]">Informations Client</p>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" size={18} />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/10 border-2 border-white/10 rounded-xl focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 outline-none font-black text-base placeholder:text-white/20 transition-all text-white"
              placeholder="NOM DU CLIENT..."
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3 relative z-10 min-h-0">
          {cart.length > 0 ? (
            cart.map(item => (
              <div key={item.productId} className="bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base leading-tight truncate">{item.productName}</p>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">{item.price.toLocaleString()} Ar / unité</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-danger-500/10 text-danger-500 hover:bg-danger-500 hover:text-white transition-all shadow-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 bg-white/10 rounded-xl p-1 border border-white/10">
                    <button
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-brand-600 text-white transition-all active:scale-90"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-black text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-brand-600 text-white transition-all active:scale-90"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="font-black text-lg text-brand-500">{(item.price * item.quantity).toLocaleString()} Ar</p>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-white/20 gap-3 py-8">
              <ShoppingCart size={48} strokeWidth={1} className="opacity-20" />
              <p className="font-black text-lg italic">Le panier est vide</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-white/5 border-t border-white/10 space-y-4 relative z-10">
          <div className="flex justify-between items-end mb-2">
            <span className="text-white/40 font-black uppercase tracking-widest text-[10px]">Total à payer</span>
            <span className="text-3xl font-black text-brand-500">{total.toLocaleString()} Ar</span>
          </div>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleCheckout(false)}
              disabled={cart.length === 0 || isCheckingOut}
              className={cn(
                "w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95",
                cart.length > 0 && !isCheckingOut
                  ? "bg-brand-600 text-white hover:bg-brand-500 shadow-brand-600/30"
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              )}
            >
              {isCheckingOut ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <>
                  Valider la vente
                  <CheckCircle size={20} />
                </>
              )}
            </button>

            {isAgent && !isAdmin && (
              <button
                onClick={() => handleCheckout(true)}
                disabled={cart.length === 0 || isCheckingOut}
                className={cn(
                  "w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-95 border-2",
                  cart.length > 0 && !isCheckingOut
                    ? "bg-indigo-600 text-white border-indigo-400 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30"
                    : "border-white/5 text-white/10 cursor-not-allowed"
                )}
              >
                <Send size={18} />
                Valider & Transmettre à l'Admin
              </button>
            )}
          </div>
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
              {!hasTransmitted ? (
                <button
                  onClick={handleTransmitToAdmin}
                  disabled={isTransmitting}
                  className={cn(
                    "w-full font-black py-5 rounded-2xl transition-all shadow-xl active:scale-95 text-lg flex items-center justify-center gap-3",
                    isTransmitting ? "bg-slate-100 text-slate-400" : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20"
                  )}
                >
                  {isTransmitting ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
                  ) : (
                    <>
                      <Send size={24} />
                      Transmettre à l'Admin
                    </>
                  )}
                </button>
              ) : (
                <div className="bg-brand-50 text-brand-600 py-5 rounded-2xl font-black flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <CheckCircle size={24} />
                  Transmis avec succès
                </div>
              )}

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
      {/* Mobile Floating Cart Button */}
      {cart.length > 0 && activeTab === 'products' && (
        <button
          onClick={() => setActiveTab('cart')}
          className="lg:hidden fixed bottom-8 right-8 w-16 h-16 bg-brand-600 text-white rounded-full shadow-2xl flex items-center justify-center animate-bounce z-50 border-4 border-white"
        >
          <div className="relative">
            <ShoppingCart size={28} />
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-brand-600 font-black">
              {cart.length}
            </span>
          </div>
        </button>
      )}

      {/* Mobile FAB for POS */}
      <div className="md:hidden fixed bottom-8 right-8 z-[100]">
        {isAgent && activeTab === 'products' && cart.length === 0 && (
          <Link 
            to="/stock" 
            state={{ openModal: true }}
            className="w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform border-4 border-white/20"
            title="Ajouter Produit"
          >
            <Plus size={32} />
          </Link>
        )}
      </div>
    </div>
  );
};

export default POS;
