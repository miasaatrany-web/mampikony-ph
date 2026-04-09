import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { InventoryLog } from '../types';
import { useAuth } from '../components/AuthProvider';
import { Clock, ArrowLeft, Package, ArrowRightLeft, PlusCircle, User, Search, Calendar, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../lib/utils';

const InventoryHistory: React.FC = () => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.inventoryLogs.list();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching inventory logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log =>
    log.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClearAll = async () => {
    try {
      await api.inventoryLogs.deleteAll();
      setIsClearModalOpen(false);
      fetchLogs();
      alert('Tout l\'historique des mouvements a été effacé avec succès.');
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression de l\'historique.');
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'addition':
        return <PlusCircle className="text-brand-600" size={20} />;
      case 'transfer_to_pharmacy':
        return <ArrowRightLeft className="text-brand-600" size={20} />;
      case 'return_to_stock':
        return <ArrowLeft className="text-amber-500" size={20} />;
      case 'stock_exit':
        return <Trash2 className="text-rose-500" size={20} />;
      default:
        return <Package className="text-slate-400" size={20} />;
    }
  };

  const getLogLabel = (type: string) => {
    switch (type) {
      case 'addition':
        return 'Ajout de Stock';
      case 'transfer_to_pharmacy':
        return 'Transfert vers Pharmacie';
      case 'return_to_stock':
        return 'Retour au Stock';
      case 'stock_exit':
        return 'Sortie de Stock';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-10 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link to="/stock" className="text-brand-600 hover:text-brand-700 font-black flex items-center gap-1 text-sm mb-3 uppercase tracking-widest">
            <ArrowLeft size={16} />
            Retour au Stock
          </Link>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
              <Clock size={24} />
            </div>
            Historique des Mouvements
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Suivez tous les ajouts et transferts de produits.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsClearModalOpen(true)}
            className="bg-rose-600 text-white font-black py-5 px-8 rounded-[2rem] flex items-center gap-4 hover:bg-rose-500 transition-all shadow-2xl shadow-rose-600/40 active:scale-95 text-xl group"
          >
            <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
              <Trash2 size={28} />
            </div>
            Tout Effacer
          </button>
        )}
      </header>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
          <input
            type="text"
            placeholder="Rechercher par produit ou agent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 font-medium text-lg placeholder:text-slate-400 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date & Heure</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Type</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Produit</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quantité</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{format(new Date(log.createdAt), 'dd MMM yyyy', { locale: fr })}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{format(new Date(log.createdAt), 'HH:mm:ss')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          log.type === 'addition' ? "bg-brand-50" : 
                          log.type === 'transfer_to_pharmacy' ? "bg-brand-50" : 
                          log.type === 'stock_exit' ? "bg-rose-50" : "bg-amber-50"
                        )}>
                          {getLogIcon(log.type)}
                        </div>
                        <span className={cn(
                          "font-black text-[10px] uppercase tracking-wider",
                          log.type === 'addition' ? "text-brand-600" : 
                          log.type === 'transfer_to_pharmacy' ? "text-brand-600" : 
                          log.type === 'stock_exit' ? "text-rose-600" : "text-amber-600"
                        )}>
                          {getLogLabel(log.type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-black text-slate-900 text-lg">{log.productName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">ID: {log.productId.slice(0, 8)}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="bg-slate-50 px-4 py-2 rounded-xl inline-block border border-slate-100">
                        <p className="font-black text-slate-900">{log.details}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{log.quantityPillules} Pillules</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <User size={14} />
                        </div>
                        <span className="font-bold text-slate-700">{log.userName}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                      <Clock className="text-slate-300" size={40} />
                    </div>
                    <p className="text-slate-900 font-black text-xl mb-2">Aucun mouvement trouvé</p>
                    <p className="text-slate-500">Les mouvements de stock apparaîtront ici.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clear All Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 p-10 border border-white/20 text-center">
            <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-rose-600/10">
              <Trash2 size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Tout effacer ?</h2>
            <p className="text-slate-500 mb-10 font-medium">Cette action est irréversible. Êtes-vous sûr de vouloir supprimer TOUT l'historique des mouvements de stock ?</p>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={handleClearAll}
                className="w-full bg-rose-600 text-white font-black py-5 rounded-2xl hover:bg-rose-500 transition-all shadow-xl shadow-rose-600/20 active:scale-95 text-lg"
              >
                Oui, tout supprimer
              </button>
              <button
                onClick={() => setIsClearModalOpen(false)}
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

export default InventoryHistory;
