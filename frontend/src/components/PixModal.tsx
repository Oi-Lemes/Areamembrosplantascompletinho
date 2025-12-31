import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface PixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  pixData: {
    hash?: string;
    pix_qr_code: string | null;
    expiration_date?: string | null;
    amount_paid?: number;
    status?: string;
    message?: string;
  } | null;
}

export function PixModal({ isOpen, onClose, onPaymentSuccess, pixData }: PixModalProps) {
  const [copyButtonText, setCopyButtonText] = useState('Copiar código PIX');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate QR Code Image
  useEffect(() => {
    if (pixData?.pix_qr_code) {
      QRCode.toDataURL(pixData.pix_qr_code, {
        width: 184,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => {
          setQrCodeUrl(url);
        })
        .catch((err) => {
          console.error("Erro ao gerar QR Code:", err);
        });
    }
  }, [pixData]);

  // Polling for Payment Status
  useEffect(() => {
    const checkStatus = async () => {
      if (!pixData?.hash) return;

      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const url = `${apiUrl}/verificar-status-paradise/${pixData.hash}?_=${Date.now()}`;

        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          // Checks for both status (standard) and payment_status (webhook/gateway)
          if (data.status === 'paid' || data.payment_status === 'paid' || data.status === 'approved') {
            if (intervalRef.current) clearInterval(intervalRef.current);
            onPaymentSuccess();
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    };

    if (isOpen && pixData?.hash) {
      // Immediate check
      checkStatus();
      // Polling every 3 seconds
      intervalRef.current = setInterval(checkStatus, 3000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, pixData, onPaymentSuccess]);

  const handleCopyPix = () => {
    if (pixData?.pix_qr_code) {
      navigator.clipboard.writeText(pixData.pix_qr_code);
      setCopyButtonText('Copiado!');
      setTimeout(() => setCopyButtonText('Copiar código PIX'), 2000);
    }
  };

  if (!isOpen || !pixData) return null;

  // Compliance / Analysis State
  const isAnalysis = pixData.status === 'analysis' || !pixData.pix_qr_code;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative text-center font-sans">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header Section */}
        <div className="mb-4">
          <span className={`inline-block p-3 rounded-full mb-2 ${isAnalysis ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
            {isAnalysis ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </span>

          <h3 className="text-xl font-bold text-gray-900">
            {isAnalysis ? 'Pagamento em Análise' : 'Pagamento Gerado!'}
          </h3>

          {!isAnalysis && (
            <>
              <p className="text-xs text-gray-500 mt-1">
                Expira em: <span className="font-mono text-gray-700">
                  {pixData.expiration_date ? new Date(pixData.expiration_date).toLocaleTimeString() : '--:--'}
                </span>
              </p>
              <p className="mt-2 text-lg font-bold text-gray-800">
                {pixData.amount_paid
                  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pixData.amount_paid / 100)
                  : 'R$ --,--'}
              </p>
            </>
          )}

          {isAnalysis && (
            <p className="text-sm text-gray-600 mt-2 px-4">
              {pixData.message || 'Sua transação está sendo analisada por segurança. Você será notificado em breve.'}
            </p>
          )}
        </div>

        {/* QR Code Section */}
        {!isAnalysis && (
          <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-200 mb-4 flex justify-center">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code PIX" className="opacity-90 mix-blend-multiply" />
            ) : (
              <div className="h-40 w-40 flex items-center justify-center text-gray-400 text-xs">Gerando QR...</div>
            )}
          </div>
        )}

        {/* Copy Paste Section */}
        {!isAnalysis && (
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                readOnly
                value={pixData.pix_qr_code || ''}
                className="w-full pl-3 pr-10 py-3 bg-gray-100 border-none rounded-lg text-xs font-mono text-gray-600 focus:ring-0 cursor-text truncate outline-none"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                type="button"
                onClick={handleCopyPix}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            <button
              onClick={handleCopyPix}
              className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>{copyButtonText}</span>
            </button>
          </div>
        )}

        <p className="text-[10px] text-gray-400 mt-4 leading-tight">
          Ao pagar, você receberá a confirmação imediatamente neste dispositivo.
        </p>
      </div>
    </div>
  );
}