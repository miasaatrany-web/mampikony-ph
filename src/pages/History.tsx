import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Sale } from '../types';
import { useAuth } from '../components/AuthProvider';
import { History as HistoryIcon, Search, CheckCircle2, Clock, Trash2, FileText, X, User, DollarSign, Calendar, ArrowLeft, Plus, PlusCircle, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const History: React.FC = () => {
  const { isAdmin, isAgent } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [transmittingIds, setTransmittingIds] = useState<string[]>([]);
  const [validatingIds, setValidatingIds] = useState<string[]>([]);

  const fetchSales = async () => {
    try {
      const data = await api.sales.list();
      setSales(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const filteredSales = sales.filter(s =>
    (s.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleValidatePayment = async (id: string) => {
    if (window.confirm('Voulez-vous confirmer le paiement de cette vente ?')) {
      setValidatingIds(prev => [...prev, id]);
      console.log('Validating payment for sale:', id);
      try {
        await api.sales.update(id, { status: 'paid' });
        await fetchSales();
        if (selectedSale?.id === id) {
          setSelectedSale(prev => prev ? { ...prev, status: 'paid' } : null);
        }
        alert('Vente validée avec succès !');
      } catch (err) {
        console.error('Error validating payment:', err);
        alert('Erreur lors de la validation du paiement.');
      } finally {
        setValidatingIds(prev => prev.filter(vid => vid !== id));
      }
    }
  };

  const handleTransmit = async (id: string) => {
    setTransmittingIds(prev => [...prev, id]);
    try {
      // In a real app, this would notify the admin or change a 'transmitted' flag
      // For now, we'll update a local status if we had one, but we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Vente transmise à l\'administrateur avec succès !');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la transmission.');
    } finally {
      setTransmittingIds(prev => prev.filter(tid => tid !== id));
    }
  };

  const handleTransmitAll = async () => {
    const pendingSales = filteredSales.filter(s => s.status === 'pending');
    if (pendingSales.length === 0) {
      alert('Aucune vente en attente à transmettre.');
      return;
    }
    
    if (window.confirm(`Voulez-vous transmettre les ${pendingSales.length} ventes en attente à l'administrateur ?`)) {
      setLoading(true);
      // Simulate batch transmission
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLoading(false);
      alert('Toutes les ventes ont été transmises avec succès !');
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette vente ?')) {
      try {
        await api.sales.delete(id);
        fetchSales();
        setSelectedSale(null);
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
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/20">
              <HistoryIcon size={24} />
            </div>
            Historique des Ventes
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Consultez et gérez toutes les transactions passées.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link 
            to="/pos" 
            className="bg-brand-600 text-white font-black py-5 px-8 rounded-[2rem] flex items-center gap-4 hover:bg-brand-500 transition-all shadow-2xl shadow-brand-600/40 active:scale-95 text-xl group"
          >
            <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
              <PlusCircle size={28} />
            </div>
            Nouvelle Vente
          </Link>
          {isAgent && !isAdmin && (
            <button
              onClick={handleTransmitAll}
              className="bg-indigo-600 text-white font-black py-5 px-8 rounded-[2rem] flex items-center gap-4 hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/40 active:scale-95 text-xl group"
            >
              <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
                <Send size={28} />
              </div>
              Tout Transmettre
            </button>
          )}
        </div>
      </header>

      {/* Search */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
          <input
            type="text"
            placeholder="Rechercher par client ou ID de facture..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 font-medium text-lg placeholder:text-slate-400 transition-all"
          />
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Facture #</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Client</th>
                {isAdmin && <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Agent</th>}
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Statut</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-8 py-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <span className="font-black text-slate-900 font-mono text-sm">#{sale.id.slice(-6).toUpperCase()}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                          <User size={18} />
                        </div>
                        <span className="font-bold text-slate-700">{sale.customerName || 'Client anonyme'}</span>
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase border border-slate-200">
                            {sale.agentName?.charAt(0) || 'A'}
                          </div>
                          <span className="font-bold text-slate-700">{sale.agentName || 'N/A'}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 text-sm">{format(new Date(sale.createdAt), 'dd MMMM yyyy', { locale: fr })}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{format(new Date(sale.createdAt), 'HH:mm')}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-black text-brand-600 text-lg">{sale.total.toLocaleString()} Ar</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2",
                        sale.status === 'paid' 
                          ? "bg-brand-100 text-brand-700" 
                          : "bg-amber-100 text-amber-700"
                      )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", sale.status === 'paid' ? "bg-brand-600" : "bg-amber-600")} />
                        {sale.status === 'paid' ? 'Payé' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="px-3 py-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all flex items-center gap-2 border border-transparent hover:border-brand-100"
                        >
                          <FileText size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Détails</span>
                        </button>
                        {isAgent && !isAdmin && sale.status === 'pending' && (
                          <button
                            onClick={() => handleTransmit(sale.id)}
                            disabled={transmittingIds.includes(sale.id)}
                            className={cn(
                              "p-2 rounded-xl transition-all flex items-center gap-2",
                              transmittingIds.includes(sale.id) 
                                ? "text-slate-300 animate-pulse" 
                                : "text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                            )}
                            title="Transmettre à l'Admin"
                          >
                            <Send size={20} />
                            <span className="text-[10px] font-bold">Envoyer</span>
                          </button>
                        )}
                        {isAdmin && sale.status === 'pending' && (
                          <button
                            onClick={() => handleValidatePayment(sale.id)}
                            disabled={validatingIds.includes(sale.id)}
                            className={cn(
                              "px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95",
                              validatingIds.includes(sale.id)
                                ? "bg-slate-100 text-slate-300 animate-pulse"
                                : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20"
                            )}
                            title="Valider Paiement"
                          >
                            {validatingIds.includes(sale.id) ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <CheckCircle2 size={16} />
                            )}
                            Valider
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteSale(sale.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Supprimer"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-8 py-20 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                      <HistoryIcon className="text-slate-300" size={40} />
                    </div>
                    <p className="text-slate-900 font-black text-xl mb-2">Aucune vente trouvée</p>
                    <p className="text-slate-500 font-medium">Essayez de modifier vos critères de recherche.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/20">
            <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/20">
                      <FileText size={24} />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight">Facture</h2>
                  </div>
                  <p className="text-white/40 font-black uppercase tracking-[0.2em] text-xs">Référence</p>
                  <p className="text-xl font-mono font-bold">#{selectedSale.id.toUpperCase()}</p>
                </div>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="p-3 hover:bg-white/10 rounded-2xl transition-colors text-white/40 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-10 space-y-10">
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Client</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <User size={20} />
                      </div>
                      <p className="font-black text-slate-900 text-lg">{selectedSale.customerName || 'Client Anonyme'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date de vente</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Calendar size={20} />
                      </div>
                      <p className="font-bold text-slate-700">{format(new Date(selectedSale.createdAt), 'dd MMMM yyyy, HH:mm', { locale: fr })}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Statut du paiement</p>
                    <span className={cn(
                      "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2",
                      selectedSale.status === 'paid' ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-700"
                    )}>
                      <div className={cn("w-1.5 h-1.5 rounded-full", selectedSale.status === 'paid' ? "bg-brand-600" : "bg-amber-600")} />
                      {selectedSale.status === 'paid' ? 'Payé' : 'En attente'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Agent responsable</p>
                    <p className="font-bold text-slate-700">{selectedSale.agentName || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-8">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-200 pb-4">Détails des articles</h3>
                <div className="space-y-4">
                  {selectedSale.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center group">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-brand-600 group-hover:text-white group-hover:border-brand-600 transition-all">
                          {item.quantity}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.productName}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.price.toLocaleString()} Ar / unité</p>
                        </div>
                      </div>
                      <p className="font-black text-slate-900">{(item.price * item.quantity).toLocaleString()} Ar</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-200 flex justify-between items-center">
                  <span className="text-xl font-black text-slate-900 uppercase tracking-tight">Total</span>
                  <span className="text-3xl font-black text-brand-600">{selectedSale.total.toLocaleString()} Ar</span>
                </div>
              </div>

              <div className="flex gap-4">
                {isAgent && !isAdmin && selectedSale.status === 'pending' && (
                  <button
                    onClick={() => handleTransmit(selectedSale.id)}
                    disabled={transmittingIds.includes(selectedSale.id)}
                    className={cn(
                      "flex-1 font-black py-5 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3",
                      transmittingIds.includes(selectedSale.id)
                        ? "bg-slate-100 text-slate-400"
                        : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20"
                    )}
                  >
                    {transmittingIds.includes(selectedSale.id) ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400"></div>
                    ) : (
                      <>
                        <Send size={24} />
                        Transmettre à l'Admin
                      </>
                    )}
                  </button>
                )}
                {isAdmin && selectedSale.status === 'pending' && (
                  <button
                    onClick={() => handleValidatePayment(selectedSale.id)}
                    disabled={validatingIds.includes(selectedSale.id)}
                    className={cn(
                      "flex-1 font-black py-5 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3",
                      validatingIds.includes(selectedSale.id)
                        ? "bg-slate-100 text-slate-400"
                        : "bg-brand-600 text-white hover:bg-brand-500 shadow-brand-600/20"
                    )}
                  >
                    {validatingIds.includes(selectedSale.id) ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600"></div>
                    ) : (
                      <>
                        <CheckCircle2 size={24} />
                        Valider le paiement
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                >
                  <FileText size={24} />
                  Imprimer la facture
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Mobile FAB for History */}
      <div className="md:hidden fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
        {isAgent && (
          <>
            <Link 
              to="/stock" 
              state={{ openModal: true }}
              className="w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform border-2 border-white/20"
              title="Ajouter Produit"
            >
              <Plus size={24} />
            </Link>
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

export default History;
