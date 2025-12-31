
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Mock request data
const studentName = 'Test Student Name';

const doc = new PDFDocument({
    layout: 'landscape',
    size: 'A4',
    margin: 0,
    autoFirstPage: true
});

const outputPath = path.join(__dirname, 'test_certificate.pdf');
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

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
    path.join(assetsDir, 'ervas.png')
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
        console.log('Sidebar Image loaded:', sidebarImg);
    } catch (e) { console.error("Erro imagem sidebar:", e); }
} else {
    console.log('Sidebar Image NOT FOUND');
}

const CONTENT_START_X = SIDEBAR_WIDTH;
const CONTENT_WIDTH = WIDTH - SIDEBAR_WIDTH;
const CENTER_X = CONTENT_START_X + (CONTENT_WIDTH / 2);

// Background Principal
doc.rect(SIDEBAR_WIDTH, 0, CONTENT_WIDTH, HEIGHT).fill('#F6F1E9');

let cursorY = 50;

// Medalha
try {
    const medal = path.join(assetsDir, 'medalha.png');
    if (fs.existsSync(medal)) {
        doc.image(medal, WIDTH - 120, 30, { width: 80 });
        console.log('Medal loaded');
    } else {
        console.log('Medal NOT found');
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

// NOME DO ALUNO
let nameSize = 40;
doc.font('Times-Bold').fontSize(nameSize).fillColor('#5d6d5f')
    .text(studentName, CONTENT_START_X, cursorY, {
        width: CONTENT_WIDTH,
        align: 'center'
    });

const lineOffset = nameSize - 5;
const lineY = cursorY + lineOffset;

const lineW = 400;
doc.moveTo(CENTER_X - (lineW / 2), lineY)
    .lineTo(CENTER_X + (lineW / 2), lineY)
    .strokeColor('#4a4a4a').stroke();

cursorY = lineY + 35;

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

// DATE + TIME
const now = new Date();
const hoje = now.toLocaleDateString('pt-BR');
doc.text(`Concluído em: ${hoje}`, CONTENT_START_X, cursorY, {
    width: CONTENT_WIDTH, align: 'center'
});

// --- ASSINATURAS ---
const SIG_Y = HEIGHT - 100;
const SIG_BOX_W = 180;
const SIG_GAP = 60;

const SIG_1_X = CENTER_X - SIG_BOX_W - (SIG_GAP / 2);
const SIG_2_X = CENTER_X + (SIG_GAP / 2);

// Assinatura 1
try {
    const s1 = path.join(assetsDir, 'M.Luiza.png');
    if (fs.existsSync(s1)) {
        doc.image(s1, SIG_1_X + 40, SIG_Y - 25, { width: 100 });
        console.log('Sig 1 loaded');
    } else {
        console.log('Sig 1 NOT found');
    }
} catch (e) { }

doc.moveTo(SIG_1_X, SIG_Y).lineTo(SIG_1_X + SIG_BOX_W, SIG_Y).strokeColor('#4a4a4a').stroke();
doc.fontSize(12).font('Helvetica').text('INSTRUTORA RESPONSÁVEL', SIG_1_X, SIG_Y + 10, { width: SIG_BOX_W, align: 'center' });

// Assinatura 2
try {
    const s2 = path.join(assetsDir, 'J.padilha.png');
    if (fs.existsSync(s2)) {
        doc.image(s2, SIG_2_X + 30, SIG_Y - 45, { width: 120 });
        console.log('Sig 2 loaded');
    } else {
        console.log('Sig 2 NOT found');
    }
} catch (e) { }

doc.moveTo(SIG_2_X, SIG_Y).lineTo(SIG_2_X + SIG_BOX_W, SIG_Y).stroke();
doc.text('DIREÇÃO DA ESCOLA', SIG_2_X, SIG_Y + 10, { width: SIG_BOX_W, align: 'center' });

doc.end();

stream.on('finish', () => {
    console.log('PDF generated successfully at:', outputPath);
});
