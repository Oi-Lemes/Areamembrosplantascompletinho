// Caminho: frontend/src/app/(admin)/layout.tsx
"use client";

import { useEffect, useState, useCallback } from 'react';
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
      if (!event.key || event.key === 'aula_concluida' || event.key === null) {
        fetchProgressData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router, fetchProgressData]);

  const ProgressCircle = ({ percentage }: { percentage: number }) => {
    const strokeWidth = 4; // Mais fino e elegante
    const radius = 35; // Um pouco menor para caber bem
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Lógica de Cores Suave (Gradiente Dinâmico): Vermelho (0) -> Amarelo (60) -> Verde (120)
    const getColor = () => {
      // Interpolação de Hue: 0 (Vermelho) até 120 (Verde) baseado na porcentagem
      // Math.min garante que não passe de 120 mesmo se por acaso a % passar de 100
      const hue = Math.min((percentage / 100) * 120, 120);
      return `hsl(${hue}, 80%, 45%)`; // Saturation 80%, Lightness 45% (um pouco mais escuro para elegância)
    };

    return (
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="-rotate-90">
          {/* Fundo do círculo */}
          <circle stroke="#1e293b" fill="transparent" strokeWidth={strokeWidth} r={normalizedRadius} cx={radius} cy={radius} />
          {/* Progresso */}
          <circle
            stroke={getColor()}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease-out' }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-sm font-bold font-serif ${percentage === 100 ? 'text-emerald-400' : 'text-white'}`}>{`${Math.round(percentage)}%`}</span>
        </div>
      </div>
    );
  };

  // --- UPLOAD DE FOTO DE PERFIL ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { setUser } = useUser(); // Garantir que pegamos o setUser do contexto

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

      const response = await fetch(`${backendUrl}/upload-profile-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Falha no upload');

      const data = await response.json();

      // Atualiza o contexto do usuário com a nova imagem
      if (data.success && user) {
        setUser({ ...user, profileImage: data.profileImage });
      }

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao atualizar foto de perfil.');
    } finally {
      setIsUploading(false);
    }
  };

  // Helper para montar URL da imagem (se for relativa do backend)
  const getProfileImageUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
    return `${backendUrl}${path}`;
  };

  return (
    <div className="flex min-h-screen bg-transparent">
      {/* Overlay Mobile */}
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm" />}

      {/* SIDEBAR PREMIUM REDESIGNED */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className={`w-80 flex flex-col fixed top-0 left-0 h-full z-40 bg-[#0f172a] text-white border-r border-[#1e293b] shadow-2xl overflow-y-auto custom-scrollbar`}
          >
            {/* Header: User Profile com Toque Dourado */}
            <div className="relative p-8 flex flex-col items-center border-b border-[#1e293b] bg-[#131c31]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500"></div>

              <div className={`flex flex-col items-center transition-all duration-700 ease-out ${isMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>

                {/* Avatar do Usuário (Foto de Perfil) */}
                <label
                  className="relative group cursor-pointer block"
                >
                  <div className="w-20 h-20 rounded-full border-2 border-emerald-500/80 p-1 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.5)] overflow-hidden bg-slate-900 transition-all active:scale-95 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.8)]">
                    <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-2xl relative overflow-hidden group-hover:bg-slate-700 transition-colors">
                      {user?.profileImage ? (
                        // Use img tag for simpler control, or Next.js Image if preferred. Using img specific for external uploads check
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getProfileImageUrl(user.profileImage) || ''}
                          alt="Perfil"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback se a imagem falhar
                            (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=Membro+VIP&background=random';
                          }}
                        />
                      ) : (
                        // Ícone de Câmera "Na Cara" 
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-emerald-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                        </svg>
                      )}

                      {/* Overlay de Edição on Hover */}
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {isUploading ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white scale-110">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Input Hidden - Dentro do Label dispara automático */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
                <h2 className="text-xl font-serif text-amber-50 tracking-wide font-thin italic mb-2">
                  {userLoading
                    ? '...'
                    : (user?.name && user.name !== 'Aluno Novo')
                      ? user.name.toLowerCase().split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                      : 'Membro VIP'}
                </h2>

                {/* Roda de Progresso (Restaurada) */}
                <div className="mb-2">
                  <ProgressCircle percentage={progressoTotal} />
                </div>

                <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-500 mt-2 font-bold">Acesso Vitalício</p>
              </div>
            </div>

            {/* Content Area - Agora Focado Apenas no Suporte */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
              <p className="text-center text-gray-400 text-sm font-serif italic">
                "O sucesso é a soma de pequenos esforços repetidos dia após dia."
              </p>

              <button
                onClick={() => setIsSupportOpen(true)}
                className="group relative w-full px-6 py-4 bg-[#1e293b] hover:bg-[#334155] border border-amber-500/30 hover:border-amber-500/60 rounded-xl transition-all duration-300 shadow-lg hover:shadow-amber-500/10 flex flex-col items-center gap-2"
              >
                <span className="text-3xl mb-1 group-hover:scale-110 transition-transform duration-300">💬</span>
                <span className="uppercase tracking-[0.2em] text-xs font-bold text-amber-50 group-hover:text-amber-400">Suporte VIP</span>
                <span className="text-[10px] text-gray-500">Fale com a equipe</span>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>

            {/* Logout Minimalista */}
            <div className="p-6 border-t border-[#1e293b]">
              <button onClick={handleLogout} className="flex items-center text-xs text-red-400/60 hover:text-red-400 transition-colors uppercase tracking-widest font-bold">
                <span className="mr-2">✕</span> Encerrar Sessão
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white/50 backdrop-blur-sm rounded-full text-black transition-all duration-300 ease-in-out hover:bg-white/80 md:hidden shadow-lg border border-white/30"
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
        )}
      </button>

      <main className={`flex-1 p-6 sm:p-8 lg:p-12 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'md:ml-80' : ''} flex flex-col items-center`}>
        <div className="w-full max-w-6xl">
          {children}
        </div>
      </main>
      <ChatbotNina />

      {/* MODAL DE SUPORTE - Estilo "Quadrado" Minimalista */}
      <AnimatePresence>
        {isSupportOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setIsSupportOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#1e293b] border border-[#334155] p-8 rounded-2xl shadow-2xl relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 rounded-t-2xl"></div>

              <button onClick={() => setIsSupportOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">✕</button>

              <div className="text-center mb-8">
                <span className="text-4xl mb-4 block">💬</span>
                <h3 className="text-2xl font-serif text-white italic mb-2">Suporte Premium</h3>
                <p className="text-gray-400 text-sm">Como podemos ajudar você hoje?</p>
              </div>

              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Mensagem enviada com sucesso! Nossa equipe entrará em contato em breve.'); setIsSupportOpen(false); }}>
                <div>
                  <label className="block text-[#94a3b8] text-xs uppercase tracking-widest font-bold mb-2">Sua Mensagem</label>
                  <textarea
                    className="w-full h-32 bg-[#0f172a] border border-[#334155] rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                    placeholder="Descreva sua dúvida ou solicitação..."
                  ></textarea>
                </div>
                <button type="submit" className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all transform hover:scale-[1.02]">
                  Enviar Solicitação
                </button>
              </form>
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