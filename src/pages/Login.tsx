import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import { Package, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
    const { login, loginWithGoogle, user, loading: authLoading } = useAuth();
  
    const from = location.state?.from?.pathname || '/';

    React.useEffect(() => {
      if (!authLoading && user) {
        navigate(from, { replace: true });
      }
    }, [user, authLoading, navigate, from]);

    const handleGoogleLogin = async () => {
      setError('');
      setLoading(true);
      try {
        const res: any = await loginWithGoogle();
        if (res?.pendingApproval) {
          setError(res.message);
        } else {
          navigate(from, { replace: true });
        }
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
    setLoading(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login Error:', err);
      let errorMessage = err.message || 'Email ou mot de passe incorrect.';
      
      // If it's a standard auth error, we can be more specific
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.message.includes('incorrect')) {
        errorMessage = 'Email ou mot de passe incorrect. Si vous avez créé votre compte avec Google, veuillez utiliser le bouton Google ci-dessous.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-brand-600 p-8 text-center">
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Package className="text-brand-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Pharmacie Mampikony</h1>
          <p className="text-brand-100 mt-1 font-medium">Accédez à votre espace de gestion</p>
        </div>

        <div className="p-8">
          {error ? (
            <div className="bg-danger-50 border-l-4 border-danger-500 p-4 mb-6 flex flex-col gap-2 rounded-r-lg shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-danger-500 shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="text-sm text-danger-700 font-bold">Erreur de connexion</p>
                  <p className="text-xs text-danger-600 mt-1">
                    {error.startsWith('{') ? (
                      (() => {
                        try {
                          const errObj = JSON.parse(error);
                          if (errObj.error.includes('Missing or insufficient permissions')) {
                            return "Erreur de permissions Firestore. Votre compte n'est peut-être pas encore approuvé.";
                          }
                          return `Erreur Firestore (${errObj.operationType}) sur ${errObj.path}: ${errObj.error}`;
                        } catch {
                          return error;
                        }
                      })()
                    ) : error}
                  </p>
                </div>
              </div>
              {error.includes('unauthorized-domain') && (
                <div className="mt-2 p-2 bg-white/50 rounded border border-red-100 text-[10px] text-red-500 italic">
                  Note: Ce domaine n'est pas autorisé dans Firebase. Ajoutez-le dans Authentication &rarr; Settings &rarr; Authorized Domains.
                </div>
              )}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link to="/forgot-password" title="Mot de passe oublié ?" className="text-green-600 hover:text-green-700 font-medium">
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "btn-primary w-full",
                loading && "opacity-70 cursor-not-allowed"
              )}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Se connecter
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
              Se connecter avec Google
            </button>
          </form>

          {error && error.includes('auth/operation-not-allowed') && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>Note :</strong> La connexion par email/mot de passe n'est pas encore activée dans votre console Firebase. 
                Utilisez <strong>Google</strong> pour vous connecter ou activez "Email/Password" dans :
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
              Nouveau ici ?{' '}
              <Link to="/register" className="text-green-600 hover:text-green-700 font-bold">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
