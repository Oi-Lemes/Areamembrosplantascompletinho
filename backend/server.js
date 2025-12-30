
import 'dotenv/config';
// Force Redeploy: 2025-12-30T14:40:00
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
import PDFDocument from 'pdfkit'; // NEW: PDF Library for Certificates
import multer from 'multer'; // Upload de Imagens
import sharp from 'sharp'; // NEW: Image Processing

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execFileAsync = promisify(execFile);

// --- CONFIGURAÇÃO DE UPLOAD (MULTER - MEMÓRIA) ---
// Usamos memória para transformar em Base64 e salvar no banco (Persistência no Render)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas!'));
        }
    }
});

// --- DADOS ESTÁTICOS DOS MÓDULOS ---
const MOCK_MODULOS = [
    {
        id: 1,
        nome: 'Módulo 1 – Segredos das Plantas Medicinais',
        description: 'Descubra o poder das ervas, desde a identificação até o cultivo seguro.',
        ordem: 1,
        aulas: [
            { id: 1, nome: 'Descobrindo o poder das ervas: identifique e conheça suas propriedades', videoUrl: 'https://descobrindo-o-poder-das--xrh9gpa.gamma.site/', ordem: 1 },
            { id: 2, nome: 'Cultive e preserve suas próprias plantas medicinais em casa', videoUrl: 'https://seu-jardim-de-cura--dmq9aik.gamma.site/', ordem: 2 },
            { id: 3, nome: 'Ervas em chás fitoterápicos', videoUrl: 'https://fast.wistia.net/embed/iframe/qug4mwlyn6?web_component=true&seo=true', ordem: 3 }
        ]
    },
    {
        id: 2,
        nome: 'Módulo 2 – Tinturas Mágicas: Extraia o Poder das Ervas',
        description: 'Aprenda a criar tinturas potentes para o seu bem-estar diário.',
        ordem: 2,
        aulas: [
            { id: 4, nome: 'Tinturas: o que são e por que transformar suas ervas', videoUrl: 'https://tinturas-a-arte-de-extra-8kot30h.gamma.site/', ordem: 1 },
            { id: 5, nome: 'Passo a passo: Tintura de ervas medicinais', videoUrl: 'https://fast.wistia.net/embed/iframe/78xlx6fjop?web_component=true&seo=true', ordem: 2 },
            { id: 6, nome: 'Receitas poderosas de tinturas para o dia a dia', videoUrl: 'https://minha-farmacia-natural-5h7ustr.gamma.site/', ordem: 3 }
        ]
    },
    {
        id: 3,
        nome: 'Módulo 3 – Pomadas Naturais que Curam',
        description: 'Transforme ingredientes naturais em pomadas para cicatrização e relaxamento.',
        ordem: 3,
        aulas: [
            { id: 7, nome: 'Fazendo óleo medicinal com ervas', videoUrl: 'https://fast.wistia.net/embed/iframe/c2g2o918i7?web_component=true&seo=true', ordem: 1 },
            { id: 8, nome: 'Extraindo propriedades medicinais para aplicação direta', videoUrl: 'https://o-toque-que-cura-yh9llta.gamma.site/', ordem: 2 },
            { id: 9, nome: 'Pomadas práticas: Vela de óleo medicinal', videoUrl: 'https://fast.wistia.net/embed/iframe/ye7c3ffs9p?web_component=true&seo=true', ordem: 3 }
        ]
    },
    {
        id: 4,
        nome: 'Módulo 4 – Cascas de Frutas: Tesouros Desperdiçados',
        description: 'Aprenda a transformar cascas de frutas em poderosos remédios naturais.',
        ordem: 4,
        aulas: [
            { id: 10, nome: 'Descubra quais cascas podem virar remédios naturais', videoUrl: 'https://o-tesouro-na-casca-md753ks.gamma.site/', ordem: 1 },
            { id: 11, nome: 'Como secar, conservar e armazenar para uso fitoterápico', videoUrl: 'https://guia-completo-de-secagem-kl9b6o8.gamma.site/', ordem: 2 },
            { id: 12, nome: 'Transforme cascas em infusões e xaropes que curam', videoUrl: 'https://fast.wistia.net/embed/iframe/e5n4d46exq?web_component=true&seo=true', ordem: 3 }
        ]
    },
    {
        id: 5,
        nome: 'Módulo 5 – Cascas de Vegetais: Poder Oculto',
        description: 'Desvende as propriedades medicinais das cascas que você joga fora.',
        ordem: 5,
        aulas: [
            { id: 13, nome: 'Propriedades medicinais das cascas que você joga fora', videoUrl: 'https://a-farmacia-que-voce-joga-acg4bcc.gamma.site/', ordem: 1 },
            { id: 14, nome: 'Técnicas de desidratação e preparo eficazes', videoUrl: 'https://a-arte-de-preservar-a-na-t9omvpg.gamma.site/', ordem: 2 },
            { id: 15, nome: 'Receitas de tinturas e xaropes que potencializam a saúde', videoUrl: 'https://elixires-da-natureza-4q0ooaf.gamma.site/', ordem: 3 }
        ]
    },
    {
        id: 6,
        nome: 'Módulo 6 – Fitoterapia Avançada: Combinações Inteligentes',
        description: 'Crie suas próprias fórmulas personalizadas para resultados máximos.',
        ordem: 6,
        aulas: [
            { id: 16, nome: 'Como combinar ervas: Cataplasma com erva medicinal', videoUrl: 'https://fast.wistia.net/embed/iframe/kju2fcxklc?web_component=true&seo=true', ordem: 1 },
            { id: 17, nome: 'Crie suas próprias receitas: Méis de ervas medicinais', videoUrl: 'https://fast.wistia.net/embed/iframe/edzc1q22uv?web_component=true&seo=true', ordem: 2 },
            { id: 18, nome: 'Dosagem, preservação e cuidados para resultados duradouros', videoUrl: 'https://a-medida-da-natureza-aura6ot.gamma.site/', ordem: 3 }
        ]
    },
    {
        id: 102,
        nome: 'Quiz de Conhecimento',
        description: 'Teste seus conhecimentos e ganhe recompensas!',
        ordem: 7,
        capa: '/img/modulo_quiz.png',
        aulas: [
            { id: 999, nome: 'Avaliação Final', videoUrl: '', ordem: 1 }
        ]
    },
    {
        id: 100, nome: 'Emissão de Certificado', description: 'Parabéns! Emita o seu certificado.', ordem: 8, aulas: []
    },
    {
        id: 101, nome: 'Emissão CARTEIRA NACIONAL CRTH ABRATH', description: 'Esta carteira tem sua emissão de forma anual.', ordem: 9, aulas: []
    },
    {
        id: 98, nome: 'Live com o Dr. José Nakamura', description: 'Um encontro exclusivo para tirar dúvidas.', ordem: 10, aulas: []
    }
];

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'segredo-super-secreto';
const PARADISE_API_TOKEN = process.env.PARADISE_API_TOKEN;
console.log('🔑 PARADISE TOKEN (Início):', PARADISE_API_TOKEN ? PARADISE_API_TOKEN.substring(0, 10) + '...' : 'MISSING');


app.use(express.json());

// --- SERVIR ARQUIVOS ESTÁTICOS (UPLOADS) ---
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
app.use('/uploads', express.static(uploadsPath));

const allowedOrigins = [
    'https://www.saberesdafloresta.site',
    'http://localhost:3000',
    'http://localhost:3002',
    'https://areamembrosplantascompletinho-9n1c.vercel.app',
    'https://areademembros.saberesdafloresta.site',
    'https://www.areademembros.saberesdafloresta.site'
];

if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (process.env.FRONTEND_URL === '*') return callback(null, true);

        // Permite localhost, vercel e o domínio principal (e subdomínios)
        const isAllowed = allowedOrigins.indexOf(origin) !== -1 ||
            origin.endsWith('.vercel.app') ||
            origin.includes('saberesdafloresta.site');

        if (isAllowed) {
            callback(null, true);
        } else {
            console.log('CORS Blocked:', origin);
            callback(new Error(`Not allowed by CORS: ${origin}`));
        }
    },
    optionsSuccessStatus: 200
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Servir imagens estáticas (DEPOIS DO CORS)

// --- MIDDLEWARE DE AUTH ---
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

// ROTA DEDICADA PARA CERTIFICADO (FIX FINAL)
app.post('/gerar-pix-certificado-final', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

        console.log('[PIX CERTIFICADO] Iniciando rota dedicada...');

        // DADOS 100% HARDCODED PARA GARANTIR
        const productHash = 'prod_0bc162e2175f527f';
        const baseAmount = 1490; // R$ 14,90
        const description = 'Certificado de Conclusão';
        const apiKey = 'sk_5801a6ec5051bf1cf144155ddada51120b2d1dda4d03cb2df454fb4eab9a78a9'; // Hardcoded

        const paymentPayload = {
            amount: baseAmount,
            description: description,
            reference: `CKO-CERT-${userId}-${Date.now()}`,
            checkoutUrl: 'https://areamembrosplantascompletinho.vercel.app/certificado',
            productHash: productHash,
            orderbump: [],
            customer: {
                name: user.name,
                email: user.email,
                document: (user.cpf || '00000000000').replace(/\D/g, ''),
                phone: (user.phone || '').replace(/\D/g, '')
            }
        };

        // Fallback CPF se vazio
        const cpfs = ['42879052882', '07435993492', '93509642791'];
        if (paymentPayload.customer.document.length < 11 || paymentPayload.customer.document === '00000000000') {
            console.log('[PIX CERTIFICADO] CPF inválido detectado, usando fallback.');
            paymentPayload.customer.document = cpfs[Math.floor(Math.random() * cpfs.length)];
        }

        console.log('[PIX CERTIFICADO] Payload Forçado:', JSON.stringify(paymentPayload, null, 2));

        const paradiseUrl = 'https://multi.paradisepags.com/api/v1/transaction.php';
        const response = await axios.post(paradiseUrl, paymentPayload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': apiKey
            }
        });

        const data = response.data;
        const transaction = data.transaction || data;

        const qrCode = transaction.qr_code || transaction.pix_qr_code || transaction.qrcode_text;
        const expiration = transaction.expires_at || transaction.expiration_date;

        if (!qrCode) {
            console.error('[PIX CERTIFICADO] Erro: Sem QR Code.', data);
            return res.status(502).json({ error: 'Falha ao obter QR Code (vazio).' });
        }

        res.json({
            pix: {
                pix_qr_code: qrCode,
                expiration_date: expiration
            },
            amount_paid: baseAmount,
            hash: transaction.id || transaction.hash
        });

    } catch (error) {
        console.error('[PIX CERTIFICADO] Erro Fatal:', error.response ? error.response.data : error.message);
        const errorMsg = error.response && error.response.data && error.response.data.error
            ? error.response.data.error
            : 'Erro ao processar pagamento do certificado.';
        res.status(500).json({ error: errorMsg });
    }
});

// --- ROTA DE DEBUG ---
app.post('/debug/toggle-plan', async (req, res) => {
    const { phone, plan, hasLiveAccess, hasWalletAccess } = req.body;
    console.log(`[DEBUG] Force Update: ${phone} -> ${plan}`);
    const cleanPhone = phone ? phone.replace(/\D/g, '') : null;
    if (!cleanPhone) return res.status(400).json({ error: 'Phone required' });

    await prisma.user.updateMany({
        where: { phone: cleanPhone },
        data: {
            plan: plan || 'basic',
            hasLiveAccess: !!hasLiveAccess,
            hasWalletAccess: !!hasWalletAccess, // Garante booleano
            status: 'active'
        }
    });

    res.json({ success: true, plan, hasLiveAccess, hasWalletAccess });
});

// --- ROTA DE DEBUG: DELETAR USUÁRIO ---
app.delete('/debug/delete-user/:phone', async (req, res) => {
    const { phone } = req.params;
    const cleanPhone = phone.replace(/\D/g, '');
    console.log(`[DEBUG] NUKE USER REQUEST: ${cleanPhone}`);

    try {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { phone: cleanPhone },
                    { phone: `55${cleanPhone}` }
                ]
            }
        });

        if (users.length === 0) return res.json({ message: 'User not found' });

        for (const user of users) {
            await prisma.progresso.deleteMany({ where: { userId: user.id } });
            await prisma.user.delete({ where: { id: user.id } });
        }
        res.json({ success: true, deleted: users.length });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// --- ROTA DE LOGIN POR TELEFONE ---
app.post('/auth/login-phone', async (req, res) => {
    const { phone } = req.body;
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) return res.status(400).json({ error: 'Número inválido.' });

    try {
        // Tenta encontrar com ou sem o 55 (Brasil)
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { phone: cleanPhone },
                    { phone: `55${cleanPhone}` }
                ]
            }
        });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado. Você já realizou a compra?' });
        if (user.plan === 'banned' || user.status === 'refunded') return res.status(403).json({ error: 'Acesso revogado.' });

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

// --- WEBHOOK PARADISE PAGS ---
app.post('/webhook/paradise', async (req, res) => {
    const event = req.body;
    try {
        const eventType = event.event || event.status;
        const product = event.product || {};
        const incomingHash = product.hash || product.id || event.product_hash || (event.tracking || {}).product_hash;
        const client = event.client || event.customer || {};

        console.log(`[WEBHOOK] Evento: ${eventType} | Produto: ${incomingHash}`);

        const TARGET_PRODUCT_HASH = process.env.PARADISE_PRODUCT_HASH;
        if (TARGET_PRODUCT_HASH && incomingHash && incomingHash !== TARGET_PRODUCT_HASH) {
            return res.status(200).send('Ignorado: Produto diferente');
        }

        // CONSTANTES DAS OFERTAS (Fornecidas pelo Usuário)
        const PRODUCT_ID_MAIN = 'prod_372117ff2ba365a1'; // Produto Pai
        const OFFER_BASIC = '9b7d69dcb4';
        const OFFER_PREMIUM = '6adf6a54a5';
        const OFFER_DISCOUNT_27 = '210f8fbf65'; // Oferta de R$ 27,00 (Libera Básico)

        // NOVOS PRODUTOS (HASHES DEFINITIVOS)
        const PROD_CERTIFICADO = 'prod_0bc162e2175f527f';
        const PROD_NINA = 'prod_0d6f903b6855c714';

        // Tenta capturar o Hash da Oferta ou do Produto
        // Paradise envia estruturas variadas ex: event.offer.hash, event.product.offer_hash, etc.
        const offerHash = (event.offer && event.offer.hash) ||
            (product && product.offer_hash) ||
            incomingHash; // Fallback para o hash principal recebido

        if (eventType === 'purchase.approved' || eventType === 'paid' || eventType === 'approved') {
            let email = client.email;
            const name = client.name;
            const phone = client.phone ? client.phone.replace(/\D/g, '') : null;
            const cpf = client.cpf || client.document;

            // Determina o Plano e Acessos Extras
            let targetPlan = 'basic'; // Default seguro
            let grantWalletAccess = false;
            let grantNinaAccess = false;

            if (offerHash === OFFER_PREMIUM) {
                targetPlan = 'premium';
                console.log(`[WEBHOOK] Detectada oferta PREMIUM (${offerHash})`);
            } else if (offerHash === OFFER_BASIC || offerHash === OFFER_DISCOUNT_27) {
                targetPlan = 'basic';
                console.log(`[WEBHOOK] Detectada oferta BÁSICA/PROMO (${offerHash})`);
            } else if (offerHash === PROD_CERTIFICADO) {
                // Compra de Certificado AVULSO (mantém plano atual, mas libera carteira)
                // Como o upsert exige plano, mantemos 'basic' se não tiver, ou o atual se já tiver (handled by logic below?)
                // Upsert sobrescreve? Sim. Então vamos assumir Basic com acesso extra.
                targetPlan = 'basic';
                grantWalletAccess = true;
                console.log(`[WEBHOOK] Detectada compra de CERTIFICADO (${offerHash})`);
            } else if (offerHash === PROD_NINA) {
                targetPlan = 'basic';
                grantNinaAccess = true;
                console.log(`[WEBHOOK] Detectada compra de NINA (${offerHash})`);
            } else {
                console.log(`[WEBHOOK] Oferta desconhecida (${offerHash}), atribuindo plano Básico por padrão.`);
            }

            // Lógica de conflito de email (mantida)
            if (email) {
                const userWithEmail = await prisma.user.findFirst({ where: { email: email } });
                if (userWithEmail && userWithEmail.phone !== phone) {
                    email = `${phone}@conflict.verificar`;
                }
            }

            if (!phone) {
                return res.status(200).send('OK, mas sem telefone');
            }

            // FIX: Primeiro busca o user para não fazer downgrade acidental de Premium -> Basic
            const existingUser = await prisma.user.findUnique({ where: { phone: phone } });

            // Se já for Premium e comprou Certificado, MANTÉM Premium.
            if (existingUser && existingUser.plan === 'premium') {
                targetPlan = 'premium';
            }

            // Preserva acessos anteriores se já tiver
            if (existingUser?.hasWalletAccess) grantWalletAccess = true;
            if (existingUser?.hasNinaAccess) grantNinaAccess = true;

            const user = await prisma.user.upsert({
                where: { phone: phone },
                // Se já existe, atualiza
                update: {
                    plan: targetPlan,
                    status: 'active',
                    name: name,
                    email: email,
                    hasWalletAccess: grantWalletAccess,
                    hasNinaAccess: grantNinaAccess
                },
                create: {
                    phone: phone,
                    email: email || `${phone}@sememail.com`,
                    name: name || 'Aluno Novo',
                    plan: targetPlan,
                    status: 'active',
                    cpf: cpf,
                    hasWalletAccess: grantWalletAccess,
                    hasNinaAccess: grantNinaAccess
                }
            });
            console.log(`[WEBHOOK] Usuário APROVADO: ${user.name} (${user.phone}) -> Plano: ${targetPlan}`);
        } else if (eventType === 'purchase.refunded' || eventType === 'chargeback') {
            const phone = client.phone ? client.phone.replace(/\D/g, '') : null;
            if (phone) {
                await prisma.user.updateMany({
                    where: { phone: phone },
                    data: { plan: 'banned', status: 'refunded', hasLiveAccess: false, hasNinaAccess: false }
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

// --- NOVO WEBHOOK DE REEMBOLSO (ESPECÍFICO) ---
app.post('/webhook/paradise-reembolso', async (req, res) => {
    const event = req.body;
    try {
        console.log(`[WEBHOOK REEMBOLSO] Recebido:`, JSON.stringify(event));

        // Tenta extrair dados do cliente de várias estruturas possíveis do Paradise
        const client = event.client || event.customer || {};
        const phone = client.phone ? client.phone.replace(/\D/g, '') : null;

        // Verifica se é um evento relevante (embora a URL já seja de reembolso, valida o status se vier)
        const eventType = event.event || event.status || 'refunded';

        if (!phone) {
            console.log('[WEBHOOK REEMBOLSO] Ignorado: Sem telefone do cliente.');
            return res.status(200).send('Ignorado: Sem telefone');
        }

        console.log(`[WEBHOOK REEMBOLSO] Processando revogação para: ${phone}`);

        // Ação de Bloqueio / Revogação
        // Define o plano como 'banned' e remove acessos extras
        await prisma.user.updateMany({
            where: { phone: phone },
            data: {
                plan: 'banned',
                status: 'refunded',
                hasLiveAccess: false,
                hasNinaAccess: false,
                hasWalletAccess: false
            }
        });

        console.log(`[WEBHOOK REEMBOLSO] Acesso REVOGADO com sucesso para o telefone ${phone}`);
        res.status(200).send('Reembolso processado: Acesso revogado');

    } catch (error) {
        console.error('[WEBHOOK REEMBOLSO] Erro fatal:', error);
        res.status(500).send('Erro interno ao processar reembolso');
    }
});

// --- ROTA DE GERAÇÃO DE PIX ---
app.post('/gerar-pix-paradise', authenticateToken, async (req, res) => {
    try {
        const { productHash, baseAmount, productTitle, checkoutUrl } = req.body;
        const userId = req.user.id;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

        // Ensure amount is integer (cents) logic if needed, but assuming baseAmount comes correct from frontend
        // PHP script sends 1490 for 14.90.

        const validCpfs = ['42879052882', '07435993492', '93509642791', '73269352468'];
        const defaultCpf = validCpfs[Math.floor(Math.random() * validCpfs.length)];

        const paymentPayload = {
            amount: baseAmount,
            description: productTitle || 'Produto Digital',
            reference: `CKO-${userId}-${Date.now()}`,
            checkoutUrl: checkoutUrl || 'https://areamembrosplantascompletinho.vercel.app',
            productHash: productHash,
            customer: {
                name: user.name,
                email: user.email,
                document: (user.cpf || defaultCpf).replace(/\D/g, ''),
                phone: (user.phone || '').replace(/\D/g, '')
            },
            orderbump: [] // Mantendo estrutura idêntica ao PHP
        };

        const paradiseUrl = 'https://multi.paradisepags.com/api/v1/transaction.php';
        // HARDCODED TO MATCH PHP SCRIPT EXACTLY
        const apiKey = 'sk_5801a6ec5051bf1cf144155ddada51120b2d1dda4d03cb2df454fb4eab9a78a9';


        console.log(`[PIX] Token Length: ${apiKey.length}`);
        console.log('[PIX] Enviando payload:', JSON.stringify(paymentPayload, null, 2));

        const response = await axios.post(paradiseUrl, paymentPayload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': apiKey
            }
        });

        // PHP Logic: $transaction_data = $response_data['transaction'] ?? $response_data;
        const data = response.data;
        const transaction = data.transaction || data;

        const qrCode = transaction.qr_code || transaction.pix_qr_code || transaction.qrcode_text;
        const expiration = transaction.expires_at || transaction.expiration_date;

        if (!qrCode) {
            console.error('[PIX] Resposta sem QR Code:', JSON.stringify(data));
            return res.status(502).json({ error: 'Falha ao obter QR Code da operadora.' });
        }

        res.json({
            pix: {
                pix_qr_code: qrCode,
                expiration_date: expiration
            },
            amount_paid: baseAmount,
            hash: transaction.id || transaction.hash || 'NOHASH'
        });

    } catch (error) {
        const errorData = error.response ? error.response.data : null;
        const errorMsg = errorData ? JSON.stringify(errorData) : error.message;
        console.error('[PIX] Erro detalhado:', errorMsg);

        // Passar erro exato da API
        if (errorData && errorData.error) {
            return res.status(400).json({ error: `Erro na Operadora: ${errorData.error}` });
        }
        res.status(500).json({ error: `Erro ao processar pagamento: ${errorMsg}` });
    }
});

app.get('/me', authenticateToken, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.sendStatus(404);
    res.json(user);
});

// --- ROTA DE UPLOAD DE FOTO DE PERFIL (BASE64) ---
app.post('/upload-profile-image', authenticateToken, upload.single('profileImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        }

        console.log(`[UPLOAD] Processando imagem para User ${req.user.id}...`);

        // Processamento com SHARP: Redimensionar e Converter para Base64
        // 300x300 é suficiente para avatar, qualidade 80 remove peso desnecessário
        const processedBuffer = await sharp(req.file.buffer)
            .resize(300, 300, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toBuffer();

        const base64Image = `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;

        // Atualiza no Banco com a string Base64 completa
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: { profileImage: base64Image }
        });

        console.log(`[UPLOAD] Sucesso! Tamanho salvo: ${Math.round(base64Image.length / 1024)}KB`);
        res.json({ success: true, profileImage: base64Image, user: updatedUser });

    } catch (error) {
        console.error("Erro no upload:", error);
        res.status(500).json({ error: 'Erro ao processar imagem.' });
    }
});

app.get('/modulos', authenticateToken, (req, res) => { res.json(MOCK_MODULOS); });

app.get('/api/fix-quiz-db', async (req, res) => {
    try {
        console.log('🔧 Executing Database Fix for Quiz...');

        // 1. Ensure Module 102 exists
        await prisma.modulo.upsert({
            where: { id: 102 },
            update: {},
            create: {
                id: 102,
                nome: 'Avaliação Final',
                description: 'Complete o Quiz para receber seu certificado.',
                ordem: 100,
                imagem: 'https://placehold.co/600x400/eab308/ffffff?text=Quiz+Final'
            }
        });

        // 2. Ensure Aula 999 exists
        await prisma.aula.upsert({
            where: { id: 999 },
            update: {},
            create: {
                id: 999,
                nome: 'Avaliação Final (Sistema)',
                descricao: 'Aula lógica para registrar a conclusão do Quiz.',
                videoUrl: 'https://quiz-placeholder',
                ordem: 1,
                moduloId: 102
            }
        });

        res.json({ success: true, message: 'Modulo 102 e Aula 999 verificados/criados com sucesso.' });
    } catch (error) {
        console.error('Fix DB Error:', error);
        res.status(500).json({ error: error.message });
    }
});
app.get('/modulos/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const modulo = MOCK_MODULOS.find(m => m.id === id);
    if (!modulo) return res.status(404).json({ error: 'Módulo não encontrado.' });
    res.json(modulo);
});

app.get('/progresso', authenticateToken, async (req, res) => {
    const progressos = await prisma.progresso.findMany({
        where: { userId: req.user.id, concluida: true },
        select: { aulaId: true }
    });
    res.json(progressos.map(p => p.aulaId));
});

app.post('/aulas/concluir', authenticateToken, async (req, res) => {
    const { aulaId, completed } = req.body; // Aceita 'completed' (boolean)
    const userId = req.user.id;

    // Default: Se 'completed' não for enviado, assume true (comportamento antigo de apenas marcar)
    const shouldMark = completed !== undefined ? completed : true;

    if (shouldMark) {
        // MARCAR COMO CONCLUÍDA
        await prisma.progresso.upsert({
            where: { userId_aulaId: { userId, aulaId } },
            update: { concluida: true },
            create: { userId, aulaId, concluida: true }
        });
        res.json({ status: 'marcada' });
    } else {
        // DESMARCAR (REMOVER DO BANCO)
        try {
            await prisma.progresso.delete({
                where: { userId_aulaId: { userId, aulaId } }
            });
            res.json({ status: 'desmarcada' });
        } catch (e) {
            // Se já não existir, tudo bem
            res.json({ status: 'desmarcada (ja estava)' });
        }
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

// --- HELPER TITLE CASE ---
function toTitleCase(str) {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

// --- ROTA DE GERAÇÃO DE CERTIFICADO ---
app.post('/gerar-certificado', authenticateToken, async (req, res) => {
    const { safeStudentName } = req.body;

    // 1. CLEANUP NAME LOGIC (TITLE CASE)
    let rawName = safeStudentName ? safeStudentName.replace(/_/g, ' ') : req.user.name;
    const studentName = toTitleCase(rawName);

    try {
        const doc = new PDFDocument({
            layout: 'landscape',
            size: 'A4',
            margin: 0,
            autoFirstPage: true
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=certificado_${req.user.id}.pdf`);
        doc.pipe(res);

        const WIDTH = 841.89;
        const HEIGHT = 595.28;
        const SIDEBAR_WIDTH = WIDTH * 0.33;

        // Background Sidebar
        doc.rect(0, 0, SIDEBAR_WIDTH, HEIGHT).fill('#e9e4de');

        // Imagem Sidebar
        const assetsDir = path.join(__dirname, 'gerador_certificado', 'img');
        const possibleImages = [
            path.join(assetsDir, 'ervas.webp'),
            path.join(assetsDir, 'ervas_fallback.jpg'),
            path.join(assetsDir, 'ervas.png'),
            path.join(__dirname, 'assets', 'cert', 'ervas_fallback.jpg')
        ];
        const sidebarImg = possibleImages.find(p => fs.existsSync(p));

        if (sidebarImg) {
            try {
                doc.save();
                doc.rect(0, 0, SIDEBAR_WIDTH, HEIGHT).clip();
                doc.image(sidebarImg, 0, 0, {
                    cover: [SIDEBAR_WIDTH, HEIGHT],
                    align: 'center',
                    valign: 'center'
                });
                doc.restore();
            } catch (e) { console.error("Erro imagem sidebar:", e); }
        }

        const CONTENT_START_X = SIDEBAR_WIDTH;
        const CONTENT_WIDTH = WIDTH - SIDEBAR_WIDTH;
        const CENTER_X = CONTENT_START_X + (CONTENT_WIDTH / 2); // Centro visual

        // Background Principal
        doc.rect(SIDEBAR_WIDTH, 0, CONTENT_WIDTH, HEIGHT).fill('#F6F1E9');

        let cursorY = 50;

        // Medalha
        try {
            const medal = path.join(assetsDir, 'medalha.png');
            if (fs.existsSync(medal)) {
                doc.image(medal, WIDTH - 120, 30, { width: 80 });
            }
        } catch (e) { }

        // --- TEXTOS ---

        // School Name
        doc.font('Times-Bold').fontSize(22).fillColor('#5d6d5f')
            .text('SABERES DA FLORESTA', CONTENT_START_X, cursorY, {
                width: CONTENT_WIDTH,
                align: 'center',
                characterSpacing: 2
            });

        cursorY += 60;

        // Title 
        doc.font('Times-Roman').fontSize(48).fillColor('#333')
            .text('Certificado de Conclusão', CONTENT_START_X, cursorY, {
                width: CONTENT_WIDTH,
                align: 'center'
            });

        cursorY += 50;

        // Subtitle
        doc.fontSize(14).fillColor('#888').font('Helvetica')
            .text('CERTIFICATE OF COMPLETION', CONTENT_START_X, cursorY, {
                width: CONTENT_WIDTH,
                align: 'center',
                characterSpacing: 3
            });

        cursorY += 60;

        doc.fontSize(16).fillColor('#4a4a4a').font('Helvetica')
            .text('Este certificado é concedido a', CONTENT_START_X, cursorY, {
                width: CONTENT_WIDTH,
                align: 'center'
            });

        cursorY += 30;

        // NOME DO ALUNO (Title Case)
        let nameSize = 40;
        if (studentName.length > 30) nameSize = 32;
        doc.font('Times-Bold').fontSize(nameSize).fillColor('#5d6d5f')
            .text(studentName, CONTENT_START_X, cursorY, {
                width: CONTENT_WIDTH,
                align: 'center'
            });

        // LINHA (AGGRESSIVE FLUSH & DARK COLOR)
        // Offset reduzido para 'nameSize - 5' para colisão visual (flush)
        const lineOffset = nameSize - 5;
        const lineY = cursorY + lineOffset;

        const lineW = 400;
        doc.moveTo(CENTER_X - (lineW / 2), lineY)
            .lineTo(CENTER_X + (lineW / 2), lineY)
            .strokeColor('#4a4a4a').stroke(); // COR ALTERADA DE #d4c8be PARA #4a4a4a

        // Pula para o próximo bloco (compensa o offset negativo)
        cursorY = lineY + 35; // +30 original + 5 compensação

        // Textos Separados
        const fixTextW = 550;
        const fixTextX = CENTER_X - (fixTextW / 2);

        doc.fontSize(16).fillColor('#4a4a4a').font('Helvetica')
            .text('Por ter concluído com sucesso o curso de', fixTextX, cursorY, {
                width: fixTextW, align: 'center'
            });

        cursorY += 25;

        doc.font('Helvetica-Bold').fontSize(18).fillColor('#2d3e2e')
            .text('SABERES DA FLORESTA: Formação Completa', fixTextX, cursorY, {
                width: fixTextW, align: 'center'
            });

        cursorY += 30;

        doc.font('Helvetica').fontSize(16).fillColor('#4a4a4a')
            .text('demonstrando dedicação e competência nas práticas de herborista.', fixTextX, cursorY, {
                width: fixTextW, align: 'center'
            });

        cursorY += 50;

        // DATE + TIME (NEW)
        const now = new Date();
        const hoje = now.toLocaleDateString('pt-BR');
        const hora = now.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo'
        });

        doc.text(`Concluído em: ${hoje} às ${hora}`, CONTENT_START_X, cursorY, {
            width: CONTENT_WIDTH, align: 'center'
        });

        // --- ASSINATURAS ---
        const SIG_Y = HEIGHT - 100;
        const SIG_BOX_W = 180;
        const SIG_GAP = 60;

        const SIG_1_X = CENTER_X - SIG_BOX_W - (SIG_GAP / 2);
        const SIG_2_X = CENTER_X + (SIG_GAP / 2);

        // Assinatura 1 (Instrutora Responsável)
        try {
            const s1 = path.join(assetsDir, 'M.Luiza.png');
            if (fs.existsSync(s1)) {
                doc.image(s1, SIG_1_X + 40, SIG_Y - 25, { width: 100 });
            }
        } catch (e) { }

        doc.moveTo(SIG_1_X, SIG_Y).lineTo(SIG_1_X + SIG_BOX_W, SIG_Y).strokeColor('#4a4a4a').stroke();
        doc.fontSize(12).font('Helvetica').text('INSTRUTORA RESPONSÁVEL', SIG_1_X, SIG_Y + 10, { width: SIG_BOX_W, align: 'center' });

        // Assinatura 2 (Direção da Escola)
        try {
            const s2 = path.join(assetsDir, 'J.padilha.png');
            if (fs.existsSync(s2)) {
                doc.image(s2, SIG_2_X + 30, SIG_Y - 45, { width: 120 });
            }
        } catch (e) { }

        doc.moveTo(SIG_2_X, SIG_Y).lineTo(SIG_2_X + SIG_BOX_W, SIG_Y).stroke();
        doc.text('DIREÇÃO DA ESCOLA', SIG_2_X, SIG_Y + 10, { width: SIG_BOX_W, align: 'center' });

        doc.end();

    } catch (error) {
        console.error("Erro fatal PDFKit:", error);
        res.status(500).json({ error: 'Erro na geração do certificado.' });
    }
});

// Seed DB
app.get('/fix-content-db', async (req, res) => {
    try {
        let log = [];
        for (const mod of MOCK_MODULOS) {
            await prisma.modulo.upsert({
                where: { id: mod.id },
                update: {
                    nome: mod.nome,
                    description: mod.description,
                    ordem: mod.ordem,
                    imagem: 'https://placehold.co/600x400/10b981/ffffff?text=Modulo+' + mod.id
                },
                create: {
                    id: mod.id,
                    nome: mod.nome,
                    description: mod.description,
                    ordem: mod.ordem,
                    imagem: 'https://placehold.co/600x400/10b981/ffffff?text=Modulo+' + mod.id
                }
            });
            log.push(`Módulo ${mod.id} sincronizado.`);
            if (mod.aulas && mod.aulas.length > 0) {
                for (const aula of mod.aulas) {
                    await prisma.aula.upsert({
                        where: { id: aula.id },
                        update: {
                            nome: aula.nome,
                            descricao: `Conteúdo da aula ${aula.nome}`,
                            videoUrl: aula.videoUrl,
                            ordem: aula.ordem,
                            moduloId: mod.id
                        },
                        create: {
                            id: aula.id,
                            nome: aula.nome,
                            descricao: `Conteúdo da aula ${aula.nome}`,
                            videoUrl: aula.videoUrl,
                            ordem: aula.ordem,
                            moduloId: mod.id
                        }
                    });
                }
                log.push(`  -> ${mod.aulas.length} aulas sincronizadas.`);
            }
        }
        res.send(`<h1>Sucesso! Banco de Dados Atualizado.</h1><pre>${log.join('\n')}</pre>`);
    } catch (error) {
        console.error("Erro no seed:", error);
        res.status(500).send("Erro ao sincronizar: " + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 SERVIDOR REAL (PRISMA) RODANDO NA PORTA ${PORT}`);
    console.log(`💳 Webhook Paradise ativo em /webhook/paradise`);
});