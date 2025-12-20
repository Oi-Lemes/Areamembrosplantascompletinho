"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// --- DATA ---
const QUESTIONS = [
    {
        id: 1,
        question: "Qual é o principal benefício do chá de camomila?",
        correctAnswer: 1,
        options: [
            "Aumentar a energia e foco",
            "Promover o relaxamento e sono",
            "Curar dores musculares",
            "Desintoxicar o fígado"
        ],
        explanation: "A camomila possui apigenina, um antioxidante que promove sonolência e combate a insônia.",
        image: "/img/md1.jpg" // Local fallback priority
    },
    {
        id: 2,
        question: "O que é uma tintura medicinal?",
        correctAnswer: 0,
        options: [
            "Extração em álcool de cereais",
            "Chá feito com água fervendo",
            "Pomada aplicada na pele",
            "Suco de ervas frescas"
        ],
        explanation: "Tinturas usam álcool para extrair compostos que a água sozinha não consegue dissolver.",
        image: "/img/md2.jpg"
    },
    {
        id: 3,
        question: "Qual destas cascas é rica em Pectina?",
        correctAnswer: 2,
        options: [
            "Casca de Ovo",
            "Casca de Noz",
            "Casca de Laranja/Limão",
            "Casca de Batata"
        ],
        explanation: "As cascas cítricas são fontes abundantes de pectina, excelente para a digestão e colesterol.",
        image: "/img/md3.jpg"
    },
    {
        id: 4,
        question: "A 'Vela de massagem' serve principalmente para:",
        correctAnswer: 1,
        options: [
            "Iluminar ambientes escuros",
            "Hidratação e relaxamento muscular",
            "Repelir mosquitos",
            "Temperar saladas"
        ],
        explanation: "Feita com óleos vegetais, ela derrete em baixa temperatura e vira um óleo morno terapêutico.",
        image: "/img/md4.jpg"
    },
    {
        id: 5,
        question: "Qual o melhor mel para fins medicinais?",
        correctAnswer: 3,
        options: [
            "Mel de mercado (pasteurizado)",
            "Xarope de milho",
            "Melado de cana",
            "Mel cru e puro"
        ],
        explanation: "O mel cru preserva enzimas e propriedades antibacterianas que são perdidas no aquecimento.",
        image: "/img/md5.jpg"
    }
];

const SOUNDS = {
    correct: "https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg",
    wrong: "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg",
    win: "https://actions.google.com/sounds/v1/crowds/crowd_cheer.ogg"
};

export default function QuizPage() {
    const router = useRouter();

    // State
    const [started, setStarted] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [gameFinished, setGameFinished] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    // Audio
    const playSound = (type: 'correct' | 'wrong' | 'win') => {
        const audio = new Audio(SOUNDS[type]);
        audio.volume = 0.5;
        audio.play().catch(e => console.log("Audio play failed", e));
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
        } else {
            playSound('wrong');
        }

        // Auto advance delay preference? User asked for "dynamic". 
        // Usually Inlead quizzes show result then require a click or auto-advance.
        // Let's keep the "Next" button for better UX control, but make it pop.
    };

    const nextQuestion = () => {
        setShowResult(false);
        setSelectedOption(null);
        if (currentIndex + 1 < QUESTIONS.length) {
            setCurrentIndex(curr => curr + 1);
        } else {
            setGameFinished(true);
            if (score >= QUESTIONS.length / 2) playSound('win');
        }
    };

    const progress = ((currentIndex + 1) / QUESTIONS.length) * 100;

    // --- RENDERING ---

    // 1. INTRO SCREEN
    if (!started) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Background blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/20 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/20 rounded-full blur-[100px]" />
                </div>

                <div className="z-10 text-center max-w-md w-full animate-fade-in-up">
                    <div className="w-32 h-32 mx-auto bg-gradient-to-br from-emerald-400 to-teal-600 rounded-3xl rotate-3 shadow-[0_0_40px_rgba(16,185,129,0.4)] flex items-center justify-center mb-8">
                        <span className="text-6xl">🌿</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Quiz Master</h1>
                    <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                        Teste se você realmente absorveu os conhecimentos ancestrais das plantas.
                    </p>
                    <button
                        onClick={() => setStarted(true)}
                        className="w-full py-4 bg-white text-emerald-900 font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-95"
                    >
                        Começar Desafio
                    </button>
                </div>
            </div>
        );
    }

    // 2. RESULTS SCREEN
    if (gameFinished) {
        const percentage = Math.round((score / QUESTIONS.length) * 100);
        const passed = percentage >= 70;

        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-md bg-[#1e293b] rounded-[2rem] p-8 text-center shadow-2xl border border-[#334155] relative overflow-hidden"
                >
                    {passed && <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />}

                    <div className="mb-6 relative inline-block">
                        <svg className="w-40 h-40 transform -rotate-90">
                            <circle cx="80" cy="80" r="70" stroke="#334155" strokeWidth="10" fill="transparent" />
                            <motion.circle
                                cx="80" cy="80" r="70"
                                stroke={passed ? "#10b981" : "#f59e0b"}
                                strokeWidth="10"
                                fill="transparent"
                                strokeDasharray="440"
                                strokeDashoffset={440 - (440 * percentage) / 100}
                                initial={{ strokeDashoffset: 440 }}
                                animate={{ strokeDashoffset: 440 - (440 * percentage) / 100 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-4xl font-bold text-white">{percentage}%</span>
                            <span className="text-xs text-gray-400 uppercase tracking-widest">Acerto</span>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">{passed ? "Incrível!" : "Bom esforço!"}</h2>
                    <p className="text-gray-400 mb-8">
                        {passed
                            ? "Você domina os segredos da natureza."
                            : "Revise as aulas e tente novamente para masterizar."}
                    </p>

                    <div className="space-y-3">
                        <button onClick={() => window.location.reload()} className="w-full py-3 bg-[#334155] hover:bg-[#475569] text-white rounded-xl font-semibold transition-colors">
                            Tentar Novamente
                        </button>
                        <Link href="/dashboard" className="block w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95">
                            Voltar ao Início
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    // 3. QUESTION CARD (INLEAD STYLE)
    const q = QUESTIONS[currentIndex];

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 relative font-sans">

            {/* Progress Bar Top */}
            <div className="absolute top-0 left-0 w-full h-2 bg-[#1e293b]">
                <motion.div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            <div className="w-full max-w-lg mt-8">

                {/* Animated Card Switcher */}
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={currentIndex}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="bg-[#1e293b] rounded-[2rem] overflow-hidden shadow-2xl border border-[#334155] flex flex-col"
                    >
                        {/* Image Header */}
                        <div className="relative h-56 w-full bg-gray-800">
                            <Image
                                src={q.image}
                                alt="Topic"
                                layout="fill"
                                objectFit="cover"
                                className="opacity-90 hover:opacity-100 transition-opacity"
                                onError={(e) => e.currentTarget.src = '/img/fundo.png'}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b] to-transparent"></div>
                            <div className="absolute bottom-4 left-6 right-6">
                                <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md border border-emerald-500/30">
                                    Questão {currentIndex + 1}
                                </span>
                            </div>
                        </div>

                        {/* Question Body */}
                        <div className="p-6 md:p-8 pt-2">
                            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 leading-snug">
                                {q.question}
                            </h2>

                            <div className="space-y-3">
                                {q.options.map((opt, idx) => {
                                    let statusClass = "bg-[#0f172a] hover:bg-[#334155] border-[#334155]";
                                    if (showResult) {
                                        if (idx === q.correctAnswer) statusClass = "bg-emerald-900/30 border-emerald-500/50 text-emerald-400";
                                        else if (idx === selectedOption) statusClass = "bg-red-900/30 border-red-500/50 text-red-400 opacity-60";
                                        else statusClass = "opacity-40 grayscale";
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleOptionClick(idx)}
                                            disabled={showResult}
                                            className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex justify-between items-center group active:scale-[0.98] ${statusClass}`}
                                        >
                                            <span className="font-medium text-gray-200 group-hover:text-white transition-colors">{opt}</span>
                                            {showResult && idx === q.correctAnswer && <span className="text-lg">✅</span>}
                                            {showResult && idx === selectedOption && idx !== q.correctAnswer && <span className="text-lg">❌</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Explanation Footer (Reveals on Answer) */}
                        <AnimatePresence>
                            {showResult && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    className="bg-[#0f172a] border-t border-[#334155]"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className={`p-2 rounded-lg ${isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                {isCorrect ? '👏' : '💡'}
                                            </div>
                                            <div>
                                                <h4 className={`font-bold text-sm uppercase ${isCorrect ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                    {isCorrect ? 'Correto!' : 'Fique atento'}
                                                </h4>
                                                <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                                                    {q.explanation}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={nextQuestion}
                                            className="w-full py-4 bg-white text-[#0f172a] font-bold rounded-xl shadow-lg hover:shadow-2xl hover:bg-gray-100 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            {currentIndex + 1 === QUESTIONS.length ? 'Ver Resultado Final' : 'Próxima'} &rarr;
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </motion.div>
                </AnimatePresence>

            </div>
        </div>
    );
}
