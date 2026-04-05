import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Mail, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'envoi de l\'email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-green-600 p-8 text-center">
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Package className="text-green-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Pharmacie Mampikony</h1>
          <p className="text-green-100 mt-1">Récupération de mot de passe</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 flex items-start gap-3 rounded-r-lg">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-6">
              <div className="bg-green-50 border-l-4 border-green-500 p-4 flex items-start gap-3 rounded-r-lg text-left">
                <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                <p className="text-sm text-green-700">
                  Un email de réinitialisation a été envoyé à <strong>{email}</strong>.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-green-600 font-bold hover:text-green-700 transition-colors"
              >
                <ArrowLeft size={18} />
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-gray-600 text-sm">
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
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

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full bg-green-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 active:bg-green-800 transition-all shadow-lg shadow-green-600/20",
                  loading && "opacity-70 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Envoyer le lien"
                )}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-gray-500 text-sm font-medium hover:text-green-600 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Retour à la connexion
                </Link>
              </div>
            </form>
          )}

          {error && error.includes('auth/operation-not-allowed') && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>Note :</strong> La réinitialisation par email n'est pas encore activée dans votre console Firebase. 
                Activez "Email/Password" dans :
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
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
