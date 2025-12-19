
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
import PDFDocument from 'pdfkit'; // NEW: PDF Library for Certificates

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
        id: 98, nome: 'Live com o Dr. José Nakamura', description: 'Um encontro exclusivo para tirar dúvidas.', ordem: 98, aulas: []
    },
    {
        id: 100, nome: 'Emissão de Certificado', description: 'Parabéns! Emita o seu certificado.', ordem: 100, aulas: []
    },
    {
        id: 101, nome: 'Emissão CARTEIRA NACIONAL CRTH ABRATH', description: 'Esta carteira tem sua emissão de forma anual.', ordem: 101, aulas: []
    }
];

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'segredo-super-secreto';
const PARADISE_API_TOKEN = process.env.PARADISE_API_TOKEN;

app.use(express.json());

// Configuração do CORS
const allowedOrigins = [
    'https://www.saberesdafloresta.site',
    'http://localhost:3000',
    'http://localhost:3002'
];

if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Se FRONTEND_URL for *, aceita tudo
        if (process.env.FRONTEND_URL === '*') {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            console.log('CORS Blocked:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
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

// --- ROTA DE DEBUG PARA ALTERAR PLANOS (NOVO) ---
app.post('/debug/toggle-plan', async (req, res) => {
    const { phone, plan, hasLiveAccess, hasWalletAccess } = req.body;
    console.log(`[DEBUG] Force Update: ${phone} -> ${plan}`);

    // Limpa apenas números
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
        // Tenta pegar de várias formas
        const product = event.product || {};
        const tracking = event.tracking || {};
        const incomingHash = product.hash || product.id || event.product_hash || tracking.product_hash;
        const client = event.client || event.customer || {}; // Garante que client existe

        console.log(`[WEBHOOK] Evento: ${eventType} | Produto: ${incomingHash}`);

        // --- FILTRO DE PRODUTO ---
        const TARGET_PRODUCT_HASH = process.env.PARADISE_PRODUCT_HASH;
        // Só verifica se tiver hash configurado e se o evento tiver produto
        if (TARGET_PRODUCT_HASH && incomingHash && incomingHash !== TARGET_PRODUCT_HASH) {
            console.log(`[WEBHOOK] Ignorado: Produto incorreto (${incomingHash} !== ${TARGET_PRODUCT_HASH})`);
            return res.status(200).send('Ignorado: Produto diferente');
        }

        if (eventType === 'purchase.approved' || eventType === 'paid' || eventType === 'approved') {
            let email = client.email;
            const name = client.name;
            const phone = client.phone ? client.phone.replace(/\D/g, '') : null;
            const cpf = client.cpf || client.document;

            if (email) {
                // Prevent Unique Constraint Fix (P2002)
                // If email exists on ANOTHER phone, we ignore it for this new user to avoid crash.
                const userWithEmail = await prisma.user.findFirst({ where: { email: email } });
                if (userWithEmail && userWithEmail.phone !== phone) {
                    console.log(`[WEBHOOK] Email ${email} em uso por ${userWithEmail.phone}. Gerando alias.`);
                    email = `${phone}@conflict.verificar`;
                }
            }

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

// --- ROTA DE GERAÇÃO DE PIX (PARADISE) ---
app.post('/gerar-pix-paradise', authenticateToken, async (req, res) => {
    try {
        const { productHash, baseAmount, productTitle, checkoutUrl } = req.body;
        const userId = req.user.id;

        // 1. Buscar dados completos do usuário (CPF/Telefone são obrigatórios)
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

        if (!user.cpf) {
            // Em produção, você deve pedir o CPF no frontend antes de chamar isso.
            // Para "curativo", vamos tentar usar um CPF genérico SE não tiver (mas o ideal é ter).
            // Ou retornar erro pedindo CPF. Vamos assumir que o cadastro tem CPF ou falha.
            console.warn('[PIX] Usuário sem CPF, tentando prosseguir (pode falhar no gateway).');
        }

        // 2. Montar Payload da ParadisePag
        const paymentPayload = {
            amount: baseAmount, // Em centavos? A API do test_api diz 1000 = 10.00. O frontend manda 6700.
            description: productTitle || 'Produto Digital',
            reference: `REF-${userId}-${Date.now()}`,
            checkoutUrl: checkoutUrl || 'https://areamembrosplantascompletinho.vercel.app',
            productHash: productHash,
            customer: {
                name: user.name,
                email: user.email,
                document: user.cpf || '00000000000', // Fallback arriscado, mas evita crash imediato
                phone: user.phone
            }
        };

        console.log('[PIX] Enviando pedido para Paradise:', paymentPayload);

        // 3. Chamar API Paradise
        const paradiseUrl = 'https://multi.paradisepags.com/api/v1/transaction.php';
        const response = await axios.post(paradiseUrl, paymentPayload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': PARADISE_API_TOKEN
            }
        });

        // 4. Retornar dados formatados para o Frontend (PixModal)
        // O PixModal espera: result.pix.pix_qr_code, result.amount_paid, result.hash
        const data = response.data;

        // A resposta da Paradise varia, vamos logar para garantir
        console.log('[PIX] Resposta Paradise:', JSON.stringify(data, null, 2));

        if (!data || !data.qr_code) {
            // Adaptação caso a API retorne diferente (pix_qr_code ou qr_code)
            // No test_api, não vi a resposta exata de sucesso.
            // Assumindo padrão comum:
        }

        // Mapeamento (Ajuste conforme retorno real da API)
        const qrCode = data.qr_code || data.pix_qr_code || data.qrcode_text;
        const expiration = data.expiration_date || data.expiration;

        if (!qrCode) {
            console.error('[PIX] QR Code não retornado pela API.');
            return res.status(502).json({ error: 'Falha ao obter QR Code da operadora.' });
        }

        res.json({
            pix: {
                pix_qr_code: qrCode,
                expiration_date: expiration
            },
            amount_paid: baseAmount,
            hash: productHash
        });

    } catch (error) {
        console.error('[PIX] Erro ao gerar:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Erro ao processar pagamento.' });
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

// Rota para detalhes de UM módulo (Correção do Erro 404)
app.get('/modulos/:id', authenticateToken, (req, res) => {
    const id = parseInt(req.params.id);
    const modulo = MOCK_MODULOS.find(m => m.id === id);

    if (!modulo) {
        return res.status(404).json({ error: 'Módulo não encontrado.' });
    }

    res.json(modulo);
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

// --- ROTA DE GERAÇÃO DE CERTIFICADO (PDFKIT - LAYOUT PREMIUM HARDCODED) ---
app.post('/gerar-certificado', authenticateToken, async (req, res) => {
    const { safeStudentName } = req.body;
    const studentName = safeStudentName ? safeStudentName.replace(/_/g, ' ').toUpperCase() : req.user.name.toUpperCase();

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

        // Dimensões A4 Paisagem (Points)
        const WIDTH = 841.89;
        const HEIGHT = 595.28;

        // --- 1. SIDEBAR (33% WIDTH ~ 280-285 pts) ---
        // A proporção 100mm/297mm é ~33.6%. Vamos usar 0.33 para simplificar.
        const SIDEBAR_WIDTH = WIDTH * 0.33;

        // Background Sidebar
        doc.rect(0, 0, SIDEBAR_WIDTH, HEIGHT).fill('#e9e4de');

        // Imagem Sidebar
        const assetsDir = path.join(__dirname, 'gerador_certificado', 'img');
        const possibleImages = [
            path.join(assetsDir, 'ervas.webp'), // Prioridade para o webp original
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
            } catch (e) {
                console.error("Erro imagem sidebar:", e);
            }
        }

        // --- 2. MAIN CONTENT AREA ---
        const CONTENT_START_X = SIDEBAR_WIDTH;
        const CONTENT_WIDTH = WIDTH - SIDEBAR_WIDTH;
        const CENTER_X = CONTENT_START_X + (CONTENT_WIDTH / 2); // Centro visual

        // Background Principal
        doc.rect(SIDEBAR_WIDTH, 0, CONTENT_WIDTH, HEIGHT).fill('#F6F1E9');

        // Configurações de posicionamento vertical (Cursor Y)
        let cursorY = 50; // Margem superior

        // --- SELO MEDALHA (Absolute Top Right) ---
        try {
            const medal = path.join(assetsDir, 'medalha.png');
            if (fs.existsSync(medal)) {
                // top: 30px, right: 50px (simulado)
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

        // Title "Certificado..."
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

        // "Este certificado é concedido a"
        doc.fontSize(16).fillColor('#4a4a4a').font('Helvetica')
            .text('Este certificado é concedido a', CONTENT_START_X, cursorY, {
                width: CONTENT_WIDTH,
                align: 'center'
            });

        cursorY += 30;

        // NOME DO ALUNO
        // Ajuste de fonte se nome for longo
        let nameSize = 40;
        if (studentName.length > 30) nameSize = 32;
        doc.font('Times-Bold').fontSize(nameSize).fillColor('#5d6d5f')
            .text(studentName, CONTENT_START_X, cursorY, {
                width: CONTENT_WIDTH,
                align: 'center'
            });

        // Linha abaixo do nome
        const nameH = doc.heightOfString(studentName, { width: CONTENT_WIDTH });
        const lineY = cursorY + nameH + 10;
        const lineW = 400;
        doc.moveTo(CENTER_X - (lineW / 2), lineY)
            .lineTo(CENTER_X + (lineW / 2), lineY)
            .strokeColor('#d4c8be').stroke();

        cursorY = lineY + 30;

        // Texto de Conclusão (limitado largura para quebrar linha bonito)
        doc.fontSize(16).fillColor('#4a4a4a').font('Helvetica');
        const textWidth = 500;
        const textX = CENTER_X - (textWidth / 2);

        doc.text('Por ter concluído com sucesso o curso de ', textX, cursorY, {
            width: textWidth,
            align: 'center',
            continued: true
        }).font('Helvetica-Bold').text('SABERES DA FLORESTA: Formação Completa', {
            continued: true
        }).font('Helvetica').text(', demonstrando dedicação e competência nas práticas de herborista.', {
            continued: false
        });

        cursorY += 60;

        // Data
        const hoje = new Date().toLocaleDateString('pt-BR');
        doc.text(`Concluído em: ${hoje}`, CONTENT_START_X, cursorY, {
            width: CONTENT_WIDTH,
            align: 'center'
        });

        // --- ASSINATURAS (Fixo na parte inferior) ---
        const SIG_Y = HEIGHT - 100;
        const SIG_BOX_W = 180;
        const SIG_GAP = 60;

        const SIG_1_X = CENTER_X - SIG_BOX_W - (SIG_GAP / 2);
        const SIG_2_X = CENTER_X + (SIG_GAP / 2);

        // Assinatura 1
        try {
            const s1 = path.join(assetsDir, 'M.Luiza.png');
            if (fs.existsSync(s1)) doc.image(s1, SIG_1_X + 40, SIG_Y - 50, { width: 100 });
        } catch (e) { }

        doc.moveTo(SIG_1_X, SIG_Y).lineTo(SIG_1_X + SIG_BOX_W, SIG_Y).strokeColor('#4a4a4a').stroke();
        doc.fontSize(12).font('Helvetica').text('INSTRUTORA RESPONSÁVEL', SIG_1_X, SIG_Y + 10, { width: SIG_BOX_W, align: 'center' });

        // Assinatura 2
        try {
            const s2 = path.join(assetsDir, 'J.padilha.png');
            if (fs.existsSync(s2)) doc.image(s2, SIG_2_X + 30, SIG_Y - 50, { width: 120 });
        } catch (e) { }

        doc.moveTo(SIG_2_X, SIG_Y).lineTo(SIG_2_X + SIG_BOX_W, SIG_Y).stroke();
        doc.text('DIREÇÃO DA ESCOLA', SIG_2_X, SIG_Y + 10, { width: SIG_BOX_W, align: 'center' });

        doc.end();

    } catch (error) {
        console.error("Erro fatal PDFKit:", error);
        res.status(500).json({ error: 'Erro na geração do certificado.' });
    }
});

// --- ROTA DE CORREÇÃO (SEED) ---
// Executa a sincronização dos MOCK_MODULOS com o Banco de Dados Real
// Isso resolve o erro "Foreign key constraint violated" ao marcar aulas.
app.get('/fix-content-db', async (req, res) => {
    try {
        let log = [];
        for (const mod of MOCK_MODULOS) {
            // Cria/Atualiza Módulo
            await prisma.modulo.upsert({
                where: { id: mod.id },
                update: {
                    nome: mod.nome,
                    description: mod.description,
                    ordem: mod.ordem,
                    imagem: 'https://placehold.co/600x400/10b981/ffffff?text=Modulo+' + mod.id // Fallback img
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

            // Cria/Atualiza Aulas
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


// Inicia o servidor
app.listen(PORT, () => {
    console.log(`\n🚀 SERVIDOR REAL (PRISMA) RODANDO NA PORTA ${PORT}`);
    console.log(`💳 Webhook Paradise ativo em /webhook/paradise`);
});