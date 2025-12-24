// Caminho: frontend/src/app/(admin)/live/page.tsx
"use client";

import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { PixModal } from '@/components/PixModal';
import Image from 'next/image';

// Interface PixData (igual aos outros ficheiros)
interface PixData {
  pix_qr_code: string;
  amount_paid: number;
  expiration_date: string;
  hash: string;
}

// Detalhes do Produto "Live"
const LIVE_PRODUCT = {
  hash: 'prod_cb02db3516be7ede', // Hash do PHP
  amount: 6700,                 // Valor em centavos do PHP
  title: 'Dra Maria Silva'     // Título do PHP
};

export default function LivePage() {
  const { user, loading: userLoading, refetchUser } = useUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [isLoadingPix, setIsLoadingPix] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const handleOpenPixModal = async () => {
    if (!user) {
      alert("Utilizador não autenticado.");
      return;
    }
    setIsLoadingPix(true);
    setPaymentError('');
    const token = localStorage.getItem('token');

    const paymentPayload = {
      productHash: LIVE_PRODUCT.hash,
      baseAmount: LIVE_PRODUCT.amount,
      productTitle: LIVE_PRODUCT.title,
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

  const handlePaymentSuccess = () => {
    setIsModalOpen(false);
    refetchUser(); // Atualiza os dados do usuário (buscará o `hasLiveAccess`)
    alert('Pagamento confirmado! Seu acesso à Live foi liberado.');
  };

  // ----- Renderização -----

  if (userLoading) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>;
  }

  // Função para calcular a próxima data da live (Ex: Toda Quinta às 20h)
  const getNextLiveDate = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Dom, 1 = Seg, ..., 4 = Qui
    const hour = now.getHours();

    // Configuração: Quinta-feira (4) às 20h
    const liveDay = 4;
    const liveHour = 20;

    const nextLive = new Date(now);

    // Se hoje for Quinta e já passou das 18h (buffer de 2h antes), ou se já passou de Quinta
    if (dayOfWeek > liveDay || (dayOfWeek === liveDay && hour >= 18)) {
      // Próxima semana
      nextLive.setDate(now.getDate() + (7 - dayOfWeek + liveDay));
    } else {
      // Esta semana
      nextLive.setDate(now.getDate() + (liveDay - dayOfWeek));
    }

    // Configurar horário
    nextLive.setHours(liveHour, 0, 0, 0);

    // Formatar data: "Quinta-feira, 24 de Outubro às 20:00"
    return nextLive.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const nextLiveDate = getNextLiveDate();

  // Se o usuário TEM acesso (Ultra OU comprou avulso)
  if (user?.hasLiveAccess || user?.plan === 'ultra') {
    return (
      <section className="flex flex-col items-center w-full p-4 md:p-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Encontro Semanal</h1>
          <p className="text-xl text-amber-400 font-semibold mb-2">Próxima Live: {nextLiveDate}</p>
        </div>

        <div className="flex flex-col items-center justify-center bg-gray-900/50 p-10 rounded-2xl shadow-2xl border border-gray-800 max-w-3xl w-full">
          {/* Foto Redonda do Doutor */}
          <div className="relative w-48 h-48 md:w-64 md:h-64 mb-8">
            <Image
              src="/img/dra_maria.jpg" // Foto da Doutora
              alt="Dra. Maria Silva"
              layout="fill"
              objectFit="cover"
              className="rounded-full border-4 border-amber-500 shadow-lg"
            />
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">Dra. Maria Silva</h2>
          <p className="text-gray-400 text-lg mb-6">Especialista em Fitoterapia e Medicina Natural</p>

          <div className="text-center max-w-xl text-gray-300 space-y-4">
            <p>
              Prepare-se para uma imersão profunda na ciência das plantas medicinais.
              Nesta live exclusiva para alunos, a Dra. Maria Silva traz casos clínicos reais,
              novas descobertas e responde suas dúvidas ao vivo.
            </p>
            <p className="font-semibold text-white">
              Link de acesso será liberado aqui 15 minutos antes do início.
            </p>
          </div>

          <button className="mt-8 px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full text-lg transition-transform transform hover:scale-105 shadow-amber-500/20 shadow-xl cursor-not-allowed opacity-80">
            Aguardando Início...
          </button>
        </div>
      </section>
    );
  }

  // Se o usuário NÃO tem acesso
  return (
    <section className="flex flex-col items-center justify-center h-full text-center p-4 md:p-8">
      <div className="relative w-full max-w-md h-auto mb-6">
        <Image
          src="/img/dra_maria.jpg" // Use a foto nova
          alt="Live Dra. Maria Silva"
          width={500}
          height={300} // Ajuste a altura conforme necessário
          className="rounded-lg shadow-lg"
          objectFit="cover" // Garante que a imagem cubra a área
        />
      </div>
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Live Exclusiva com Dra. Maria Silva</h1>
      <p className="text-gray-300 mb-6 max-w-lg">
        Garanta seu acesso a este encontro único para aprofundar seus conhecimentos em fitoterapia diretamente com um especialista.
      </p>
      <div className="bg-gray-800 p-6 rounded-lg shadow-md max-w-sm w-full">
        <p className="text-lg mb-1 text-gray-300">Acesso único por apenas</p>
        <p className="text-4xl font-bold text-blue-400 mb-6">
          {(LIVE_PRODUCT.amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
        <button
          onClick={handleOpenPixModal}
          disabled={isLoadingPix}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          {isLoadingPix ? 'Gerando PIX...' : 'Liberar Acesso com PIX'}
        </button>
        {paymentError && <p className="text-red-500 text-sm mt-4">{paymentError}</p>}
      </div>

      {/* Renderização do Modal */}
      {isModalOpen && pixData && (
        <PixModal
          pixData={pixData}
          onClose={() => setIsModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </section>
  );
}