"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// --- DATABASE DE 30 PERGUNTAS SOBRE PLANTAS MEDICINAIS (Reduced to 15) ---
const QUESTIONS = [
    {
        id: 1,
        question: "Qual é a principal função da Tintura de Camomila?",
        correctAnswer: 1,
        options: ["Energético Natural", "Calmante e Digestivo", "Cicatrizante Potente", "Repelente de Insetos"],
        explanation: "A camomila é consagrada por suas propriedades calmantes e auxiliares na digestão.",
        image: "/img/md1.jpg"
    },
    {
        id: 2,
        question: "O Quebra-Pedra é popularmente usado para tratar qual órgão?",
        correctAnswer: 2,
        options: ["Coração", "Hígado", "Rins", "Pulmão"],
        explanation: "O chá de quebra-pedra é tradicionalmente utilizado para auxiliar na eliminação de cálculos renais.",
        image: "/img/md2.jpg"
    },
    {
        id: 3,
        question: "Qual destas plantas é ideal para aliviar queimaduras leves?",
        correctAnswer: 0,
        options: ["Babosa (Aloe Vera)", "Hortelã", "Alecrim", "Pimenta"],
        explanation: "O gel da babosa tem ação refrescante e cicatrizante, ideal para queimaduras.",
        image: "/img/md3.jpg"
    },
    {
        id: 4,
        question: "O Guaco é famoso na medicina popular por atuar como:",
        correctAnswer: 1,
        options: ["Diurético", "Expectorante / Broncodilatador", "Laxante", "Estimulante"],
        explanation: "O xarope de guaco é amplamente usado para tosse e bronquite.",
        image: "/img/md4.jpg"
    },
    {
        id: 5,
        question: "Para que serve a técnica de 'Maceração'?",
        correctAnswer: 3,
        options: ["Ferver a planta", "Congelar a planta", "Queimar a planta", "Extrair ativos a frio em líquido"],
        explanation: "Maceração consiste em deixar a planta de molho (água, álcool ou óleo) para extrair seus princípios.",
        image: "/img/md5.jpg"
    },
    {
        id: 6,
        question: "Qual óleo essencial é conhecido por ser 'O Rei' dos óleos e cicatrizante universal?",
        correctAnswer: 0,
        options: ["Lavanda", "Limão", "Eucalipto", "Cravo"],
        explanation: "A Lavanda é versátil, segura e excelente cicatrizante e calmante.",
        image: "/img/md6.jpg"
    },
    {
        id: 7,
        question: "A Erva-Cidreira (Melissa) é indicada para:",
        correctAnswer: 2,
        options: ["Dor de dente", "Fortalecer ossos", "Ansiedade e Insônia", "Ganho de massa muscular"],
        explanation: "A Melissa tem forte ação no sistema nervoso, reduzindo ansiedade.",
        image: "/img/md1.jpg"
    },
    {
        id: 8,
        question: "O que caracteriza uma 'Infusão'?",
        correctAnswer: 1,
        options: ["Ferver a planta junto com a água", "Jogar água fervente sobre a planta e tampar", "Comer a folha crua", "Bater no liquidificador"],
        explanation: "Infusão é usada para partes delicadas (folhas, flores), preservando óleos voláteis.",
        image: "/img/md2.jpg"
    },
    {
        id: 9,
        question: "O Boldo é classicamente associado a melhoras em:",
        correctAnswer: 0,
        options: ["Digestão e ressaca", "Visão", "Audição", "Crescimento de cabelo"],
        explanation: "O boldo estimula a produção de bile, ajudando na digestão de gorduras.",
        image: "/img/md3.jpg"
    },
    {
        id: 10,
        question: "Qual parte da planta usamos para fazer chá de Gengibre (Decocção)?",
        correctAnswer: 3,
        options: ["Folha", "Flor", "Semente", "Rizoma (Raiz)"],
        explanation: "Por ser uma parte dura, o rizoma do gengibre precisa ser fervido (decocção).",
        image: "/img/md4.jpg"
    },
    {
        id: 11,
        question: "A Arnica é muito utilizada externamente para:",
        correctAnswer: 2,
        options: ["Azia", "Tosse", "Contusões e Dores Musculares", "Dor de garganta"],
        explanation: "Pomadas e tinturas de arnica são excelentes anti-inflamatórios locais.",
        image: "/img/md5.jpg"
    },
    {
        id: 12,
        question: "Qual destas NÃO é uma forma de uso seguro de óleos essenciais?",
        correctAnswer: 1,
        options: ["Inalação", "Ingestão pura sem orientação", "Massagem (diluído)", "Difusor"],
        explanation: "Óleos essenciais são super concentrados e a ingestão indevida pode ser tóxica.",
        image: "/img/md6.jpg"
    },
    {
        id: 13,
        question: "O Alho é considerado um poderoso:",
        correctAnswer: 0,
        options: ["Antibiótico Natural", "Calmante", "Alucinógeno", "Hidratante de pele"],
        explanation: "O alho possui alicina, com forte ação antimicrobiana.",
        image: "/img/md1.jpg"
    },
    {
        id: 14,
        question: "A Espinheira-Santa é famosa no tratamento de:",
        correctAnswer: 2,
        options: ["Pé de atleta", "Cárie", "Gastrite e Úlcera", "Dores articulares"],
        explanation: "Ela protege a mucosa gástrica e reduz a acidez estomacal.",
        image: "/img/md2.jpg"
    },
    {
        id: 15,
        question: "O que é um 'Emplastro'?",
        correctAnswer: 3,
        options: ["Um chá gelado", "Um xarope doce", "Uma pílula", "Aplicação de ervas amassadas sobre a pele"],
        explanation: "Emplastros usam a planta diretamente sobre a região afetada.",
        image: "/img/md3.jpg"
    }
];

// Fallback de URL de áudio caso o arquivo local falhe
const SOUNDS = {
    correct: "/sounds/correct.mp3",
    wrong: "/sounds/wrong.mp3",
    win: "https://actions.google.com/sounds/v1/crowds/crowd_cheer.ogg"
};

export default function QuizPage() {
    const router = useRouter();

    // States
    const [started, setStarted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [gameFinished, setGameFinished] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    // Audio Refs
    const acertoAudio = useRef<HTMLAudioElement | null>(null);
    const erroAudio = useRef<HTMLAudioElement | null>(null);

    // PERSISTENCE EFFECT
    useEffect(() => {
        // Load state
        const savedState = localStorage.getItem('quiz_state');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                // Only restore if not finished or if user wants to see result
                if (!parsed.gameFinished) {
                    setCurrentIndex(parsed.currentIndex);
                    setScore(parsed.score);
                    setStarted(true);
                }
            } catch (e) { console.error("Erro loading quiz", e); }
        }

        // Init Audio
        acertoAudio.current = new Audio(SOUNDS.correct);
        erroAudio.current = new Audio(SOUNDS.wrong);
    }, []);

    // UPDATE STORAGE (NEVER DELETE)
    useEffect(() => {
        if (started) {
            // Salva sempre, independentemente de ter terminado ou não
            localStorage.setItem('quiz_state', JSON.stringify({ currentIndex, score, gameFinished }));
        }
    }, [currentIndex, score, started, gameFinished]);

    const playSound = (type: 'correct' | 'wrong' | 'win') => {
        try {
            const audio = new Audio(SOUNDS[type]);
            audio.volume = type === 'win' ? 0.6 : 1.0;
            const playPromise = audio.play();

            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Audio playback failed:", error);
                });
            }
        } catch (e) { console.error("Audio error", e); }
    };

    const throwConfetti = () => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#34d399', '#f59e0b']
        });
    };

    const handleOptionClick = (idx: number) => {
        if (showResult) return;

        setSelectedOption(idx);
        const correct = idx === QUESTIONS[currentIndex].correctAnswer;
        setIsCorrect(correct);
        setShowResult(true);

        if (correct) {
            setScore(s => s + 1);
            playSound('correct');
            throwConfetti(); // Confete a cada acerto!
        } else {
            playSound('wrong');
        }
    };

    const finishGame = async (finalScoreValue: number) => {
        setGameFinished(true);
        // Ensure accurate final calculation
        if (finalScoreValue >= (QUESTIONS.length * 0.6)) {
            playSound('win');
            confetti({ particleCount: 500, spread: 120, startVelocity: 45 });

            // Salvar progresso no backend
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL}/aulas/concluir`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ aulaId: 999 }) // ID Mágico da 'Avaliação Final'
                    });
                }
            } catch (e) { console.error("Erro ao salvar quiz", e); }

            // REDIRECT REMOVIDO! O usuário escolhe o que fazer.

        } else {
            playSound('wrong');
        }
    };

    const nextQuestion = () => {
        setShowResult(false);
        setSelectedOption(null);
        if (currentIndex + 1 < QUESTIONS.length) {
            setCurrentIndex(curr => curr + 1);
        } else {
            finishGame(score + (isCorrect ? 1 : 0)); // Pass final score for accuracy
        }
    };

    const percentage = Math.round((score / QUESTIONS.length) * 100);
    const passed = percentage >= 60;

    // PROGRESSO INTERNO DO QUIZ: Agora começa em 0% e vai até 100%
    // A cada questão, avança uma fração.
    const progress = Math.round((currentIndex / QUESTIONS.length) * 100);

    // --- COMPONENTE CIRCULAR IGUAL AO DASHBOARD ---
    const ProgressCircle = ({ percentage }: { percentage: number }) => {
        const radius = 22; // Levemente ajustado para caber no header
        const stroke = 4;
        const normalizedRadius = radius - stroke * 2;
        const circumference = normalizedRadius * 2 * Math.PI;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        return (
            <div className="relative flex items-center justify-center" style={{ width: radius * 2, height: radius * 2 }}>
                <svg height={radius * 2} width={radius * 2} className="-rotate-90">
                    <circle
                        stroke="#ffffff20"
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
                        })()}
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset }}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        className="transition-all duration-300"
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-[10px]">
                    {Math.round(percentage)}%
                </div>
            </div>
        );
    }

    // VIEW
    if (!started) {
        return (
            <div className="min-h-screen bg-[url('/img/fundo.png')] bg-cover bg-center flex flex-col items-center justify-center p-4 relative">
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
                <div className="z-10 text-center max-w-2xl w-full animate-fade-in-up bg-black/40 p-10 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                    <h1 className="text-5xl md:text-7xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 mb-6 drop-shadow-2xl">
                        Desafio Final
                    </h1>
                    <p className="text-gray-200 text-xl font-light mb-8 max-w-lg mx-auto leading-relaxed">
                        São <strong>15 perguntas</strong>. Você precisa acertar pelo menos <strong>60%</strong> para obter sua aprovação e liberar o Certificado Oficial.
                    </p>
                    <div className="flex flex-col gap-4 items-center">
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0px 0px 20px rgba(16,185,129,0.6)" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setStarted(true)}
                            className="px-12 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-2xl rounded-full transition-all"
                        >
                            INICIAR AVALIAÇÃO 📝
                        </motion.button>

                        <button
                            onClick={() => playSound('correct')}
                            className="text-sm text-gray-400 hover:text-white underline hover:bg-white/10 px-3 py-1 rounded transition-colors"
                        >
                            Testar Som (Clique aqui) 🔊
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameFinished) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
                <div className={`absolute inset-0 opacity-20 ${passed ? 'bg-emerald-900' : 'bg-red-900'}`}></div>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-3xl bg-[#1e293b]/90 backdrop-blur-xl rounded-[2.5rem] p-10 text-center shadow-2xl border border-[#334155]"
                >
                    <h2 className="text-4xl font-bold text-white mb-2">{passed ? "APROVADO! 🎓" : "Reprovado"}</h2>
                    {passed && <p className="text-emerald-400 mb-6 font-bold">Você conquistou sua certificação!</p>}

                    {/* DOUBLE CIRCLES: ACERTOS vs ERROS */}
                    <div className="flex flex-col md:flex-row justify-center gap-12 mb-8 mt-4">
                        {/* Circle 1: Acertos (Green) */}
                        <div className="flex flex-col items-center">
                            <div className="relative w-32 h-32 mb-2">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="64" cy="64" r="56" stroke="#334155" strokeWidth="10" fill="none" />
                                    <circle cx="64" cy="64" r="56" stroke="#10b981" strokeWidth="10" fill="none" strokeDasharray="351" strokeDashoffset={351 - (351 * percentage) / 100} strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-emerald-400">{score}</span>
                                    <span className="text-[10px] text-gray-400 uppercase">Acertos</span>
                                </div>
                            </div>
                        </div>

                        {/* Circle 2: Erros (Red) */}
                        <div className="flex flex-col items-center">
                            <div className="relative w-32 h-32 mb-2">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="64" cy="64" r="56" stroke="#334155" strokeWidth="10" fill="none" />
                                    <circle cx="64" cy="64" r="56" stroke="#ef4444" strokeWidth="10" fill="none" strokeDasharray="351" strokeDashoffset={351 - (351 * (100 - percentage)) / 100} strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-red-500">{QUESTIONS.length - score}</span>
                                    <span className="text-xs text-gray-400 uppercase">Erros</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-lg text-gray-300 mb-8">
                        {passed
                            ? "Parabéns! Você demonstrou excelência nos saberes naturais. Seu certificado está pronto."
                            : `Você acertou ${percentage}%. Precisa de no mínimo 60%. Revise o material e tente novamente.`}
                    </p>

                    <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                        {/* Botão de Refazer (Com Confirmação) - Disponível sempre que terminar */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                if (confirm("Tem certeza que deseja refazer a prova? Seu progresso atual de 100% será resetado.")) {
                                    localStorage.removeItem('quiz_state');
                                    window.location.reload();
                                }
                            }}
                            className="w-full md:w-auto px-8 py-4 bg-white text-black rounded-xl font-bold transition-all shadow-lg hover:bg-gray-200"
                        >
                            Refazer Prova 🔄
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push('/dashboard')}
                            className="w-full md:w-auto px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold shadow-lg transition-all"
                        >
                            Voltar ao Dashboard 🏠
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const q = QUESTIONS[currentIndex];

    // Se q for undefined (bug de indice), fallback
    if (!q) return <div className="text-white">Carregando questão...</div>;

    return (
        <div className="min-h-screen bg-black/90 flex flex-col relative font-sans overflow-hidden">

            {/* Top Bar with Circular Progress */}
            <div className="w-full h-20 px-6 flex items-center justify-between border-b border-white/5 bg-[#0f172a]">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                        &larr; Sair
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400 uppercase tracking-widest hidden md:block">Questão {currentIndex + 1} de {QUESTIONS.length}</span>
                    <ProgressCircle percentage={progress} />
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-2 md:p-8 pt-8">

                <AnimatePresence mode='wait'>
                    <motion.div
                        key={currentIndex}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-5xl bg-transparent flex flex-col md:flex-row min-h-[50vh] md:min-h-[400px]"
                    >
                        {/* Esquerda: Imagem */}
                        <div className="hidden md:block md:w-1/3 relative overflow-hidden rounded-3xl mr-6">
                            <Image
                                src={q.image}
                                alt="Topic"
                                layout="fill"
                                objectFit="cover"
                                className="hover:scale-105 transition-transform duration-700"
                                onError={(e) => e.currentTarget.src = '/img/fundo.png'}
                            />
                            <div className="absolute top-4 left-4 z-10">
                                <span className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold tracking-widest border border-white/10">
                                    {currentIndex + 1} / {QUESTIONS.length}
                                </span>
                            </div>
                        </div>

                        {/* Mobile Image Strip */}
                        <div className="md:hidden w-full flex justify-between items-center mb-4 px-2">
                            <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-bold">
                                Questão {currentIndex + 1}
                            </span>
                        </div>

                        {/* Direita: Pergunta */}
                        <div className="flex-1 flex flex-col justify-center relative">
                            <h2 className="text-xl md:text-3xl font-bold text-white mb-6 leading-snug drop-shadow-md">
                                {q.question}
                            </h2>

                            <div className="grid grid-cols-1 gap-3">
                                {q.options.map((opt, idx) => {
                                    let statusClass = "bg-white/5 border-white/10 hover:bg-white/10 text-gray-200";
                                    let hoverEffect: any = { scale: 1.01, backgroundColor: "rgba(255,255,255,0.1)" };

                                    if (showResult) {
                                        hoverEffect = {};
                                        if (idx === q.correctAnswer) statusClass = "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold";
                                        else if (idx === selectedOption) statusClass = "bg-red-500/20 border-red-500 text-red-300";
                                        else statusClass = "opacity-30 grayscale";
                                    }

                                    return (
                                        <motion.button
                                            key={idx}
                                            whileHover={!showResult ? hoverEffect : {}}
                                            whileTap={!showResult ? { scale: 0.98 } : {}}
                                            onClick={() => handleOptionClick(idx)}
                                            disabled={showResult}
                                            className={`w-full p-4 rounded-xl border text-left text-base md:text-lg transition-all flex items-center justify-between group ${statusClass}`}
                                        >
                                            <span className="w-[90%]">{opt}</span>
                                            {showResult && idx === q.correctAnswer && <span className="text-xl">✅</span>}
                                            {showResult && idx === selectedOption && idx !== q.correctAnswer && <span className="text-xl">❌</span>}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Footer Fixo quando respondido */}
                            <AnimatePresence>
                                {showResult && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="mt-4 pt-4 border-t border-white/10"
                                    >
                                        <p className="text-gray-400 mb-3 text-sm"><strong className="text-amber-400">INFO:</strong> {q.explanation}</p>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={nextQuestion}
                                            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-lg shadow-lg transition-colors"
                                        >
                                            PRÓXIMA &rarr;
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
