import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Product, SaleItem, Sale } from '../types';
import { useAuth } from '../components/AuthProvider';
import { ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle, User, Receipt, X, ArrowLeft, PlusCircle, Send, Package, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const POS: React.FC = () => {
  const { user, isAgent, isAdmin, isCashier } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<(SaleItem & { unit: 'boîte' | 'plaquette' | 'pillule' })[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastSaleId, setLastSaleId] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [hasTransmitted, setHasTransmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products');

  const fetchProducts = async () => {
    try {
      const data = await api.products.list();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.pharmacyQuantityPillules > 0
  );

  const addToCart = (product: Product, unit: 'boîte' | 'plaquette' | 'pillule') => {
    const price = unit === 'boîte' ? (product.priceBoite || 0) : unit === 'plaquette' ? (product.pricePlaquette || 0) : (product.pricePillule || 0);
    
    const packsPerBox = product.packsPerBox || 10;
    const pillsPerPack = product.pillsPerPack || 10;
    const pillsPerBox = packsPerBox * pillsPerPack;

    const pillulesPerUnit = unit === 'boîte' ? pillsPerBox : unit === 'plaquette' ? pillsPerPack : 1;
    
    const existingItem = cart.find(item => item.productId === product.id && item.unit === unit);
    
    if (existingItem) {
      const totalPillulesInCart = cart
        .filter(item => item.productId === product.id)
        .reduce((acc, item) => {
          const factor = item.unit === 'boîte' ? pillsPerBox : item.unit === 'plaquette' ? pillsPerPack : 1;
          return acc + (item.quantity * factor);
        }, 0);

      if (totalPillulesInCart + pillulesPerUnit <= product.pharmacyQuantityPillules) {
        setCart(cart.map(item =>
          (item.productId === product.id && item.unit === unit)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        alert('Stock insuffisant !');
      }
    } else {
      if (pillulesPerUnit <= product.pharmacyQuantityPillules) {
        setCart([...cart, {
          productId: product.id,
          productName: `${product.name} (${unit})`,
          quantity: 1,
          price: price,
          unit: unit
        }]);
      } else {
        alert('Stock insuffisant !');
      }
    }
  };

  const removeFromCart = (productId: string, unit: string) => {
    setCart(cart.filter(item => !(item.productId === productId && item.unit === unit)));
  };

  const updateQuantity = (productId: string, unit: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const packsPerBox = product.packsPerBox || 10;
    const pillsPerPack = product.pillsPerPack || 10;
    const pillsPerBox = packsPerBox * pillsPerPack;

    const pillulesPerUnit = unit === 'boîte' ? pillsPerBox : unit === 'plaquette' ? pillsPerPack : 1;

    setCart(cart.map(item => {
      if (item.productId === productId && item.unit === unit) {
        const newQty = item.quantity + delta;
        if (newQty > 0) {
          const otherItemsPillules = cart
            .filter(i => i.productId === productId && i.unit !== unit)
            .reduce((acc, i) => {
              const factor = i.unit === 'boîte' ? pillsPerBox : i.unit === 'plaquette' ? pillsPerPack : 1;
              return acc + (i.quantity * factor);
            }, 0);
          
          if (otherItemsPillules + (newQty * pillulesPerUnit) <= product.pharmacyQuantityPillules) {
            return { ...item, quantity: newQty };
          } else {
            alert('Stock insuffisant !');
          }
        }
      }
      return item;
    }));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const canCreateSale = isAgent || isCashier;
  const canConfirmPayment = isCashier;

  const handleCheckout = async (transmit: boolean = false) => {
    if (cart.length === 0 || isCheckingOut || !canCreateSale) return;
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
      
      // Update stock for each item
      for (const item of cart) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const packsPerBox = product.packsPerBox || 10;
          const pillsPerPack = product.pillsPerPack || 10;
          const pillsPerBox = packsPerBox * pillsPerPack;
          const pillulesToDeduct = item.quantity * (item.unit === 'boîte' ? pillsPerBox : item.unit === 'plaquette' ? pillsPerPack : 1);
          
          await api.products.update(product.id, {
            pharmacyQuantityPillules: product.pharmacyQuantityPillules - pillulesToDeduct,
            showInPharmacy: (product.pharmacyQuantityPillules - pillulesToDeduct) > 0
          });
        }
      }

      setLastSaleId(res.id);
      setIsSuccessModalOpen(true);
      setHasTransmitted(false);
      
      if (transmit) {
        await handleTransmitToAdmin();
      }

      setCart([]);
      setCustomerName('');
      setActiveTab('products');
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la validation.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleTransmitToAdmin = async () => {
    setIsTransmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsTransmitting(false);
    setHasTransmitted(true);
  };

  const handleExportPDF = (saleId: string) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('FACTURE PHARMACIE', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Facture #: ${saleId.toUpperCase()}`, 20, 40);
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 45);
    doc.text(`Client: ${customerName || 'Client Anonyme'}`, 20, 50);
    doc.text(`Agent: ${user?.displayName || 'N/A'}`, 20, 55);

    // Table
    const tableData = cart.map(item => [
      item.productName,
      item.quantity.toString(),
      `${item.price.toLocaleString()} Ar`,
      `${(item.price * item.quantity).toLocaleString()} Ar`
    ]);

    (doc as any).autoTable({
      startY: 70,
      head: [['Produit', 'Quantité', 'Prix Unitaire', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // brand-600
    });

    const finalY = (doc as any).lastAutoTable.finalY || 70;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: ${total.toLocaleString()} Ar`, 190, finalY + 20, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Merci de votre confiance !', 105, finalY + 40, { align: 'center' });

    doc.save(`Facture_${saleId.slice(-6)}.pdf`);
  };

  const handleConfirmPayment = async () => {
    if (!lastSaleId) return;
    setIsCheckingOut(true);
    try {
      await api.sales.update(lastSaleId, { 
        status: 'paid',
        cashierId: user?.uid,
        cashierName: user?.displayName
      });
      setIsSuccessModalOpen(false);
      alert('Vente confirmée et payée !');
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Erreur lors de la confirmation du paiement.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full lg:h-[calc(100vh-10rem)] pb-6">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex bg-slate-100 p-1.5 rounded-2xl mb-2">
        <button onClick={() => setActiveTab('products')} className={cn("flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2", activeTab === 'products' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500")}><PlusCircle size={18} /> Produits</button>
        <button onClick={() => setActiveTab('cart')} className={cn("flex-1 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 relative", activeTab === 'cart' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500")}><ShoppingCart size={18} /> Panier {cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">{cart.length}</span>}</button>
      </div>

      <div className={cn("lg:flex lg:flex-col lg:flex-1 gap-6 min-w-0", activeTab === 'products' ? "flex flex-col" : "hidden lg:flex")}>
        <header className="flex flex-col gap-2">
          <Link to="/" className="text-brand-600 hover:text-brand-700 font-black flex items-center gap-1 text-xs uppercase tracking-widest"><ArrowLeft size={14} /> Retour</Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/20"><ShoppingCart size={20} /></div>
            Caisse / Vente
          </h1>
        </header>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Rechercher un médicament..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-500 font-medium text-base transition-all" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 min-h-[400px]">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 hover:border-brand-300 hover:shadow-md transition-all flex flex-col group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-brand-600/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full bg-brand-100 text-brand-700">
                    {Math.floor(product.totalQuantityPillules / ((product.packsPerBox || 10) * (product.pillsPerPack || 10)))} Boîtes...
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600"><Package size={18} /></div>
                </div>
                
                <h3 className="font-black text-slate-900 text-lg leading-tight mb-4">{product.name}</h3>

                <div className="space-y-2 mt-auto">
                  <button onClick={() => addToCart(product, 'boîte')} className="w-full flex justify-between items-center p-2 bg-slate-50 hover:bg-brand-600 hover:text-white rounded-xl transition-all group/btn">
                    <span className="text-[10px] font-black uppercase">Boîte</span>
                    <span className="font-black">{(product.priceBoite || 0).toLocaleString()} Ar</span>
                  </button>
                  <button onClick={() => addToCart(product, 'plaquette')} className="w-full flex justify-between items-center p-2 bg-slate-50 hover:bg-brand-600 hover:text-white rounded-xl transition-all group/btn">
                    <span className="text-[10px] font-black uppercase">Plaquette</span>
                    <span className="font-black">{(product.pricePlaquette || 0).toLocaleString()} Ar</span>
                  </button>
                  <button onClick={() => addToCart(product, 'pillule')} className="w-full flex justify-between items-center p-2 bg-slate-50 hover:bg-brand-600 hover:text-white rounded-xl transition-all group/btn">
                    <span className="text-[10px] font-black uppercase">Pillule</span>
                    <span className="font-black">{(product.pricePillule || 0).toLocaleString()} Ar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={cn("lg:flex lg:flex-col lg:w-[400px] bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden text-white border border-white/10 relative shrink-0", activeTab === 'cart' ? "flex flex-col h-[85vh] lg:h-full" : "hidden lg:flex")}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-black flex items-center gap-3"><Receipt size={20} className="text-brand-500" /> Panier</h2>
          {cart.length > 0 && <button onClick={() => setCart([])} className="text-rose-500 hover:text-rose-400"><Trash2 size={18} /></button>}
        </div>

        <div className="p-5 border-b border-white/10 space-y-3">
          <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-4 py-4 bg-white/10 border-2 border-white/10 rounded-xl focus:border-brand-500 outline-none font-black text-white" placeholder="NOM DU CLIENT..." />
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-0">
          {cart.map(item => (
            <div key={`${item.productId}-${item.unit}`} className="bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base leading-tight truncate">{item.productName}</p>
                  <p className="text-[10px] text-white/40 font-bold uppercase">{item.price.toLocaleString()} Ar</p>
                </div>
                <button onClick={() => removeFromCart(item.productId, item.unit)} className="text-rose-500"><Trash2 size={14} /></button>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 bg-white/10 rounded-xl p-1">
                  <button onClick={() => updateQuantity(item.productId, item.unit, -1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-brand-600 text-white transition-all"><Minus size={14} /></button>
                  <span className="w-6 text-center font-black text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.unit, 1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-brand-600 text-white transition-all"><Plus size={14} /></button>
                </div>
                <p className="font-black text-lg text-brand-500">{(item.price * item.quantity).toLocaleString()} Ar</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-white/5 border-t border-white/10 space-y-4">
          <div className="flex justify-between items-end mb-2">
            <span className="text-white/40 font-black uppercase tracking-widest text-[10px]">Total à payer</span>
            <span className="text-3xl font-black text-brand-500">{total.toLocaleString()} Ar</span>
          </div>
          <button 
            onClick={() => handleCheckout(false)} 
            disabled={cart.length === 0 || isCheckingOut || !canCreateSale} 
            className={cn(
              "btn-primary !w-full !py-4 !text-lg", 
              (cart.length === 0 || isCheckingOut || !canCreateSale) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isCheckingOut ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : <>Valider la vente <CheckCircle size={20} /></>}
          </button>
          {!canCreateSale && (
            <p className="text-[10px] text-rose-400 font-bold text-center mt-2 uppercase tracking-widest">
              Seuls les agents, caissiers et administrateurs peuvent valider
            </p>
          )}
        </div>
      </div>

      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center">
            <div className="w-24 h-24 bg-brand-100 text-brand-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8"><CheckCircle size={48} /></div>
            <h2 className="text-3xl font-black text-slate-900 mb-3">Vente validée !</h2>
            <p className="text-slate-500 mb-10">Facture #{lastSaleId.slice(-6)}</p>
            <div className="flex flex-col gap-4">
              {canConfirmPayment && (
                <button 
                  onClick={handleConfirmPayment} 
                  disabled={isCheckingOut}
                  className="w-full bg-brand-600 text-white font-black py-5 rounded-2xl text-lg shadow-lg shadow-brand-600/20 flex items-center justify-center gap-3"
                >
                  {isCheckingOut ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : <><CheckCircle size={24} /> Confirmer le paiement</>}
                </button>
              )}
              <button 
                onClick={() => handleExportPDF(lastSaleId)}
                className="w-full bg-brand-600 text-white font-black py-5 rounded-2xl text-lg shadow-lg shadow-brand-600/20 flex items-center justify-center gap-3"
              >
                <Download size={24} /> Exporter PDF
              </button>
              <button onClick={() => setIsSuccessModalOpen(false)} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl text-lg">Nouvelle vente</button>
              <button onClick={() => setIsSuccessModalOpen(false)} className="w-full bg-slate-100 text-slate-600 font-black py-5 rounded-2xl text-lg">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
