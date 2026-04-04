import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../components/AuthProvider';
import { Users, Search, ArrowLeft, User, DollarSign, ShoppingBag, Calendar, Check, X as XIcon, Trash2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Agents: React.FC = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const data = await api.auth.list();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (window.confirm('Voulez-vous approuver ce compte agent ?')) {
      setActionLoading(id);
      try {
        await api.auth.approve(id);
        await fetchUsers();
      } catch (err) {
        console.error(err);
        alert('Erreur lors de l\'approbation.');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous supprimer ce compte ? Cette action est irréversible.')) {
      setActionLoading(id);
      try {
        await api.auth.delete(id);
        await fetchUsers();
      } catch (err) {
        console.error(err);
        alert('Erreur lors de la suppression.');
      } finally {
        setActionLoading(null);
      }
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  const filteredUsers = users.filter(u =>
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingUsers = filteredUsers.filter(u => !u.approved);
  const approvedUsers = filteredUsers.filter(u => u.approved);

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
              <Users size={24} />
            </div>
            Gestion des Agents
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Approuvez les nouveaux comptes et suivez les performances.</p>
        </div>
      </header>

      {/* Search */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
          <input
            type="text"
            placeholder="Rechercher un agent par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 font-medium text-lg placeholder:text-slate-400 transition-all"
          />
        </div>
      </div>

      {/* Pending Approvals Section */}
      {pendingUsers.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="w-2 h-8 bg-amber-500 rounded-full" />
            En attente d'approbation ({pendingUsers.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pendingUsers.map((user) => (
              <div key={user.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-amber-100 shadow-xl shadow-amber-500/5 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    En attente
                  </span>
                </div>
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <User size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight">{user.displayName}</h3>
                    <p className="text-slate-400 font-bold text-sm">{user.email}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(user.id)}
                    disabled={actionLoading === user.id}
                    className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {actionLoading === user.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Check size={20} />
                        Approuver
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={actionLoading === user.id}
                    className="w-14 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all rounded-2xl flex items-center justify-center active:scale-95"
                  >
                    <XIcon size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Approved Agents Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <div className="w-2 h-8 bg-brand-600 rounded-full" />
          Agents Actifs ({approvedUsers.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 animate-pulse">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl" />
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-slate-100 rounded" />
                    <div className="w-24 h-3 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-20 bg-slate-50 rounded-2xl" />
                  <div className="h-20 bg-slate-50 rounded-2xl" />
                </div>
              </div>
            ))
          ) : approvedUsers.length > 0 ? (
            approvedUsers.map((user) => (
              <div key={user.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative">
                {isAdmin && user.role !== 'admin' && (
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    title="Supprimer l'agent"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                    <User size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight">{user.displayName}</h3>
                    <p className="text-slate-400 font-bold text-sm">{user.email}</p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      user.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ventes</p>
                    <div className="flex items-center gap-2 text-slate-900">
                      <ShoppingBag size={16} className="text-brand-600" />
                      <span className="text-xl font-black">{user.salesCount}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chiffre d'Aff.</p>
                    <div className="flex items-center gap-2 text-slate-900">
                      <DollarSign size={16} className="text-emerald-600" />
                      <span className="text-xl font-black">{(user.totalSales || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold pt-6 border-t border-slate-50">
                  <Calendar size={14} />
                  Inscrit le {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: fr })}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="bg-slate-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                <Users className="text-slate-300" size={48} />
              </div>
              <p className="text-slate-900 font-black text-2xl mb-2">Aucun agent trouvé</p>
              <p className="text-slate-500 font-medium">Essayez de modifier vos critères de recherche.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Agents;
