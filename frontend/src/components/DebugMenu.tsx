"use client";

import { useUser } from '@/contexts/UserContext';
import { useState } from 'react';

export function DebugMenu() {
    const { user, refetchUser } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!user) return null;

    const handleUpdate = async (plan: string, live: boolean, wallet: boolean) => {
        setLoading(true);
        try {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
            await fetch(`${backendUrl}/debug/toggle-plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: user.phone || 'admin', // Fallback se não tiver phone no contexto
                    plan,
                    hasLiveAccess: live,
                    hasWalletAccess: wallet
                })
            });
            // Força recarregamento do usuário para refletir mudança
            await refetchUser();
            alert(`Alterado para: ${plan.toUpperCase()}`);
        } catch (err) {
            console.error(err);
            alert('Erro ao alterar plano');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-[9999] font-sans">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs opacity-50 hover:opacity-100 shadow-lg border border-gray-600"
            >
                {isOpen ? 'Fechar Debug' : '🛠️ Debug'}
            </button>

            {isOpen && (
                <div className="absolute bottom-10 right-0 bg-gray-900 border border-gray-700 p-4 rounded-lg shadow-2xl w-64 space-y-3">
                    <h3 className="text-white text-sm font-bold border-b border-gray-700 pb-2">Alterar Nível de Acesso</h3>

                    <button
                        onClick={() => handleUpdate('basic', false, false)}
                        disabled={loading}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-800 text-gray-300 text-xs flex justify-between"
                    >
                        <span>Nível 1: Básico</span>
                        {user.plan === 'basic' && <span className="text-green-500">✓</span>}
                    </button>

                    <button
                        onClick={() => handleUpdate('premium', false, false)}
                        disabled={loading}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-800 text-amber-300 text-xs flex justify-between"
                    >
                        <span>Nível 2: Premium (Até M6)</span>
                        {user.plan === 'premium' && <span className="text-green-500">✓</span>}
                    </button>

                    <button
                        onClick={() => handleUpdate('ultra', true, true)}
                        disabled={loading}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-800 text-purple-300 text-xs flex justify-between"
                    >
                        <span>Nível 3: Ultra (Tudo Liberado)</span>
                        {user.plan === 'ultra' && <span className="text-green-500">✓</span>}
                    </button>

                    <div className="text-[10px] text-gray-500 mt-2 border-t border-gray-700 pt-2">
                        Simula compra sem pagar. Apenas para testes.
                    </div>
                </div>
            )}
        </div>
    );
}
