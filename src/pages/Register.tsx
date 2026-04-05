import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { Package, Mail, Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'admin' | 'agent'>('agent');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  
    const handleGoogleLogin = async () => {
      setError('');
      setLoading(true);
      try {
        await loginWithGoogle();
        navigate('/');
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la connexion avec Google.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res: any = await register({ email, password, displayName, role });
      if (res.pendingApproval) {
        setSuccess(res.message);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Registration Error:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'inscription.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/10">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Inscription réussie !</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            {success}
          </p>
          <Link
            to="/login"
            className="block w-full bg-brand-600 text-white font-black py-4 rounded-2xl hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/20 uppercase tracking-widest text-xs"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-green-600 p-8 text-center">
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Package className="text-green-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Pharmacie Mampikony</h1>
          <p className="text-green-100 mt-1">Créez votre compte professionnel</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 flex items-start gap-3 rounded-r-lg">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                  placeholder="Jean Dupont"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('agent')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all",
                    role === 'agent'
                      ? "border-green-600 bg-green-50 text-green-700 font-bold"
                      : "border-gray-100 bg-gray-50 text-gray-500"
                  )}
                >
                  <User size={18} />
                  Agent
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={cn(
                    "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all",
                    role === 'admin'
                      ? "border-green-600 bg-green-50 text-green-700 font-bold"
                      : "border-gray-100 bg-gray-50 text-gray-500"
                  )}
                >
                  <ShieldCheck size={18} />
                  Admin
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 italic">* Le rôle Admin nécessite une validation pour certaines actions.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full bg-green-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 active:bg-green-800 transition-all shadow-lg shadow-green-600/20 mt-4",
                loading && "opacity-70 cursor-not-allowed"
              )}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  S'inscrire
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 uppercase tracking-wider">Ou continuer avec</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white border border-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all shadow-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              S'inscrire avec Google
            </button>
          </form>

          {error && error.includes('auth/operation-not-allowed') && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>Note :</strong> La connexion par email/mot de passe n'est pas encore activée dans votre console Firebase. 
                Utilisez <strong>Google</strong> pour vous inscrire ou activez "Email/Password" dans :
                <br />
                <a 
                  href={`https://console.firebase.google.com/project/gen-lang-client-0227827330/authentication/providers`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-bold"
                >
                  Console Firebase → Authentication
                </a>
              </p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-600 text-sm">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-green-600 hover:text-green-700 font-bold">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
