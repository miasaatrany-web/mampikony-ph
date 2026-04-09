import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { api } from '../api';
import { Product, Sale } from '../types';
import { Package, ShoppingCart, AlertTriangle, TrendingUp, Clock, CheckCircle2, ArrowRight, Plus, LogOut, PlusCircle, Users, ShieldAlert, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../lib/utils';

const Dashboard: React.FC = () => {
  const { user, isAdmin, isAgent, isCashier, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, salesData] = await Promise.all([
        api.products.list(),
        api.sales.list()
      ]);
      setProducts(productsData);
      setAllSales(salesData);
      setRecentSales(salesData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5));

      if (isAdmin) {
        const usersData = await api.auth.list();
        const pending = usersData.filter(u => !u.approved).length;
        setPendingUsersCount(pending);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  const lowStockProducts = products.filter(p => p.totalQuantityPillules <= (p.lowStockThresholdPillules || 50));
  
  const totalSalesToday = allSales
    .filter(s => format(new Date(s.createdAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
    .reduce((acc, s) => acc + s.total, 0);

  const totalSalesMonth = allSales
    .filter(s => format(new Date(s.createdAt), 'yyyy-MM') === format(new Date(), 'yyyy-MM'))
    .reduce((acc, s) => acc + s.total, 0);

  const totalSalesYear = allSales
    .filter(s => format(new Date(s.createdAt), 'yyyy') === format(new Date(), 'yyyy'))
    .reduce((acc, s) => acc + s.total, 0);

  const stats = [
    ...(isAdmin ? [
      {
        label: 'Ventes du jour',
        value: `${totalSalesToday.toLocaleString()} Ar`,
        icon: TrendingUp,
        color: 'bg-brand-600',
      },
      {
        label: 'Ventes du mois',
        value: `${totalSalesMonth.toLocaleString()} Ar`,
        icon: Calendar,
        color: 'bg-indigo-600',
      },
      {
        label: 'Ventes de l\'année',
        value: `${totalSalesYear.toLocaleString()} Ar`,
        icon: ShoppingCart,
        color: 'bg-brand-600',
      }
    ] : []),
    {
      label: 'Stock faible',
      value: lowStockProducts.length,
      icon: AlertTriangle,
      color: 'bg-amber-50',
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
          <Link to="/pos" className="btn-primary">
            <PlusCircle size={24} />
            Nouvelle Vente
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="btn-danger !px-6 !py-3 !text-xs"
          >
            <LogOut size={20} />
            Quitter
          </button>
        </div>
      </header>

      {isAdmin && pendingUsersCount > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-amber-500/5">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 leading-tight">Demandes d'inscription en attente</h3>
              <p className="text-amber-700 font-medium">Il y a <span className="font-black underline">{pendingUsersCount} agent(s)</span> qui attendent votre approbation.</p>
            </div>
          </div>
          <Link to="/agents" className="btn-info !px-8 !py-4 !text-sm">
            <Users size={18} />
            Gérer les demandes
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
            <div className={cn("w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg", stat.color || "bg-amber-500")}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-black mb-3">Actions Rapides</h2>
            <p className="text-slate-400 text-lg">Optimisez votre flux de travail.</p>
          </div>
          <div className="flex flex-wrap gap-5 justify-center">
            <Link to="/pos" className="btn-primary !px-8 !py-5 !text-lg">
              <ShoppingCart size={24} />
              Nouvelle Vente
            </Link>
            {(isAgent || isCashier) && (
              <Link to="/stock" state={{ openModal: true }} className="btn-info !px-8 !py-5 !text-lg">
                <Plus size={24} />
                Ajouter Produit
              </Link>
            )}
            <Link to="/stock" className="btn-secondary !px-8 !py-5 !text-lg !bg-white/10 !text-white !border-white/20">
              <Package size={24} />
              Gérer le Stock
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-700">{sale.customerName || 'Client anonyme'}</td>
                    <td className="px-8 py-5 text-slate-500 text-sm">
                      {format(new Date(sale.createdAt), 'dd MMM, HH:mm', { locale: fr })}
                    </td>
                    <td className="px-8 py-5 font-black text-slate-900">{sale.total.toLocaleString()} Ar</td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-fit",
                        sale.status === 'paid' ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {sale.status === 'paid' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                        {sale.status === 'paid' ? 'Payé' : 'En attente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
                    <p className="text-xs text-amber-700 font-medium">Pillules: {p.totalQuantityPillules}</p>
                  </div>
                  <Link to="/stock" className="p-2 bg-white rounded-xl shadow-sm text-amber-600 hover:text-amber-700">
                    <ArrowRight size={18} />
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="text-brand-600 mx-auto mb-4" size={32} />
                <p className="text-slate-500 font-bold">Stock optimal</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
