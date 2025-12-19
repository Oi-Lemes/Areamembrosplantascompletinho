
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execFileAsync = promisify(execFile);

// --- DADOS ESTÁTICOS DOS MÓDULOS (Mantidos no Código para Simplicidade) ---
// Em uma versão futura poderia ir para o banco também, mas não é o foco agora.
const MOCK_MODULOS = [
    {
        id: 1,
        nome: 'Módulo 1 – Segredos das Plantas Medicinais',
        description: 'Descubra o poder das ervas, desde a identificação até o cultivo seguro.',
        ordem: 1,
        aulas: [
            { id: 1, nome: 'Descobrindo o poder das ervas', videoUrl: 'https://descobrindo-o-poder-das--xrh9gpa.gamma.site/', ordem: 1 },
            { id: 2, nome: 'Cultive suas próprias plantas', videoUrl: 'https://seu-jardim-de-cura--dmq9aik.gamma.site/', ordem: 2 },
            { id: 3, nome: 'Ervas em chás fitoterápicos', videoUrl: 'https://fast.wistia.net/embed/iframe/qug4mwlyn6', ordem: 3 }
        ]
    },
    // ... Módulos 2 a 6 mantidos ...
    {
        id: 2, nome: 'Módulo 2 – Tinturas Mágicas', description: 'Extraia o Poder das Ervas.', ordem: 2,
        aulas: [{ id: 4, nome: 'Tinturas: o que são?', videoUrl: '#', ordem: 1 }]
    },
    {
        id: 3, nome: 'Módulo 3 – Pomadas Naturais', description: 'Pomadas para cicatrização.', ordem: 3,
        aulas: [{ id: 7, nome: 'Fazendo óleo medicinal', videoUrl: '#', ordem: 1 }]
    },
    {
        id: 4, nome: 'Módulo 4 – Cascas de Frutas', description: 'Remédios naturais com cascas.', ordem: 4,
        aulas: [{ id: 10, nome: 'Cascas que viram remédios', videoUrl: '#', ordem: 1 }]
    },
    {
        id: 5, nome: 'Módulo 5 – Cascas de Vegetais', description: 'Propriedades medicinais das cascas.', ordem: 5,
        aulas: [{ id: 13, nome: 'Propriedades medicinais', videoUrl: '#', ordem: 1 }]
    },
    {
        id: 6, nome: 'Módulo 6 – Fitoterapia Avançada', description: 'Combinações Inteligentes.', ordem: 6,
        aulas: [{ id: 16, nome: 'Como combinar ervas', videoUrl: '#', ordem: 1 }]
    },
    {
        id: 98, nome: 'Live com o Dr. José Nakamura', description: 'Um encontro exclusivo para tirar dúvidas.', aulas: []
    },
    {
        id: 100, nome: 'Emissão de Certificado', description: 'Parabéns! Emita o seu certificado.', aulas: []
    },
    {
        id: 101, nome: 'Emissão CARTEIRA NACIONAL CRTH ABRATH', description: 'Esta carteira tem sua emissão de forma anual.', aulas: []
    }
];

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'segredo-super-secreto';
const PARADISE_API_TOKEN = process.env.PARADISE_API_TOKEN;

app.use(express.json());

// Configuração do CORS
const productionUrl = 'https://www.saberesdafloresta.site';
const localUrl = 'http://localhost:3000';
app.use(cors({
    origin: [productionUrl, localUrl, 'http://localhost:3002'],
    optionsSuccessStatus: 200
}));

// --- MIDDLEWARE DE AUTH (REAL VIA JWT) ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- ROTA DE LOGIN POR TELEFONE (NOVO) ---
app.post('/auth/login-phone', async (req, res) => {
    const { phone } = req.body;

    // Remove tudo que não for números
    const cleanPhone = phone.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
        return res.status(400).json({ error: 'Número de telefone inválido.' });
    }

    try {
        // Busca usuário pelo telefone
        const user = await prisma.user.findFirst({
            where: { phone: cleanPhone }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado. Você já realizou a compra?' });
        }

        // Verifica se o plano é válido (se foi reembolsado, pode virar 'free' ou 'banned')
        if (user.plan === 'banned' || user.status === 'refunded') {
            return res.status(403).json({ error: 'Acesso revogado.' });
        }

        // Gera token JWT Real
        const token = jwt.sign({ id: user.id, name: user.name, plan: user.plan }, JWT_SECRET, { expiresIn: '30d' });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                plan: user.plan,
                hasLiveAccess: user.hasLiveAccess,
                hasWalletAccess: user.hasWalletAccess
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});


// --- WEBHOOK PARADISE PAGS (NOVO) ---
app.post('/webhook/paradise', async (req, res) => {
    const event = req.body;
    console.log('[WEBHOOK] Recebido:', JSON.stringify(event, null, 2));

    try {
        const eventType = event.event || event.status;
        const product = event.product || {};
        const incomingHash = product.hash || product.id || event.product_hash;
        const client = event.client || event.customer || {}; // Garante que client existe

        console.log(`[WEBHOOK] Evento: ${eventType} | Produto: ${incomingHash}`);

        // --- FILTRO DE PRODUTO ---
        const TARGET_PRODUCT_HASH = process.env.PARADISE_PRODUCT_HASH;
        // Só verifica se tiver hash configurado e se o evento tiver produto
        if (TARGET_PRODUCT_HASH && incomingHash && incomingHash !== TARGET_PRODUCT_HASH) {
            console.log(`[WEBHOOK] Ignorado: Produto incorreto (${incomingHash} !== ${TARGET_PRODUCT_HASH})`);
            return res.status(200).send('Ignorado: Produto diferente');
        }

        if (eventType === 'purchase.approved' || eventType === 'paid') {
            const email = client.email;
            const name = client.name;
            const phone = client.phone ? client.phone.replace(/\D/g, '') : null;
            const cpf = client.cpf || client.document;

            if (!phone) {
                console.warn('[WEBHOOK] Telefone não recebido. Ignorando criação por enquanto.');
                return res.status(200).send('OK, mas sem telefone');
            }

            // Upsert do Usuário
            const user = await prisma.user.upsert({
                where: { phone: phone },
                update: {
                    plan: 'premium',
                    status: 'active',
                    name: name,
                    email: email
                },
                create: {
                    phone: phone,
                    email: email || `${phone}@sememail.com`,
                    name: name || 'Aluno Novo',
                    plan: 'premium',
                    status: 'active',
                    cpf: cpf
                }
            });

            console.log(`[WEBHOOK] Usuário APROVADO: ${user.name} (${user.phone})`);

        } else if (eventType === 'purchase.refunded' || eventType === 'chargeback') {
            const phone = client.phone ? client.phone.replace(/\D/g, '') : null;

            if (phone) {
                await prisma.user.updateMany({
                    where: { phone: phone },
                    data: {
                        plan: 'banned',
                        status: 'refunded',
                        hasLiveAccess: false,
                        hasNinaAccess: false
                    }
                });
                console.log(`[WEBHOOK] Acesso REVOGADO para: ${phone}`);
            }
        }

        res.status(200).send('Webhook processado');

    } catch (error) {
        console.error('[WEBHOOK] Erro:', error);
        res.status(500).send('Erro no processamento');
    }
});

// --- ROTAS DO USUÁRO ---
app.get('/me', authenticateToken, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.sendStatus(404);
    res.json(user);
});

// --- ROTAS DE CONTEÚDO (MODULOS/AULAS) ---
// Usando MOCK_MODULOS estático para simplificar a migração ( conteúdo não muda muito )
// Mas o progresso será salvo no banco REAL

app.get('/modulos', authenticateToken, (req, res) => {
    res.json(MOCK_MODULOS);
});

app.get('/progresso', authenticateToken, async (req, res) => {
    // Busca progresso do banco REAL
    const progressos = await prisma.progresso.findMany({
        where: { userId: req.user.id, concluida: true },
        select: { aulaId: true }
    });
    res.json(progressos.map(p => p.aulaId));
});

app.post('/aulas/concluir', authenticateToken, async (req, res) => {
    const { aulaId } = req.body;
    const userId = req.user.id;

    const existing = await prisma.progresso.findUnique({
        where: {
            userId_aulaId: { userId, aulaId }
        }
    });

    if (existing) {
        // Toggle (desmarcar)
        await prisma.progresso.delete({
            where: { userId_aulaId: { userId, aulaId } }
        });
        res.json({ status: 'desmarcada' });
    } else {
        // Marcar
        await prisma.progresso.create({
            data: { userId, aulaId, concluida: true }
        });
        res.json({ status: 'marcada' });
    }
});

app.get('/progresso-modulos', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const progressos = await prisma.progresso.findMany({
        where: { userId, concluida: true },
        select: { aulaId: true }
    });
    const concluidasSet = new Set(progressos.map(p => p.aulaId));

    const resultado = {};
    MOCK_MODULOS.forEach(mod => {
        if (!mod.aulas || mod.aulas.length === 0) {
            resultado[mod.id] = 100;
        } else {
            const count = mod.aulas.filter(a => concluidasSet.has(a.id)).length;
            resultado[mod.id] = Math.round((count / mod.aulas.length) * 100);
        }
    });
    res.json(resultado);
});


// Inicia o servidor
app.listen(PORT, () => {
    console.log(`\n🚀 SERVIDOR REAL (PRISMA) RODANDO NA PORTA ${PORT}`);
    console.log(`💳 Webhook Paradise ativo em /webhook/paradise`);
});