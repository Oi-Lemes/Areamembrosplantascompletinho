"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// --- COMPONENTES DE ÍCONES ---

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

// Novo ícone de partilha para o tutorial do iOS
const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mx-1" viewBox="0 0 20 20" fill="currentColor">
    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
  </svg>
);


// --- COMPONENTE PWA ATUALIZADO ---

const PwaInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showIOSInstruction, setShowIOSInstruction] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
      // FORÇA A ATUALIZAÇÃO DO SERVICE WORKER (FIX CRÍTICO)
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
          registration.unregister(); // Remove o antigo (que estava com bug)
        }
      });

      // Registra o novo limpo
      navigator.serviceWorker.register('/sw.js?v=2')
        .then((reg) => {
          console.log('Service Worker v2 registado.');
          reg.update(); // Força update imediato
        })
        .catch(err => console.error("Falha no registo do Service Worker:", err));
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const timer = setTimeout(() => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOSDevice && !installPrompt) {
        setShowIOSInstruction(true);
      }
    }, 1500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, [installPrompt]);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('Utilizador instalou a app');
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="flex items-center justify-center text-center text-sm text-green-400 bg-gray-900/50 p-3 rounded-md border border-gray-700">
        <p>✅ App instalado! Procure o ícone na tela inicial do seu celular!.</p>
      </div>
    );
  }

  if (installPrompt) {
    return (
      <button
        onClick={handleInstallClick}
        className="w-full flex items-center justify-center px-4 py-3 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors animate-pulse"
      >
        <PhoneIcon />
        <span>Instalar App no seu Celular</span>
      </button>
    );
  }

  if (showIOSInstruction) {
    return (
      <div className="flex flex-col items-center space-y-4 text-center bg-gray-900/50 p-4 rounded-md border border-gray-700 animate-pulse">
        {/* ALTERAÇÃO AQUI: Mensagem para iOS mais visível e em PT-BR */}
        <div className="flex items-center text-base text-gray-200 font-semibold">
          <p>Para instalar no iPhone, toque em <ShareIcon /> "Compartilhar" e depois em "Adicionar à Tela de Início".</p>
        </div>
        <img
          src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzdqYjIyZGlvbHhzbzh0dXozYmE5dTJ3anVwbXd6Nm50b2oxYWp6YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Sr7k4SirUQ0GP7MII4/giphy.gif"
          alt="Tutorial de instalação no iOS"
          width="180"
          className="rounded-lg"
        />
      </div>
    );
  }

  return null;
};


// --- PÁGINA DE LOGIN ---


export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Formata o telefone enquanto digita (11) 99999-9999
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    if (value.length > 9) {
      value = `${value.slice(0, 9)}-${value.slice(9)}`;
    }

    setPhone(value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login-phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        // localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setMessage(data.error || 'Acesso negado. Verifique se comprou o curso.');
      }
    } catch (error) {
      setMessage("Erro de conexão: Não foi possível comunicar com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0f172a] text-white p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500"></div>
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
      <div className="absolute top-40 -right-20 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md p-8 space-y-8 bg-[#1e293b] border border-[#334155] rounded-2xl shadow-2xl relative z-10 transition-all hover:border-emerald-500/30">

        <div className="mb-6">
          <PwaInstallPrompt />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-serif text-white tracking-wide italic">Área do Membro</h1>
          <p className="text-gray-400 text-sm font-light">Digite seu WhatsApp para acessar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">Seu WhatsApp</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-400 transition-colors">📞</span>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(11) 99999-9999"
                className="w-full bg-[#0f172a] border border-[#334155] text-white text-lg py-4 pl-12 pr-4 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-gray-600 font-mono"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || phone.length < 14}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? 'Verificando...' : 'Acessar Curso'}
          </button>
        </form>

        {message && (
          <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
            <p className="text-center text-sm text-red-400 flex items-center justify-center gap-2">
              <span>🚫</span> {message}
            </p>
          </div>
        )}

        <div className="text-center pt-4 border-t border-[#334155]">
          <p className="text-xs text-gray-600">Problemas no acesso? <span className="text-emerald-500 cursor-pointer hover:underline">Fale com o Suporte</span></p>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-600 font-serif italic">"A natureza guarda os segredos da cura."</p>
    </main>
  );
}