// Caminho: frontend/src/app/(admin)/layout.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ChatbotNina from '@/components/ChatbotNina';
import { UserProvider, useUser } from '@/contexts/UserContext';
import { DevPlanSwitcher } from '@/components/DevPlanSwitcher';
import { motion, AnimatePresence } from 'framer-motion';

// --- Componente Interno para a Sidebar e Conteúdo ---
const LayoutWithSidebar = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [progressoTotal, setProgressoTotal] = useState(0);
  const [modulos, setModulos] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false); // Estado do Modal de Suporte

  useEffect(() => {
    setIsMounted(true);
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    router.push('/');
  }, [router]);

  // ▼▼▼ ESTA É A FUNÇÃO CORRIGIDA ▼▼▼
  // Ela soma o total de AULAS e o total de AULAS CONCLUÍDAS e AGORA GUARDA OS MÓDULOS
  const fetchProgressData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
      const [modulosRes, progressoRes] = await Promise.all([
        fetch(`${backendUrl}/modulos`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' }),
        fetch(`${backendUrl}/progresso`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' })
      ]);

      if (!modulosRes.ok || !progressoRes.ok) {
        handleLogout();
        return;
      }

      const modulosData = await modulosRes.json();
      setModulos(modulosData); // Salva para renderizar os atalhos

      // aulasConcluidasIds é um array de números, ex: [1, 5, 12]
      const aulasConcluidasIds = await progressoRes.json();
      const aulasConcluidasIdSet = new Set(aulasConcluidasIds);

      // Filtrar módulos que não são de certificado para o cálculo
      const modulosPrincipais = modulosData.filter((m: any) => m.nome && !m.nome.toLowerCase().includes('certificado'));

      let totalAulas = 0;
      let totalConcluidas = 0;

      for (const modulo of modulosPrincipais) {
        if (Array.isArray(modulo.aulas) && modulo.aulas.length > 0) {
          for (const aula of modulo.aulas) {
            totalAulas++;
            if (aula && aula.id && aulasConcluidasIdSet.has(aula.id)) {
              totalConcluidas++;
            }
          }
        }
      }

      setProgressoTotal(totalAulas > 0 ? (totalConcluidas / totalAulas) * 100 : 0);

    } catch (error) {
      console.error("Erro ao buscar progresso total:", error);
    }
  }, [handleLogout]);
  // ▲▲▲ FIM DA FUNÇÃO CORRIGIDA ▲▲▲


  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    } else {
      fetchProgressData();
    }

    const handleStorageChange = (event: any) => {
      // O Quiz salva "quiz_state". Se isso mudar, pode ser que tenha terminado.
      if (!event.key || event.key === 'aula_concluida' || event.key === 'quiz_state' || event.key === null) {
        fetchProgressData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router, fetchProgressData]);

  // --- Componente ProgressCircle (Definido internamente) ---
  const ProgressCircle = ({ percentage }: { percentage: number }) => {
    const radius = 20;
    const stroke = 3;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="-rotate-90">
          <circle stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} fill="transparent" r={normalizedRadius} cx={radius} cy={radius} />
          <circle
            stroke="#10b981"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">{Math.round(percentage)}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] font-sans text-gray-100 overflow-hidden relative">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-80 bg-[#1e293b]/95 backdrop-blur-xl border-r border-white/5 shadow-2xl z-40 flex flex-col pt-6 pb-6"
          >
            {/* Cabeçalho da Sidebar */}
            <div className="px-6 pb-6 border-b border-white/5 flex flex-col items-center space-y-4">
              <div className="relative group cursor-pointer">
                {/* Visual Effects */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full opacity-60 group-hover:opacity-100 blur transition duration-500"></div>
                <div className="relative w-20 h-20 rounded-full border-4 border-[#1e293b] overflow-hidden">
                  <img
                    src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=10b981&color=fff`}
                    alt="Avatar"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Overlay de Upload */}
                  <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const formData = new FormData();
                      formData.append('profileImage', file);

                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL}/upload-profile-image`, {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${token}` },
                          body: formData
                        });
                        if (res.ok) {
                          const data = await res.json();
                          // Force reload to update context/image
                          window.location.reload();
                        } else {
                          alert("Erro ao enviar imagem.");
                        }
                      } catch (err) { console.error(err); alert("Erro ao enviar imagem."); }
                    }}
                  />
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-lg font-bold text-white tracking-tight">{user?.name || 'Visitante'}</h2>
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">{user?.plan || 'Plano Básico'}</p>
              </div>

              <div className="flex items-center gap-3 bg-[#0f172a]/50 px-4 py-2 rounded-full border border-white/5">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Progresso Geral</span>
                <ProgressCircle percentage={progressoTotal} />
              </div>
            </div>

            {/* Corpo da Sidebar (Botões) */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 overflow-y-auto">
              <Link
                href="/dashboard"
                className="w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3 group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">🏠</span>
                <span className="uppercase tracking-widest text-xs">Ir para Dashboard</span>
              </Link>

              <button
                onClick={() => setIsSupportOpen(true)}
                className="group relative w-full px-6 py-4 bg-[#0f172a] hover:bg-[#334155] border border-amber-500/30 hover:border-amber-500/60 rounded-xl transition-all duration-300 shadow-lg hover:shadow-amber-500/10 flex flex-col items-center gap-1"
              >
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform duration-300">💬</span>
                <span className="uppercase tracking-[0.2em] text-xs font-bold text-amber-50 group-hover:text-amber-400">Suporte VIP</span>
              </button>
            </div>

            {/* Rodapé da Sidebar (Logout) */}
            <div className="px-6 pt-4 border-t border-white/5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center py-2 text-xs text-red-400/70 hover:text-red-400 transition-colors uppercase tracking-widest font-bold gap-2 hover:bg-red-900/10 rounded-lg"
              >
                ✕ Encerrar Sessão
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Botão Mobile Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-emerald-600 text-white rounded-full shadow-lg border border-white/20"
        aria-label="Menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
        </svg>
      </button>

      {/* Área Principal de Conteúdo */}
      <main className={`flex-1 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'md:ml-80' : ''} min-h-screen`}>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Chatbot Nina */}
      <ChatbotNina />

      {/* Modal de Suporte */}
      <AnimatePresence>
        {isSupportOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setIsSupportOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#1e293b] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500"></div>
              <div className="p-8 relative">
                <button onClick={() => setIsSupportOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#0f172a] rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-inner">
                    <span className="text-3xl">💬</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">Suporte Premium</h3>
                  <p className="text-sm text-gray-400">Nossa equipe está pronta para te ajudar.</p>
                </div>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    // Simulação de envio
                    alert('Sua mensagem foi enviada! Responderemos em breve.');
                    setIsSupportOpen(false);
                  }}
                >
                  <div>
                    <label className="block text-xs uppercase text-gray-400 font-bold mb-2 ml-1">Mensagem</label>
                    <textarea
                      required
                      className="w-full h-32 bg-[#0f172a] border border-[#334155] rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none text-sm"
                      placeholder="Descreva seu problema ou dúvida..."
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold uppercase tracking-widest rounded-xl shadow-lg transition-transform transform hover:scale-[1.02] active:scale-95 text-xs"
                  >
                    Enviar Solicitação
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Componente Principal do Layout ---
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <LayoutWithSidebar>{children}</LayoutWithSidebar>

      {/* O Switcher de planos para teste */}
      <DevPlanSwitcher />
    </UserProvider>
  );
}