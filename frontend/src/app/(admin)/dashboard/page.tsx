// Caminho: frontend/src/app/(admin)/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/contexts/UserContext';
import { PixModal } from '@/components/PixModal'; // Importado corretamente
import { motion } from 'framer-motion';

// --- COMPONENTE DE EFEITO DE ESCRITA (SVG CONTOUR + FILL) ---
const TypewriterTitle = ({ text }: { text: string }) => {
  return (
    <div className="relative flex justify-center items-center overflow-visible p-4 mb-4">
      <motion.svg
        viewBox="0 0 1500 400" // Aumentado para fonte GIGANTE (250px)
        className="w-full h-auto min-w-[300px] max-w-7xl"
        initial="hidden"
        animate="visible"
        style={{ overflow: 'visible' }}
      >
        <motion.text
          x="50%"
          y="70%" // Centralização vertical calibrada para Pinyon Script
          textAnchor="middle"
          dominantBaseline="middle"
          stroke="#fff"
          strokeWidth="3" // Traço mais grosso para acompanhar o tamanho
          strokeDasharray="6000"
          fill="transparent"
          variants={{
            hidden: {
              strokeDashoffset: 6000,
              fillOpacity: 0,
              strokeOpacity: 0
            },
            visible: {
              strokeDashoffset: 0,
              strokeOpacity: 1,
              fillOpacity: 1,
              transition: {
                strokeDashoffset: { duration: 3.5, ease: "easeInOut" },
                strokeOpacity: { duration: 0.5 },
                fillOpacity: { duration: 1.0, delay: 3.0, ease: "easeIn" }
              }
            }
          }}
          style={{
            fontFamily: 'var(--font-pinyon-script)',
            fontSize: '250px', // Fonte MAXIMIZADA
            filter: 'drop-shadow(0px 0px 12px rgba(0,0,0,0.9))' // Sombra intensa
          }}
          className="font-script tracking-wide"
        >
          {text}
        </motion.text>
      </motion.svg>
    </div>
  );
};

// 1. Definir a interface PixData esperada pelo novo modal
interface PixData {
  pix_qr_code: string;
  amount_paid: number;
  expiration_date: string;
  hash: string;
}

// 2. Mapeamento dos Hashes de Produto (do seu server.js) e Preços
// Usei os preços baseados nos seus planos, ajuste se necessário.
// 2. Mapeamento dos Hashes de Produto (do seu server.js) e Preços
// frontend/src/app/(admin)/dashboard/page.tsx

// ... (imports) ...

// 2. Mapeamento dos Hashes de Produto ATUALIZADO
const PRODUCTS = {
  premium: {
    hash: 'dig1p', // Mantenha se ainda for este, ou atualize se migrou
    amount: 9700,
    title: 'Plano Premium'
  },
  ultra: {
    hash: 'tjxp0', // Mantenha se ainda for este, ou atualize se migrou
    amount: 19700,
    title: 'Plano Ultra'
  },
  live: {
    hash: 'prod_cb02db3516be7ede', // Live Dr José Nakamura (Paradise)
    amount: 6700,
    title: 'Dr José Nakamura'
  },
  nina: {
    hash: 'prod_0d6f903b6855c714', // Chatbot Nina (Paradise)
    amount: 2704,
    title: 'Acesso ao Chatbot Nina'
  },
  // ▼▼▼ ATUALIZADO AQUI ▼▼▼
  certificate: {
    hash: 'prod_0bc162e2175f527f', // Certificado (Paradise)
    amount: 1490,                 // Valor do PHP (R$ 14,90)
    title: 'Certificado'           // Título do PHP
  },
  wallet: {
    hash: 'prod_375f8ceb7a4cffcc', // Carteira ABRATH (Paradise)
    amount: 2700,                 // Valor do PHP (R$ 27,00)
    title: 'Carteira ABRATH'       // Título do PHP
  }
  // ▲▲▲ FIM DA ATUALIZAÇÃO ▲▲▲
};

// ... (resto do componente DashboardPage) ...

// --- Componente ProgressCircle (Mantido) ---
const ProgressCircle = ({ percentage }: { percentage: number }) => {
  // ... (código do ProgressCircle inalterado) ...
  const radius = 30;
  const stroke = 5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="absolute top-4 right-4 z-10">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle
          stroke="#ffffff50"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={(() => {
            const hue = Math.min((percentage / 100) * 120, 120); // 0 (Red) -> 120 (Green)
            return `hsl(${hue}, 80%, 45%)`;
          })()} // green-400 substituído pelo gradiente dinâmico
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-300"
          strokeLinecap="round" // Adicionado para melhor aparência
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">
        {Math.round(percentage)}%
      </span>
    </div>
  );
};


export default function DashboardPage() {
  const { user, loading: userLoading, refetchUser } = useUser();

  const [modulos, setModulos] = useState<any[]>([]);
  const [progressoModulos, setProgressoModulos] = useState<{ [key: number]: number }>({});
  const [aulasConcluidasIds, setAulasConcluidasIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 3. Estados atualizados para o novo modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null); // Usando a nova interface
  const [isLoadingPix, setIsLoadingPix] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [productKeyToBuy, setProductKeyToBuy] = useState<keyof typeof PRODUCTS | null>(null); // Guarda a *chave* do produto


  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      setLoading(true);
      setErrorMessage(null);
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

      console.log('🔍 DEBUG: Backend URL being used:', backendUrl); // LOG PARA DEBUG

      const [modulosRes, progressoModulosRes, progressoIdsRes] = await Promise.all([
        fetch(`${backendUrl}/modulos`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' }),
        fetch(`${backendUrl}/progresso-modulos`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' }),
        fetch(`${backendUrl}/progresso`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' })
      ]);
      if (!modulosRes.ok || !progressoModulosRes.ok || !progressoIdsRes.ok) throw new Error('Falha ao carregar dados.');
      const modulosData = await modulosRes.json();
      const progressoModulosData = await progressoModulosRes.json();
      const progressoIdsData = await progressoIdsRes.json();
      setModulos(modulosData);
      setProgressoModulos(progressoModulosData);
      setAulasConcluidasIds(progressoIdsData);
    } catch (error: any) {
      console.error("Erro ao buscar dados do dashboard:", error);
      setErrorMessage(error.message || "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'aula_concluida') {
        fetchData();
        refetchUser();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchData, refetchUser]);

  // 4. Função atualizada para o novo gateway (Paradise Pags)
  const handleOpenPixModal = async (productKey: keyof typeof PRODUCTS) => {
    const product = PRODUCTS[productKey];
    if (!product || !user) {
      alert("Produto inválido ou utilizador não autenticado.");
      return;
    }
    setIsLoadingPix(true);
    setPaymentError('');
    setProductKeyToBuy(productKey); // Guarda a chave do produto
    const token = localStorage.getItem('token');

    const paymentPayload = {
      productHash: product.hash,
      baseAmount: product.amount,
      productTitle: product.title,
      checkoutUrl: window.location.href
    };

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
      const response = await fetch(`${backendUrl}/gerar-pix-paradise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(paymentPayload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falha ao gerar o PIX.');

      setPixData({
        pix_qr_code: result.pix.pix_qr_code,
        amount_paid: result.amount_paid,
        expiration_date: result.pix.expiration_date,
        hash: result.hash
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error(error);
      setPaymentError(error instanceof Error ? error.message : "Ocorreu um erro desconhecido.");
    } finally {
      setIsLoadingPix(false);
    }
  };

  // 5. Nova função de callback para o modal
  const handlePaymentSuccess = () => {
    setIsModalOpen(false);
    refetchUser(); // Atualiza os dados do usuário
    alert('Pagamento confirmado! O seu acesso foi libertado.');
    setProductKeyToBuy(null); // Limpa o estado
  };

  // 6. Efeito para verificar se o pagamento foi bem-sucedido (após fechar o modal)
  //   Este efeito agora apenas verifica se o user state mudou E se o modal fechou
  useEffect(() => {
    if (!user || isModalOpen || !productKeyToBuy) return; // Só verifica se o modal fechou E tinha um produto a ser comprado

    // Verifica se o acesso para o produto que estava a ser comprado foi libertado
    let productWasPurchased = false;
    switch (productKeyToBuy) {
      case 'premium': productWasPurchased = user.plan === 'premium' || user.plan === 'ultra'; break;
      case 'ultra': productWasPurchased = user.plan === 'ultra'; break;
      case 'live': productWasPurchased = user.hasLiveAccess; break;
      case 'nina': productWasPurchased = user.hasNinaAccess; break;
      case 'certificate': // O certificado E a carteira dão hasWalletAccess
      case 'wallet': productWasPurchased = user.hasWalletAccess; break;
    }

    if (productWasPurchased) {
      // Não precisa mais de alert aqui, o handlePaymentSuccess já fez isso
      setProductKeyToBuy(null); // Limpa o estado
    }
  }, [user, isModalOpen, productKeyToBuy]); // Depende do user, modal e produto

  // Resto do código de renderização...
  if (loading || userLoading) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>;
  }
  if (errorMessage) {
    return (<div className="flex flex-col items-center justify-center h-full text-center text-red-400"><h2 className="text-2xl font-bold mb-4">Erro ao Carregar</h2><p>{errorMessage}</p><button onClick={fetchData} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Tentar Novamente</button></div>);
  }

  // ORDENAÇÃO ROBUSTA: Garantir que os módulos principais estejam em ordem (1, 2, 3...)
  const modulosPrincipais = Array.isArray(modulos)
    ? modulos
      .filter(m => m && m.nome && !m.nome.toLowerCase().includes('certificado'))
      .sort((a, b) => (a.ordem || a.id) - (b.ordem || b.id)) // Ordena por Ordem ou ID
    : [];

  const totalAulasPrincipais = modulosPrincipais.reduce((acc, m) => acc + (m.aulas?.length || 0), 0);
  const aulasPrincipais = modulosPrincipais.flatMap((m: any) => m.aulas || []);
  const totalConcluidasPrincipais = aulasPrincipais.filter((a: any) => aulasConcluidasIds.includes(a.id)).length;
  const cursoConcluido = totalAulasPrincipais > 0 && totalConcluidasPrincipais >= totalAulasPrincipais;

  const modulosParaExibir = [...modulosPrincipais];
  const modulosFixos = [
    { id: 98, nome: 'Live com o Dr. José Nakamura', description: 'Um encontro exclusivo para tirar dúvidas.', aulas: [] },
    { id: 99, nome: 'Grupo no Whatsapp', description: 'Conecte-se com outros alunos.', aulas: [] },
    { id: 100, nome: 'Emissão de Certificado', description: 'Parabéns! Emita o seu certificado.', aulas: [] },
    { id: 101, nome: 'Emissão CARTEIRA NACIONAL CRTH ABRATH', description: 'Esta carteira tem sua emissão de forma anual.', aulas: [] }
  ];
  // Adiciona módulos fixos se não existirem
  modulosFixos.forEach(mf => { if (!modulosParaExibir.some(m => m.id === mf.id)) modulosParaExibir.push(mf); });

  return (
    <section className="flex flex-col items-center w-full">
      <div className="text-center mb-10 md:mb-12 px-4 md:px-0">
        <TypewriterTitle text="Área de Membros" />
      </div>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {modulosParaExibir.map((modulo) => {
          // Encontrar o índice no array JÁ ORDENADO de principais
          const indexPrincipal = modulosPrincipais.findIndex(mp => mp.id === modulo.id);

          // Lógica de Bloqueio Linear:
          // Se for o primeiro (index 0), nunca bloqueia.
          // Se for > 0, verifica se o IMEDIATAMENTE ANTERIOR (index - 1) está 100%
          const progressoAnterior = indexPrincipal > 0 ? (progressoModulos[modulosPrincipais[indexPrincipal - 1].id] ?? 0) : 100;
          let isLockedByProgress = indexPrincipal > 0 && progressoAnterior < 100;

          // Estado de Conclusão do Próprio Módulo
          const progressPercentage = progressoModulos[modulo.id] ?? 0;
          const isCompleted = progressPercentage >= 100;

          let isPaywalled = false;
          let lockMessage = "Conclua o módulo anterior";
          let purchaseProductKey: keyof typeof PRODUCTS | null = null; // Usar a chave do produto

          let destinationUrl = `/modulo/${modulo.id}`;
          let imageIndex = modulo.ordem || (modulos.findIndex(m => m.id === modulo.id) + 1); // Usa ordem se disponível
          let imageUrl = imageIndex > 0 ? `/img/md${imageIndex}.jpg` : '/img/fundo.png';

          const userPlan = user?.plan || 'basic';

          // 7. LÓGICA DE BLOQUEIO ATUALIZADA com as chaves de produto
          if (indexPrincipal >= 6 && userPlan === 'basic') {
            isPaywalled = true;
            lockMessage = "Faça upgrade para Premium para aceder";
            purchaseProductKey = 'premium'; // Chave do Produto Premium
          }
          if (modulo.nome.toLowerCase().includes('certificado')) {
            destinationUrl = '/certificado'; imageUrl = '/img/md7.jpg';
            if (!cursoConcluido) { isLockedByProgress = true; lockMessage = "Conclua todos os módulos para emitir"; }
            else if (userPlan === 'basic' && !user?.hasWalletAccess) { // hasWalletAccess cobre Certificado e Carteira
              isPaywalled = true; isLockedByProgress = false;
              lockMessage = "Adquira o certificado para emitir";
              purchaseProductKey = 'certificate'; // Chave do Produto Certificado
            }
          } else if (modulo.nome.toLowerCase().includes('live')) {
            destinationUrl = '/live'; imageUrl = '/img/md8.jpg';
            if (!user?.hasLiveAccess && userPlan !== 'ultra') {
              isPaywalled = true;
              lockMessage = "Adquira seu acesso a este encontro exclusivo";
              purchaseProductKey = 'live'; // Chave do Produto Live
            }
          } else if (modulo.nome.toLowerCase().includes('whatsapp')) {
            destinationUrl = '#'; imageUrl = '/img/md9.jpg';
            isLockedByProgress = true;
            lockMessage = "Acesso liberado após a Live";
          } else if (modulo.nome.toLowerCase().includes('carteira')) {
            destinationUrl = '/carteira'; imageUrl = '/img/ABRATH.png';
            if (userPlan !== 'ultra' && !user?.hasWalletAccess) { // hasWalletAccess cobre Certificado e Carteira
              isPaywalled = true;
              lockMessage = "Exclusivo do plano Ultra ou compre agora";
              purchaseProductKey = 'wallet'; // Chave do Produto Carteira
            }
          }

          const isLocked = isLockedByProgress && !isPaywalled;
          const finalOnClick = isPaywalled && purchaseProductKey ? (e: React.MouseEvent) => { e.preventDefault(); handleOpenPixModal(purchaseProductKey!); } : undefined;

          // Classes Dinâmicas:
          // - Se bloqueado/paywall: grayscale alto, sem cursor
          // - Se concluído: grayscale leve (visual "terminado"), mas ainda clicável e brilhante
          // - Se normal: hover scale e shadow
          // Lógica Especial: Módulos Pagos/Extras (ID >= 90) nunca ficam cinza, para chamar atenção
          const isSpecialModule = modulo.id >= 90;

          const linkClassName = `group relative block rounded-lg overflow-hidden transition-all duration-500 transform 
            ${isPaywalled
              ? 'cursor-pointer hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/40'
              : isLocked
                ? (isSpecialModule
                  ? 'cursor-not-allowed contrast-75 brightness-75' // Bloqueado mas colorido (sem grayscale)
                  : 'cursor-not-allowed filter grayscale contrast-75 brightness-75' // Bloqueado normal (cinza)
                )
                : isCompleted
                  ? 'hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/20 grayscale-[0.8] hover:grayscale-0 opacity-80 hover:opacity-100 ring-2 ring-emerald-500/30'
                  : 'hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/40' // Normal
            }`;

          return (
            <Link key={modulo.id} href={isLocked || isPaywalled ? '#' : destinationUrl} onClick={finalOnClick} className={linkClassName}>
              <div className="relative w-full h-80"><Image src={imageUrl} alt={modulo.nome} layout="fill" objectFit="cover" className="transition-transform duration-500 group-hover:scale-110" onError={(e) => { e.currentTarget.src = '/img/fundo.png'; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 p-4 md:p-6 text-white w-full">
                <h3 className="text-xl md:text-2xl font-bold uppercase tracking-wider">{modulo.nome}</h3>
                <p className={`${modulo.nome.toLowerCase().includes('certificado') ? 'text-amber-300' : 'text-gray-300'} text-sm mt-1`}>
                  {modulo.nome.toLowerCase().includes('certificado') && '🏆 '} {modulo.description}
                </p>
              </div>
              {(!isLocked && !isPaywalled && modulo.aulas && modulo.aulas.length > 0) && <ProgressCircle percentage={progressoModulos[modulo.id] ?? 0} />}
              {(isLocked || isPaywalled) && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 text-center">
                  <span className="font-bold text-amber-400">{isPaywalled ? "CONTEÚDO EXCLUSIVO" : "BLOQUEADO"}</span>
                  <span className="text-xs">{lockMessage}</span>
                  {isPaywalled && (
                    <button className="mt-2 px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full hover:bg-amber-400">
                      {isLoadingPix && productKeyToBuy === purchaseProductKey ? 'A gerar...' : 'Liberar Acesso'}
                    </button>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* 8. RENDERIZAÇÃO CORRETA DO MODAL */}
      {isLoadingPix && !isModalOpen && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"><p className="text-white text-lg">A gerar o seu PIX, aguarde...</p></div>}
      {isModalOpen && pixData && (
        <PixModal
          pixData={pixData}
          onClose={() => setIsModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess} // Passando a função de callback
        />
      )}
      {paymentError && <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50"><p>{paymentError}</p></div>}
    </section>
  );
}