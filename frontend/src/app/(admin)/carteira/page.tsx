// Caminho: frontend/src/app/(admin)/carteira/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { PixModal } from '@/components/PixModal';
import { useRouter } from 'next/navigation'; // --- ALTERAÇÃO 1: Importar o useRouter

// Interface PixData
interface PixData {
  pix_qr_code: string;
  amount_paid: number;
  expiration_date: string;
  hash: string;
}

// Mapeamento FINAL dos Produtos e Preços
const PRODUCTS = {
  walletAccess: {
    hash: 'prod_375f8ceb7a4cffcc',
    amount: 2700,
    title: 'Taxa de Emissão da Carteira ABRATH'
  },
  pac: {
    hash: 'prod_3aeba29f077583c1',
    amount: 990,
    title: 'Frete PAC'
  },
  express: {
    hash: 'prod_3aeba29f077583c1',
    amount: 1490,
    title: 'Frete Express'
  }
};


export default function CarteiraPage() {
  const { user, loading: userLoading, refetchUser } = useUser();
  const router = useRouter(); // --- ALTERAÇÃO 2: Inicializar o useRouter

  const [cep, setCep] = useState('');
  const [address, setAddress] = useState({ street: '', number: '', neighborhood: '', city: '', state: '' });
  const [recipientName, setRecipientName] = useState('');
  const [shippingMethod, setShippingMethod] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [isLoadingPix, setIsLoadingPix] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [productBeingPaid, setProductBeingPaid] = useState<'walletAccess' | 'pac' | 'express' | null>(null);


  // --- ALTERAÇÃO 3: Estado de Sucesso no Frete ---
  const [isShippingSuccess, setIsShippingSuccess] = useState(false);

  // Removido o useEffect de redirecionamento automático (o usuário pediu botão)

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawCep = e.target.value;
    const newCep = rawCep.replace(/\D/g, '');
    setCep(newCep);

    if (newCep.length < 8) {
      if (newCep.length === 0) setAddress({ street: '', number: '', neighborhood: '', city: '', state: '' });
      return;
    }

    setLoadingCep(true);
    setError('');

    try {
      const response = await fetch(`/api/cep?cep=${newCep}`);
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error('CEP não encontrado.');
      }

      setAddress({
        street: data.street || '',
        number: '',
        neighborhood: data.neighborhood || '',
        city: data.city || '',
        state: data.state || ''
      });

    } catch (err: any) {
      console.warn("Falha ao buscar CEP automatico", err);
      setError('CEP não encontrado automaticamente. Digite o endereço abaixo.');
    } finally {
      setLoadingCep(false);
    }
  };

  const handleOpenPixModal = async (productKey: keyof typeof PRODUCTS) => {
    const product = PRODUCTS[productKey];
    if (!user || !product) {
      alert("Utilizador não autenticado ou produto inválido.");
      return;
    }
    setIsLoadingPix(true);
    setPaymentError('');
    setProductBeingPaid(productKey);
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
      if (!response.ok) {
        console.error("Erro ao gerar PIX:", result);
        throw new Error(result.error || `Falha ao gerar o PIX (${response.status})`);
      }

      setPixData({
        pix_qr_code: result.pix.pix_qr_code,
        amount_paid: result.amount_paid,
        expiration_date: result.pix.expiration_date,
        hash: result.hash
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error(error);
      setPaymentError(error instanceof Error ? error.message : "Ocorreu um erro desconhecido ao gerar o PIX.");
      setProductBeingPaid(null);
    } finally {
      setIsLoadingPix(false);
    }
  };

  // Callback de sucesso do Modal
  const handlePaymentSuccess = () => {
    setIsModalOpen(false);
    refetchUser();

    // Se pagou frete ou é ultra (não paga taxa), mostra tela final
    if (productBeingPaid === 'pac' || productBeingPaid === 'express') {
      setIsShippingSuccess(true);
    }

    setProductBeingPaid(null);
  };

  const handleSubmitShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingMethod) {
      alert('Por favor, selecione uma opção de entrega.');
      return;
    }
    if (!cep || !address.street || !address.number || !address.neighborhood || !address.city || !address.state || !recipientName) {
      alert('Por favor, preencha todos os dados de entrega.');
      return;
    }

    const productKey = shippingMethod === 'pac' ? 'pac' : 'express';
    handleOpenPixModal(productKey);
  };

  // ----- Renderização -----

  if (userLoading) {
    return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div></div>;
  }

  // NOVA Tela de Sucesso Final (Substitui o antigo "Caso 1")
  if (isShippingSuccess) {
    return (
      <section className="flex flex-col items-center w-full p-8 text-center animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Parabéns 🎉</h1>
        <p className="text-gray-300 text-lg md:text-xl max-w-2xl mb-8">
          Seu cartão chegará em até 15 dias úteis.<br />
          Mais informações chegarão via e-mail.<br />
          <strong>Obrigado.</strong>
        </p>

        <button
          onClick={() => router.push('/dashboard')}
          className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-lg transition-transform hover:scale-105 shadow-lg"
        >
          Voltar para o Dashboard
        </button>
      </section>
    );
  }

  // Caso 2: Usuário NÃO tem acesso E NÃO é Ultra E NÃO é Premium -> Precisa pagar a taxa primeiro
  if (!user?.hasWalletAccess && user?.plan !== 'ultra' && user?.plan !== 'premium') {
    return (
      <section className="flex flex-col items-center w-full p-8 text-center">
        <h1 className="text-4xl font-bold text-white">Adquira a sua Carteira ABRATH</h1>
        <p className="text-gray-300 mt-4 max-w-2xl">
          Para solicitar a emissão da sua carteira nacional, primeiro é necessário pagar a taxa de emissão.
        </p>
        <button
          onClick={() => handleOpenPixModal('walletAccess')} // Paga a taxa
          disabled={isLoadingPix}
          className="mt-8 px-8 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          {isLoadingPix && productBeingPaid === 'walletAccess' ? 'A gerar PIX...' : `Pagar Taxa de Emissão (${(PRODUCTS.walletAccess.amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`}
        </button>
        {paymentError && <p className="text-red-500 text-sm mt-2">{paymentError}</p>}

        {/* Modal PIX */}
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

  // Caso 3: Usuário é Ultra, Premium OU pagou a taxa (hasWalletAccess=true), mas ainda não pagou frete
  // Mostra o formulário de endereço e frete.
  if (user?.plan === 'ultra' || user?.plan === 'premium' || (user?.hasWalletAccess && !userLoading)) {
    return (
      <section className="flex flex-col items-center w-full p-4 md:p-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">Emissão de Carteira Nacional ABRATH</h1>
          <p className="text-gray-300 mt-2 max-w-2xl mx-auto">
            {user.plan === 'ultra' ? 'Como membro Ultra, a taxa de emissão é por nossa conta!' : (user.plan === 'premium' ? 'Membros Premium têm isenção da taxa de emissão.' : 'Taxa de emissão paga!')}
            Agora, preencha os seus dados de entrega e pague apenas o frete para receber a sua carteira.
          </p>
        </div>

        <div className="w-full max-w-2xl bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg">
          <form onSubmit={handleSubmitShipping}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="recipientName" className="block text-sm font-medium text-gray-300 mb-2">Nome Completo do Destinatário</label>
                <input type="text" id="recipientName" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="cep" className="block text-sm font-medium text-gray-300 mb-2">CEP</label>
                <input type="text" id="cep" value={cep} onChange={handleCepChange} maxLength={8} required placeholder="Apenas números" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500" />
                {loadingCep && <p className="text-sm text-blue-400 mt-1">Buscando CEP...</p>}
                {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
              </div>
              <div>
                <label htmlFor="street" className="block text-sm font-medium text-gray-300 mb-2">Rua / Logradouro</label>
                <input type="text" id="street" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} placeholder="Rua, Avenida..." required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="number" className="block text-sm font-medium text-gray-300 mb-2">Número / Complemento</label>
                <input type="text" id="number" value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} required placeholder="Ex: 123, Apto 4B" className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-300 mb-2">Bairro</label>
                <input type="text" id="neighborhood" value={address.neighborhood} onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })} placeholder="Bairro" required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">Cidade</label>
                <input type="text" id="city" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="Cidade" required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-300 mb-2">Estado (UF)</label>
                <input type="text" id="state" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase() })} placeholder="UF" required maxLength={2} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white uppercase focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-white mb-4">Escolha o Frete</h3>
              <div className="space-y-4">
                <label className={`flex items-center p-4 rounded-md cursor-pointer transition-colors ${shippingMethod === 'pac' ? 'bg-blue-900 border-2 border-blue-500' : 'bg-gray-700 border border-gray-600 hover:bg-gray-600'}`}>
                  <input type="radio" name="shipping" value="pac" checked={shippingMethod === 'pac'} onChange={(e) => setShippingMethod(e.target.value)} className="form-radio h-5 w-5 text-blue-600 focus:ring-blue-500" />
                  <div className="ml-4 flex justify-between w-full items-center">
                    <div>
                      <span className="block font-bold text-white">PAC</span>
                      <span className="block text-sm text-gray-400">Entrega em 11 a 14 dias úteis</span>
                    </div>
                    <span className="font-bold text-lg text-white">{(PRODUCTS.pac.amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                </label>
                <label className={`flex items-center p-4 rounded-md cursor-pointer transition-colors ${shippingMethod === 'express' ? 'bg-blue-900 border-2 border-blue-500' : 'bg-gray-700 border border-gray-600 hover:bg-gray-600'}`}>
                  <input type="radio" name="shipping" value="express" checked={shippingMethod === 'express'} onChange={(e) => setShippingMethod(e.target.value)} className="form-radio h-5 w-5 text-blue-600 focus:ring-blue-500" />
                  <div className="ml-4 flex justify-between w-full items-center">
                    <div>
                      <span className="block font-bold text-white">Express (Recomendado)</span>
                      <span className="block text-sm text-gray-400">Entrega em 4 a 8 dias úteis</span>
                    </div>
                    <span className="font-bold text-lg text-white">{(PRODUCTS.express.amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button type="submit" disabled={isLoadingPix || !shippingMethod} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                {isLoadingPix && (productBeingPaid === 'pac' || productBeingPaid === 'express') ? 'A gerar PIX...' : 'Pagar Frete com PIX'}
              </button>
              {paymentError && <p className="text-red-500 text-sm mt-2">{paymentError}</p>}
            </div>
          </form>
        </div>

        {/* Modal PIX */}
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

  // Fallback
  return <div>Ocorreu um erro ao carregar a página. Tente novamente.</div>;
}