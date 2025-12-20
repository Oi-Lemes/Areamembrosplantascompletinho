"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// --- DATABASE DE PERGUNTAS (MOCK) ---
// Idealmente isso viria do backend, mas para "implementar o módulo" rápido, faremos aqui.
const QUESTIONS = [
    {
        id: 1,
        question: "Qual é o principal benefício do chá de camomila?",
        correctAnswer: 1, // Index da resposta correta
        options: [
            "Aumentar a energia e foco",
            "Promover o relaxamento e sono",
            "Curar dores musculares intensas",
            "Desintoxicar o fígado"
        ],
        explanation: "A camomila é mundialmente conhecida por suas propriedades calmantes e sedativas suaves.",
        image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=1000&auto=format&fit=crop" // Exemplo
    },
    {
        id: 2,
        question: "O que é uma tintura medicinal?",
        correctAnswer: 0,
        options: [
            "Extração de princípios ativos em álcool",
            "Um chá feito com água fervendo",
            "Uma pomada aplicada na pele",
            "Um suco de ervas frescas"
        ],
        explanation: "Tinturas são extratos concentrados feitos deixando as ervas macerarem em álcool por um período.",
        image: "https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?q=80&w=1000&auto=format&fit=crop"
    },
    {
        id: 3,
        question: "Como devem ser preparadas as cascas de frutas para uso medicinal?",
        correctAnswer: 2,
        options: [
            "Cozidas imediatamente após descascar",
            "Congeladas para matar bactérias",
            "Desidratadas ou secas corretamente",
            "Misturadas com vinagre"
        ],
        explanation: "A secagem correta preserva os princípios ativos e evita fungos, permitindo o armazenamento.",
        image: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?q=80&w=1000&auto=format&fit=crop"
    },
    {
        id: 4,
        question: "Para o que serve a 'Vela de óleo medicinal' ensinada no curso?",
        correctAnswer: 1,
        options: [
            "Apenas para iluminar o ambiente",
            "Para massagens relaxantes e hidratação",
            "Para repelir insetos",
            "Para temperar alimentos"
        ],
        explanation: "A vela derrete em uma temperatura segura e transforma-se em um óleo morno ideal para massagens terapêuticas.",
        image: "https://images.unsplash.com/photo-1602872030219-aa261c4266c7?q=80&w=1000&auto=format&fit=crop"
    },
    {
        id: 5,
        question: "Qual é a base recomendada para criar méis medicinais?",
        correctAnswer: 3,
        options: [
            "Mel industrializado com açúcar",
            "Xarope de milho",
            "Melado de cana",
            "Mel puro e cru de boa procedência"
        ],
        explanation: "O mel puro atua como conservante natural e veículo para as ervas, além de ter suas próprias propriedades curativas.",
        image: "https://images.unsplash.com/photo-1587049359509-b788047742be?q=80&w=1000&auto=format&fit=crop"
    }
];

// --- COMPONENTE DE SOM (Simples) ---
// Usaremos urls públicas curtas para ilustrar. O ideal é o usuário colocar arquivos locais.
const SOUNDS = {
    correct: "https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg", // Placeholder divertido
    wrong: "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg", // Placeholder divertido
    win: "https://actions.google.com/sounds/v1/crowds/crowd_cheer.ogg"
};

export default function QuizPage() {
    const router = useRouter();

    // Game State
    const [started, setStarted] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false); // Mostra o resultado da pergunta atual
    const [isCorrect, setIsCorrect] = useState(false); // Se acertou a atual
    const [gameFinished, setGameFinished] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    // Audio Refs
    const correctAudio = useRef<HTMLAudioElement | null>(null);
    const wrongAudio = useRef<HTMLAudioElement | null>(null);
    const winAudio = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Inicializar áudios
        correctAudio.current = new Audio(SOUNDS.correct);
        wrongAudio.current = new Audio(SOUNDS.wrong);
        winAudio.current = new Audio(SOUNDS.win);
    }, []);

    const playSound = (type: 'correct' | 'wrong' | 'win') => {
        try {
            if (type === 'correct') correctAudio.current?.play();
            if (type === 'wrong') wrongAudio.current?.play();
            if (type === 'win') winAudio.current?.play();
        } catch (e) {
            console.error("Erro ao tocar som", e);
        }
    };

    const currentQuestion = QUESTIONS[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / QUESTIONS.length) * 100;

    const handleOptionClick = (index: number) => {
        if (showResult) return; // Bloqueia se já respondeu

        setSelectedOption(index);
        const correct = index === currentQuestion.correctAnswer;
        setIsCorrect(correct);
        setShowResult(true);

        if (correct) {
            setScore(s => s + 1);
            playSound('correct');
        } else {
            playSound('wrong');
        }
    };

    const handleNext = () => {
        setShowResult(false);
        setSelectedOption(null);

        if (currentQuestionIndex + 1 < QUESTIONS.length) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setGameFinished(true);
            if (score > QUESTIONS.length / 2) {
                playSound('win');
            }
        }
    };

    const resetGame = () => {
        setStarted(false);
        setCurrentQuestionIndex(0);
        setScore(0);
        setGameFinished(false);
        setShowResult(false);
        setSelectedOption(null);
    };

    if (!started) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-8 animate-fade-in">
                <div className="relative w-full max-w-2xl aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-500/30">
                    <Image
                        src="/img/quiz_bg.jpg"
                        layout="fill"
                        objectFit="cover"
                        alt="Quiz Intro"
                        onError={(e) => e.currentTarget.src = 'https://images.unsplash.com/photo-1544367563-12123d8965bf?q=80&w=1000'}
                    />
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm p-8">
                        <h1 className="text-5xl md:text-7xl font-serif text-amber-400 mb-4 drop-shadow-lg">Quiz Master</h1>
                        <p className="text-xl md:text-2xl text-gray-200 font-light mb-8 max-w-md">
                            Prove que você domina os Saberes da Floresta e conquiste sua nota máxima!
                        </p>
                        <button
                            onClick={() => setStarted(true)}
                            className="px-12 py-5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xl rounded-full shadow-[0_0_30px_rgba(16,185,129,0.5)] transform hover:scale-110 transition-all duration-300"
                        >
                            INICIAR DESAFIO 🚀
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameFinished) {
        const percentage = Math.round((score / QUESTIONS.length) * 100);
        const isPass = percentage >= 70;

        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-[#1e293b] border border-[#334155] rounded-3xl p-8 md:p-12 max-w-2xl w-full text-center shadow-2xl relative overflow-hidden">
                    {isPass && <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 to-transparent pointer-events-none"></div>}

                    <h2 className="text-4xl font-serif text-white mb-2">{isPass ? "Parabéns, Mestre!" : "Continue Estudando!"}</h2>
                    <p className="text-gray-400 mb-8">Você completou o Quiz Final.</p>

                    <div className="flex justify-center mb-8">
                        <div className={`w-40 h-40 rounded-full flex items-center justify-center border-8 ${isPass ? 'border-emerald-500 text-emerald-400' : 'border-amber-500 text-amber-400'} text-5xl font-bold bg-[#0f172a] shadow-inner`}>
                            {percentage}%
                        </div>
                    </div>

                    <p className="text-xl text-white mb-8">
                        Você acertou <strong className="text-emerald-400">{score}</strong> de <strong className="text-gray-400">{QUESTIONS.length}</strong> perguntas.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={resetGame}
                            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all"
                        >
                            Tentar Novamente
                        </button>
                        <Link
                            href="/dashboard"
                            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/30"
                        >
                            Voltar ao Início
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen container mx-auto p-4 md:p-8 flex flex-col items-center">
            {/* HEADER */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-8">
                <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
                    &larr; Sair
                </button>
                <div className="flex-1 mx-8 relative h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                    <motion.div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
                <span className="text-emerald-400 font-mono font-bold">
                    {currentQuestionIndex + 1}/{QUESTIONS.length}
                </span>
            </div>

            {/* QUESTION CARD */}
            <div className="w-full max-w-4xl bg-[#1e293b] border border-[#334155] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">

                {/* IMAGE SIDE */}
                <div className="md:w-2/5 relative h-64 md:h-auto bg-gray-900 border-b md:border-b-0 md:border-r border-[#334155]">
                    <Image
                        src={currentQuestion.image}
                        alt="Question Illustration"
                        layout="fill"
                        objectFit="cover"
                        className={`transition-all duration-500 ${showResult ? (isCorrect ? 'grayscale-0' : 'grayscale sepia') : 'grayscale-0'}`}
                        onError={(e) => e.currentTarget.src = `/img/md${(currentQuestionIndex % 6) + 1}.jpg`} // Fallback local
                    />
                    {showResult && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                            <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className={`p-4 rounded-full border-4 ${isCorrect ? 'border-green-500 bg-green-500/20' : 'border-red-500 bg-red-500/20'}`}
                            >
                                <span className="text-6xl">{isCorrect ? '✅' : '❌'}</span>
                            </motion.div>
                        </div>
                    )}
                </div>

                {/* CONTENT SIDE */}
                <div className="flex-1 p-6 md:p-10 flex flex-col justify-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 leading-tight">
                        {currentQuestion.question}
                    </h2>

                    <div className="space-y-3">
                        {currentQuestion.options.map((option, idx) => {
                            // Estilo Logica
                            let btnClass = "bg-[#0f172a] hover:bg-[#334155] border-gray-700 text-gray-200";

                            if (showResult) {
                                if (idx === currentQuestion.correctAnswer) {
                                    btnClass = "bg-green-900/40 border-green-500 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.3)]";
                                } else if (idx === selectedOption) {
                                    btnClass = "bg-red-900/40 border-red-500 text-red-300 opacity-60";
                                } else {
                                    btnClass = "bg-[#0f172a] opacity-50 cursor-not-allowed";
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionClick(idx)}
                                    disabled={showResult}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 font-medium flex items-center justify-between group ${btnClass}`}
                                >
                                    <span>{option}</span>
                                    {showResult && idx === currentQuestion.correctAnswer && <span>✨</span>}
                                </button>
                            );
                        })}
                    </div>

                    <AnimatePresence>
                        {showResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl"
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">💡</span>
                                    <div>
                                        <h4 className="text-blue-400 font-bold text-sm uppercase tracking-wider mb-1">Explicação</h4>
                                        <p className="text-gray-300 text-sm leading-relaxed">{currentQuestion.explanation}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleNext}
                                    className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg transition-colors"
                                >
                                    {currentQuestionIndex + 1 === QUESTIONS.length ? 'Ver Resultado' : 'Próxima Pergunta'} &rarr;
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </div>
        </div>
    );
}
