import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { LayoutDashboard, Package, ShoppingCart, History, LogOut, User as UserIcon, Menu, X, Plus, PlusCircle, Users } from 'lucide-react';
import { cn } from '../lib/utils';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, isAgent, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    if (isAdmin) {
      const fetchPending = async () => {
        try {
          const users = await api.auth.list();
          setPendingCount(users.filter((u: any) => !u.approved).length);
        } catch (err) {
          console.error(err);
        }
      };
      fetchPending();
      // Refresh every 30 seconds
      const interval = setInterval(fetchPending, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const handleLogout = async () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Tableau de bord', path: '/', icon: LayoutDashboard, show: true },
    { label: 'Nouvelle Vente', path: '/pos', icon: ShoppingCart, show: isAgent },
    { label: 'Stock / Produits', path: '/stock', icon: Package, show: isAgent },
    { label: 'Historique', path: '/history', icon: History, show: true },
    { label: 'Agents', path: '/agents', icon: Users, show: isAdmin },
  ];

  const activeItem = navItems.find(item => item.path === location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-brand-100 selection:text-brand-900">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-6 flex justify-between items-center shadow-2xl relative z-[60]">
        <Link to="/" className="text-2xl font-black flex items-center gap-3 tracking-tight">
          <div className="bg-brand-600 text-white p-2 rounded-xl shadow-lg shadow-brand-600/20">
            <Package size={24} />
          </div>
          Mampikony
        </Link>
        <div className="flex items-center gap-3">
          {isAgent && (
            <Link 
              to="/stock" 
              state={{ openModal: true }}
              className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/20"
              title="Ajouter Produit"
            >
              <Plus size={24} />
            </Link>
          )}
          <button 
            onClick={handleLogout}
            className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors border border-rose-500/20"
            title="Déconnexion"
          >
            <LogOut size={24} />
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar / Desktop Nav */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-100 transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:relative md:translate-x-0 shadow-2xl md:shadow-none",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-8">
          <Link to="/" className="flex items-center gap-4 mb-12 px-2 group">
            <div className="bg-brand-600 text-white p-3 rounded-[1.25rem] shadow-xl shadow-brand-600/30 group-hover:scale-110 transition-transform duration-300">
              <Package size={28} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none">Mampikony</span>
              <span className="text-[10px] font-black text-brand-600 uppercase tracking-[0.3em] mt-1">Pharmacie</span>
            </div>
          </Link>

          <nav className="space-y-2 mb-10">
            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Menu Principal</p>
            {navItems.filter(item => item.show).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                  location.pathname === item.path
                    ? "bg-slate-900 text-white shadow-2xl shadow-slate-900/20 font-bold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {location.pathname === item.path && (
                  <div className="absolute left-0 top-0 w-1.5 h-full bg-brand-500" />
                )}
                <item.icon size={22} className={cn(
                  "transition-all duration-300",
                  location.pathname === item.path ? "text-brand-500 scale-110" : "text-slate-400 group-hover:text-brand-600 group-hover:scale-110"
                )} />
                <span className="tracking-tight text-lg flex-1">{item.label}</span>
                {item.path === '/agents' && pendingCount > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded-full animate-pulse shadow-lg shadow-amber-500/20">
                    {pendingCount}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {isAgent && (
            <div className="space-y-4 mb-10">
              <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Actions Rapides</p>
              <Link 
                to="/pos"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-4 w-full px-5 py-4 rounded-2xl bg-brand-600 text-white hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/20 font-black uppercase tracking-widest text-[10px] group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PlusCircle size={18} />
                </div>
                Nouvelle Vente
              </Link>
              <Link 
                to="/stock"
                state={{ openModal: true }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-4 w-full px-5 py-4 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 font-black uppercase tracking-widest text-[10px] group active:scale-95"
              >
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus size={18} />
                </div>
                Ajouter Produit
              </Link>
            </div>
          )}

          <div className="mt-auto pt-8 border-t border-slate-100 space-y-6">
            <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-brand-200 transition-colors">
              <div className="bg-brand-100 text-brand-700 p-3 rounded-2xl group-hover:bg-brand-600 group-hover:text-white transition-all duration-300">
                <UserIcon size={24} />
              </div>
              <div className="overflow-hidden">
                <p className="font-black text-slate-900 truncate tracking-tight">{user?.displayName || 'Utilisateur'}</p>
                <p className="text-[10px] font-black text-brand-600 uppercase tracking-[0.2em] mt-0.5">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 w-full px-5 py-4 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all duration-300 font-black uppercase tracking-widest text-xs group shadow-sm hover:shadow-lg hover:shadow-rose-600/20 active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center group-hover:bg-rose-500 transition-colors shadow-sm">
                <LogOut size={20} />
              </div>
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-auto relative">
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
