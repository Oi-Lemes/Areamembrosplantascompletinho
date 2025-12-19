"use client";

import { useUser } from '@/contexts/UserContext';
import { useState } from 'react';

export const DevPlanSwitcher = () => {
  const { user, refetchUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Removido o check de NODE_ENV para aparecer em produção pro usuário testar
  if (!user) return null;

  const handleUpdate = async (plan: string, live: boolean, wallet: boolean) => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
      const res = await fetch(`${backendUrl}/debug/toggle-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: user.phone, // Pega do usuário logado
          plan,
          hasLiveAccess: live,
          hasWalletAccess: wallet
        })
      });

      if (!res.ok) throw new Error('Falha no update');

      // Força recarregamento do usuário para refletir mudança
      if (refetchUser) await refetchUser();
      alert(`✅ Plano alterado para: ${plan.toUpperCase()}\n(A página pode recarregar)`);
      window.location.reload(); // Recarrega para garantir que tudo atualize
    } catch (err) {
      console.error(err);
      alert('Erro ao alterar plano. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[9999] font-sans">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-900 border border-gray-600 text-white px-4 py-2 rounded-full text-xs shadow-xl opacity-90 hover:opacity-100 flex items-center gap-2 transition-all"
      >
        <span>🛠️ Debug: {user.plan?.toUpperCase()}</span>
        {loading && <span className="animate-spin">⏳</span>}
      </button>

      {isOpen && (
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gray-700 p-4 rounded-xl shadow-2xl w-72 space-y-3">
          <h3 className="text-white text-sm font-bold border-b border-gray-700 pb-2 text-center">Painel de Teste (Modo Deus)</h3>

          <button
            onClick={() => handleUpdate('basic', false, false)}
            disabled={loading}
            className={`w-full text-left px-3 py-3 rounded-lg hover:bg-gray-800 text-xs flex justify-between items-center transition-colors ${user.plan === 'basic' ? 'bg-gray-800 ring-1 ring-gray-500' : ''}`}
          >
            <div className="text-gray-300">
              <span className="block font-bold">Nível 1: Básico</span>
              <span className="text-[10px] opacity-70">Trava após Módulo 6</span>
            </div>
            {user.plan === 'basic' && <span className="text-green-500 text-lg">✓</span>}
          </button>

          <button
            onClick={() => handleUpdate('premium', false, false)}
            disabled={loading}
            className={`w-full text-left px-3 py-3 rounded-lg hover:bg-gray-800 text-xs flex justify-between items-center transition-colors ${user.plan === 'premium' ? 'bg-gray-800 ring-1 ring-amber-500/50' : ''}`}
          >
            <div className="text-amber-300">
              <span className="block font-bold">Nível 2: Premium</span>
              <span className="text-[10px] opacity-70">Libera Módulos • Trava Live</span>
            </div>
            {user.plan === 'premium' && <span className="text-green-500 text-lg">✓</span>}
          </button>

          <button
            onClick={() => handleUpdate('ultra', true, true)}
            disabled={loading}
            className={`w-full text-left px-3 py-3 rounded-lg hover:bg-gray-800 text-xs flex justify-between items-center transition-colors ${user.plan === 'ultra' ? 'bg-gray-800 ring-1 ring-purple-500/50' : ''}`}
          >
            <div className="text-purple-300">
              <span className="block font-bold">Nível 3: Ultra</span>
              <span className="text-[10px] opacity-70">Tudo Liberado (Live/Carteira)</span>
            </div>
            {user.plan === 'ultra' && <span className="text-green-500 text-lg">✓</span>}
          </button>
        </div>
      )}
    </div>
  );
};