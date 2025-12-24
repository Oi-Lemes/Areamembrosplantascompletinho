import { useState, useRef, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useUser } from '@/contexts/UserContext';
import { PixModal } from '@/components/PixModal';

// --- CONFIGURAÇÃO DE BASTIDORES ---
// Mude para 'false' quando quiser ativar o pagamento novamente.
const FREE_NINA_BETA = false;

// --- Interface PixData ---
interface PixData {
    pix_qr_code: string;
    amount_paid: number;
    expiration_date: string;
    hash: string;
}

// --- Ícones (Mantidos do seu código original) ---
const MicrophoneIcon = ({ isRecording }: { isRecording: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-500 dark:text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);
const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);
const ClearIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);
const ThumbsUpIcon = ({ selected }: { selected: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${selected ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.93L5.5 8m7 2H5.5" />
    </svg>
);
const ThumbsDownIcon = ({ selected }: { selected: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${selected ? 'text-red-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.738 3h4.017c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.085a2 2 0 001.736-.93l2.5-4.5M17 14h-2.5" />
    </svg>
);

// --- TIPOS (do seu código original) ---
type Message = {
    id: number;
    role: 'user' | 'assistant';
    text: string;
    feedback?: 'like' | 'dislike' | null;
};

// --- COMPONENTE PRINCIPAL ---
export default function ChatbotNina() {
    const { user, loading: userLoading, refetchUser } = useUser();

    // Estados originais
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    // --- ESTADOS DE PAGAMENTO ---
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pixData, setPixData] = useState<PixData | null>(null);
    const [isGeneratingPix, setIsGeneratingPix] = useState(false);

    // --- (Refs antigos de áudio raw removidos) ---
    const chatContainerRef = useRef<HTMLDivElement | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null); // REF PARA O PLAYER DE ÁUDIO (Mobile Fix)

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // --- FUNÇÃO DE PAGAMENTO ---
    const handleUnlockClick = async () => {
        setIsGeneratingPix(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL}/gerar-pix-paradise`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productHash: 'prod_0d6f903b6855c714',
                    baseAmount: 3700, // R$ 37,00
                    productTitle: 'Chatbot Nina',
                    checkoutUrl: window.location.href
                })
            });

            if (!response.ok) throw new Error('Erro ao gerar PIX');

            const data = await response.json();
            if (data.pix) {
                setPixData({
                    ...data.pix,
                    amount_paid: data.amount_paid,
                    hash: data.hash
                });
                setShowPaymentModal(true);
            } else {
                alert('Erro: Dados do PIX não retornados.');
            }

        } catch (error) {
            console.error("Erro ao gerar PIX:", error);
            alert('Não foi possível gerar o pagamento. Tente novamente.');
        } finally {
            setIsGeneratingPix(false);
        }
    };

    const handlePaymentSuccess = async () => {
        setShowPaymentModal(false);
        if (refetchUser) await refetchUser();
        setIsOpen(true); // Abre o chat
        alert('🎉 Nina desbloqueada com sucesso!');
    };


    // Funções originais (playAudio, handleClearChat, etc.)
    // Função auxiliar para remover Markdown do texto antes de falar
    const removeMarkdown = (text: string) => {
        return text
            .replace(/\*\*/g, '') // Remove bold
            .replace(/\*/g, '')   // Remove italic
            .replace(/`/g, '')    // Remove code ticks
            .replace(/#/g, '')    // Remove headers
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
            .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
            .trim();
    };

    const playAudio = (text: string) => {
        try {
            const cleanText = removeMarkdown(text);
            const ttsUrl = `/api/tts?text=${encodeURIComponent(cleanText)}`;

            // MOBILE FIX: Reutiliza a instância desbloqueada no clique
            if (!audioRef.current) {
                audioRef.current = new Audio();
            }

            audioRef.current.src = ttsUrl;
            // Promessa de play para capturar erros de autoplay em mobile
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Autoplay bloqueado pelo navegador (comum em mobile). O usuário precisa interagir.", error);
                    // Opcional: Adicionar um botão de "Ouvir" na mensagem se falhar
                });
            }
        } catch (error) {
            console.error("Erro fatal ao tentar reproduzir áudio:", error);
        }
    };

    const handleClearChat = () => {
        setMessages([]);
    };

    const handleFeedback = (messageId: number, feedback: 'like' | 'dislike') => {
        setMessages(messages.map(msg =>
            msg.id === messageId ? { ...msg, feedback } : msg
        ));
        console.log(`Feedback para a mensagem ${messageId}: ${feedback}`);
    };



    const handleSubmit = async (e?: FormEvent, transcribedText?: string) => {
        if (e) e.preventDefault();
        const messageText = transcribedText || input;
        if (!messageText.trim() || isLoading) return;

        const userMessage: Message = { id: Date.now(), role: 'user', text: messageText };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        // MOBILE FIX: Desbloquear Áudio Imediatamente no Clique
        if (!audioRef.current) audioRef.current = new Audio();
        // Toca um silêncio curto para "abençoar" o elemento de áudio com o gesto do usuário
        audioRef.current.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAGZGF0YQAAAAA=';
        audioRef.current.play().catch((err) => console.log("Silent unlock failed (ok if desktop)", err));

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    history: messages.map(({ role, text }) => ({ role, text })),
                    message: messageText,
                }),
            });

            if (!response.ok) throw new Error('Falha na resposta da API');

            const data = await response.json();

            // Simula o tempo da Nina "gravando o áudio" (Delay de resposta)
            await new Promise(resolve => setTimeout(resolve, 3000)); // 3 segundos de "fake recording"

            const assistantMessage: Message = {
                id: Date.now() + 1,
                role: 'assistant',
                text: data.text,
                feedback: null
            };
            setMessages([...newMessages, assistantMessage]);
            playAudio(data.text);

        } catch (error) {
            console.error("Erro ao comunicar com a API de chat:", error);
            const errorMessage: Message = { id: Date.now() + 1, role: 'assistant', text: "Desculpe, não consigo responder agora.", feedback: null };
            setMessages([...newMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // --- SPEECH RECOGNITION (Nativo do Navegador) ---
    const recognitionRef = useRef<any>(null);
    const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Efeito 1: Inicialização (Executa uma vez)
    useEffect(() => {
        // Verifica se window existe (SSR safety)
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true; // Permite pausas longas sem cortar
                recognition.interimResults = true;
                recognition.lang = 'pt-BR';

                recognition.onstart = () => setIsRecording(true);

                recognition.onend = () => {
                    setIsRecording(false);
                    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
                };

                recognition.onerror = (event: any) => {
                    console.error("Erro STT:", event.error);
                    setIsRecording(false);
                };

                recognitionRef.current = recognition;
            }
        }
    }, []);

    // Efeito 2: Atualização do Handler (Executa quando handleSubmit muda)
    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.onresult = (event: any) => {
                // Limpa timer anterior a cada palavra detectada
                if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

                let fullTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    fullTranscript += event.results[i][0].transcript;
                }

                // Atualiza o input visualmente (append para continuous)
                // Nota: com continuous=true, event.results acumula ou reseta dependendo do browser,
                // mas geralmente queremos pegar tudo. O 'input' state pode conflitar se não formos cuidadosos.
                // Simplificação: Pegamos o transcript atual da sessão.

                // Melhor abordagem para continuous: reconstruir tudo ou usar a última parte?
                // Vamos usar a estratégia de substituir o input pelo que está sendo ouvido agora.
                // Mas para não apagar o que já foi digitado antes, precisaríamos de lógica complexa.
                // Assumindo que o usuário usa voz OU texto:

                // Reconstruir transcript total da sessão atual
                const currentTranscript = Array.from(event.results)
                    .map((result: any) => result[0].transcript)
                    .join('');

                setInput(currentTranscript);

                // Configura novo timer de 8 segundos (Delay solicitado)
                silenceTimeoutRef.current = setTimeout(() => {
                    console.log("Tempo de silêncio (8s) atingido. Enviando...");
                    recognitionRef.current.stop(); // Para de ouvir
                    handleSubmit(undefined, currentTranscript); // Envia
                }, 8000);
            };
        }
    }, [handleSubmit]);

    const handleToggleRecording = () => {
        if (!recognitionRef.current) {
            alert('Navegador sem suporte a voz. Tente Chrome/Edge.');
            return;
        }
        if (isRecording) {
            recognitionRef.current.stop();
            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        } else {
            setInput('');
            recognitionRef.current.start();
        }
    };

    // --- BUTTON CLICK LOGIC (PAYWALL) ---
    const handleButtonClick = () => {
        // LÓGICA DE ACESSO:
        // Se estiver em modo BETA (Grátis) OU Usuário tiver plano superior/acesso
        // Abre o chat direto. Caso contrário, pede PIX.

        const hasAccess = FREE_NINA_BETA || user?.plan !== 'basic';

        if (hasAccess) {
            setIsOpen(prev => !prev);
        } else {
            handleUnlockClick();
        }
    };

    return (
        <>
            {/* Botão Flutuante Moderno - AGORA VISÍVEL PARA TODOS */}
            <div className="fixed bottom-6 right-6 z-50 group">
                {/* Efeito de "Sonar" (Pulse Ring) */}
                <span className="absolute -inset-1 rounded-full bg-emerald-500 opacity-75 animate-ping duration-1000 group-hover:animation-none"></span>

                <button
                    onClick={handleButtonClick}
                    disabled={isGeneratingPix}
                    className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full shadow-2xl transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-12 outline-none ring-4 ring-emerald-500/30 disabled:opacity-70 disabled:grayscale"
                >
                    {isGeneratingPix ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    ) : (
                        // Foto da Nina (Mais pessoal e direto)
                        <div className="relative w-full h-full p-1">
                            <img
                                src="/avatar-nina.png"
                                alt="Chat com a Nina"
                                className="w-full h-full rounded-full object-cover border-2 border-white/50"
                            />
                            {/* Cadeado se for Básico E NÃO FOR BETA GRÁTIS */}
                            {!FREE_NINA_BETA && user?.plan === 'basic' && (
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Badge de Notification (Opcional, para dar charme) */}
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                        // Ajuste Mobile: h-[80dvh] para evitar problemas com barra de endereço
                        className="fixed bottom-0 right-0 h-[80dvh] w-full bg-white/80 backdrop-blur-lg dark:bg-gray-800/80 shadow-2xl flex flex-col z-50 md:bottom-20 md:right-4 md:w-96 md:h-[600px] md:rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                        <div className="bg-gray-50 dark:bg-gray-900/70 p-4 flex items-center rounded-t-xl flex-shrink-0 border-b border-gray-200 dark:border-gray-800">
                            <img src="/avatar-nina.png" alt="Nina" className="w-10 h-10 rounded-full mr-3" />
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-white">Nina, a sua Herbalista</h3>
                                <p className="text-xs text-green-500 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>Online</p>
                            </div>
                            <div className="ml-auto flex items-center space-x-2">
                                <button onClick={handleClearChat} title="Limpar conversa" className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><ClearIcon /></button>
                                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl leading-none">&times;</button>
                            </div>
                        </div>

                        {/* --- LÓGICA DE RENDERIZAÇÃO SIMPLIFICADA --- */}
                        {userLoading ? (
                            <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div></div>
                        ) : (
                            <>
                                {/* Interface do Chat (Agora sempre visível) */}
                                <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto">
                                    {messages.length === 0 && (
                                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 space-y-4">
                                            <p>Olá! Sou a Nina. Como posso te ajudar hoje?</p>
                                            <div className="flex flex-col items-center space-y-2">
                                                <button onClick={() => handleSubmit(undefined, "Qual o conteúdo do Módulo 1?")} className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Qual o conteúdo do Módulo 1?</button>
                                                <button onClick={() => handleSubmit(undefined, "Como faço para emitir meu certificado?")} className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Como emito meu certificado?</button>
                                                <button onClick={() => handleSubmit(undefined, "Para que serve a erva cidreira?")} className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Para que serve a erva cidreira?</button>
                                            </div>
                                        </div>
                                    )}
                                    {messages.map((msg) => (
                                        <motion.div key={msg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                                                <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{msg.text}</ReactMarkdown></div>
                                            </div>
                                            {msg.role === 'assistant' && (
                                                <div className="mt-1.5 flex items-center space-x-2">
                                                    <button onClick={() => handleFeedback(msg.id, 'like')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"><ThumbsUpIcon selected={msg.feedback === 'like'} /></button>
                                                    <button onClick={() => handleFeedback(msg.id, 'dislike')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"><ThumbsDownIcon selected={msg.feedback === 'dislike'} /></button>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                    {isLoading && (
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                                            <div className="flex items-end space-x-2">
                                                {/* Foto da Nina Pulseando (Simulando gravação) */}
                                                <div className="relative">
                                                    <img src="/avatar-nina.png" alt="Nina Gravando" className="w-8 h-8 rounded-full border-2 border-green-500 z-10 relative" />
                                                    <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                                    </span>
                                                </div>
                                                <div className="p-3 rounded-2xl bg-gray-200 dark:bg-gray-700 rounded-bl-none flex items-center space-x-2 text-gray-500 dark:text-gray-300">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="text-sm font-medium animate-pulse">Gravando áudio...</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                                <form onSubmit={handleSubmit} className="p-3 bg-gray-50 dark:bg-gray-900/70 flex items-center rounded-b-xl border-t border-gray-200 dark:border-gray-800">
                                    <button type="button" onClick={handleToggleRecording} disabled={isLoading} className={`mr-2 p-2 rounded-full transition-colors ${isRecording ? 'bg-red-100 dark:bg-red-900/30' : 'hover:bg-gray-200 dark:hover:bg-gray-600'} disabled:opacity-50`}><MicrophoneIcon isRecording={isRecording} /></button>
                                    <input type="text" value={input} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e); }} onChange={(e) => setInput(e.target.value)} placeholder={isRecording ? "Ouvindo... (Pare de falar para enviar)" : "Digite a sua dúvida..."} disabled={isLoading || isRecording} className={`w-full px-4 py-2 text-gray-800 dark:text-white bg-white dark:bg-gray-800 border ${isRecording ? 'border-red-400 dark:border-red-500 animate-pulse' : 'border-gray-300 dark:border-gray-600'} rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                                    <button type="submit" disabled={!input.trim() || isLoading || isRecording} className="ml-2 p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-gray-500 transition-colors"><SendIcon /></button>
                                </form>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- RENDERIZAÇÃO DO MODAL PIX --- */}
            {showPaymentModal && pixData && (
                <PixModal
                    pixData={pixData}
                    onClose={() => setShowPaymentModal(false)}
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}
        </>
    );
}