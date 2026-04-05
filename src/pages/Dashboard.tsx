import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { api } from '../api';
import { Product, Sale, UserProfile } from '../types';
import { db, collection, query, onSnapshot, handleFirestoreError, OperationType } from '../firebase';
import { Package, ShoppingCart, AlertTriangle, TrendingUp, Clock, CheckCircle2, XCircle, ArrowRight, Plus, LogOut, PlusCircle, Users, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../lib/utils';

const Dashboard: React.FC = () => {
  const { user, isAdmin, isAgent, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // Listen to products
    const productsUnsubscribe = onSnapshot(query(collection(db, 'products')), (snapshot) => {
      const productsData = snapshot.docs.map(doc => doc.data() as Product);
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
      setLoading(false);
    });

    // Listen to sales
    const salesUnsubscribe = onSnapshot(query(collection(db, 'sales')), (snapshot) => {
      const salesData = snapshot.docs.map(doc => doc.data() as Sale);
      setAllSales(salesData);
      setRecentSales(salesData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sales');
    });

    // Listen to users if admin
    let usersUnsubscribe = () => {};
    if (isAdmin) {
      usersUnsubscribe = onSnapshot(query(collection(db, 'users')), (snapshot) => {
        const usersData = snapshot.docs.map(doc => doc.data() as UserProfile);
        const pending = usersData.filter(u => !u.approved).length;
        setPendingUsersCount(pending);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      });
    }

    return () => {
      productsUnsubscribe();
      salesUnsubscribe();
      usersUnsubscribe();
    };
  }, [isAdmin]);

  const lowStockProducts = products.filter(p => p.quantity <= (p.lowStockThreshold || 5));
  const expiredProducts = products.filter(p => new Date(p.expirationDate) < new Date());
  const totalSalesToday = allSales
    .filter(s => format(new Date(s.createdAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
    .reduce((acc, s) => acc + s.total, 0);

  const stats = [
    {
      label: 'Produits en stock',
      value: products.length,
      icon: Package,
      color: 'bg-indigo-600',
    },
    {
      label: 'Ventes du jour',
      value: `${totalSalesToday.toLocaleString()} Ar`,
      icon: TrendingUp,
      color: 'bg-brand-600',
    },
    {
      label: 'Stock faible',
      value: lowStockProducts.length,
      icon: AlertTriangle,
      color: 'bg-amber-500',
    },
    {
      label: 'Produits expirés',
      value: expiredProducts.length,
      icon: XCircle,
      color: 'bg-rose-500',
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Tableau de bord</h1>
          <p className="text-slate-500 mt-2 text-lg">
            Ravi de vous revoir, <span className="text-brand-600 font-black">{user?.displayName}</span> !
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            to="/pos" 
            className="btn-primary"
          >
            <PlusCircle size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            Nouvelle Vente
          </Link>
          <div className="hidden sm:flex bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
            <span className="text-sm font-black text-slate-600 uppercase tracking-widest">Système en ligne</span>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="btn-danger !px-6 !py-3 !text-xs"
            title="Déconnexion"
          >
            <LogOut size={20} />
            Quitter
          </button>
        </div>
      </header>

      {/* Pending Approvals Alert */}
      {isAdmin && pendingUsersCount > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-amber-500/5 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 leading-tight">Demandes d'inscription en attente</h3>
              <p className="text-amber-700 font-medium">Il y a <span className="font-black underline">{pendingUsersCount} agent(s)</span> qui attendent votre approbation pour accéder au système.</p>
            </div>
          </div>
          <Link 
            to="/agents" 
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <Users size={18} />
            Gérer les demandes
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4 hover:shadow-md transition-shadow">
            <div className={cn("w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg", stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-black mb-3">Actions Rapides</h2>
            <p className="text-slate-400 text-lg">Optimisez votre flux de travail en un clic.</p>
          </div>
          <div className="flex flex-wrap gap-5 justify-center">
            <Link 
              to="/pos" 
              className="bg-brand-600 text-white px-8 py-5 rounded-[1.5rem] font-black text-lg flex items-center gap-3 hover:bg-brand-500 transition-all shadow-xl shadow-brand-600/30 active:scale-95"
            >
              <ShoppingCart size={24} />
              Nouvelle Vente
            </Link>
            {isAgent && (
              <Link 
                to="/stock" 
                state={{ openModal: true }}
                className="bg-white text-slate-900 px-8 py-5 rounded-[1.5rem] font-black text-lg flex items-center gap-3 hover:bg-slate-100 transition-all shadow-xl active:scale-95"
              >
                <Plus size={24} className="text-brand-600" />
                Ajouter Produit
              </Link>
            )}
            <Link 
              to="/stock" 
              className="bg-white/10 backdrop-blur-md text-white px-8 py-5 rounded-[1.5rem] font-black text-lg flex items-center gap-3 hover:bg-white/20 transition-all border border-white/10 active:scale-95"
            >
              <Package size={24} />
              Gérer le Stock
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Sales */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <Clock className="text-brand-600" size={24} />
              Ventes Récentes
            </h3>
            <Link to="/history" className="text-brand-600 font-bold hover:underline text-sm">Voir tout</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-4">Client</th>
                  <th className="px-8 py-4">Date</th>
                  <th className="px-8 py-4">Total</th>
                  <th className="px-8 py-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentSales.length > 0 ? (
                  recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-bold text-slate-700">{sale.customerName || 'Client anonyme'}</td>
                      <td className="px-8 py-5 text-slate-500 text-sm">
                        {format(new Date(sale.createdAt), 'dd MMM, HH:mm', { locale: fr })}
                      </td>
                      <td className="px-8 py-5 font-black text-slate-900">{sale.total.toLocaleString()} Ar</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit",
                            sale.status === 'paid' ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {sale.status === 'paid' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                            {sale.status === 'paid' ? 'Payé' : 'En attente'}
                          </span>
                          {isAdmin && sale.status === 'pending' && (
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                if (window.confirm('Confirmer le paiement ?')) {
                                  try {
                                    await api.sales.update(sale.id, { status: 'paid' });
                                    // No need to refresh manually, onSnapshot handles it
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }
                              }}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-all shadow-sm active:scale-90 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                            >
                              <CheckCircle2 size={14} />
                              Valider
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-medium italic">
                      Aucune vente récente
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-amber-50/30">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <AlertTriangle className="text-amber-500" size={24} />
                Alertes Stock
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <div>
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-xs text-amber-700 font-medium">Restant: {p.quantity}</p>
                    </div>
                    <Link to="/stock" className="p-2 bg-white rounded-xl shadow-sm text-amber-600 hover:text-amber-700">
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="bg-brand-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="text-brand-600" size={32} />
                  </div>
                  <p className="text-slate-500 font-bold">Stock optimal</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 bg-rose-50/30">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <XCircle className="text-rose-500" size={24} />
                Expirations
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {expiredProducts.length > 0 ? (
                expiredProducts.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-100">
                    <div>
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-xs text-rose-700 font-medium">Expiré le: {format(new Date(p.expirationDate), 'dd/MM/yyyy')}</p>
                    </div>
                    <XCircle className="text-rose-400" size={20} />
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="bg-brand-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="text-brand-600" size={32} />
                  </div>
                  <p className="text-slate-500 font-bold">Aucun produit expiré</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Mobile FAB */}
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

export default Dashboard;
