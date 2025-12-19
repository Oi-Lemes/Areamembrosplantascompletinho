
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURAÇÃO ---
// Ajuste para a URL onde seu servidor está rodando (local ou render)
const API_URL = 'http://localhost:3001';
// const API_URL = 'https://areamembrosplantascompletinho.onrender.com';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Precisamos de um token válido. Vamos simular um login primeiro ou use um token hardcoded se tiver.
// Vou usar a rota de login-phone para pegar um token novo.
const PHONE_NUMBER = '5511999999999'; // Use um número que existe no banco (do seed ou criado)

async function testUpload() {
    try {
        console.log('0. Criando Usuário via Webhook (Garantia)...');
        await axios.post(`${API_URL}/webhook/paradise`, {
            event: 'purchase.approved',
            product: { hash: process.env.PARADISE_PRODUCT_HASH || 'test-hash' },
            client: {
                name: 'Tester Upload',
                phone: PHONE_NUMBER,
                email: 'test@upload.com'
            }
        });
        console.log('✅ Usuário criado/atualizado.');

        console.log('1. Fazendo Login para obter Token...');
        const loginRes = await axios.post(`${API_URL}/auth/login-phone`, { phone: PHONE_NUMBER });
        const token = loginRes.data.token;
        console.log('✅ Token obtido:', token.substring(0, 20) + '...');

        console.log('\n2. Preparando imagem para upload...');
        // Cria uma imagem dummy se não existir
        const imagePath = path.join(__dirname, 'test_image.png');
        if (!fs.existsSync(imagePath)) {
            fs.writeFileSync(imagePath, 'fake image content'); // Isso pode falhar na validação do multer se ele checar magic numbers, mas vamos tentar se a extensão basta.
            // Multer check mimetype: image/png usually relies on extension or magic numbers. 
            // My check: file.mimetype.startsWith('image/')
            // axios form-data sends content-type based on extension usually.
        }

        const form = new FormData();
        form.append('profileImage', fs.createReadStream(imagePath));

        console.log('3. Enviando requisição POST /upload-profile-image ...');
        const uploadRes = await axios.post(`${API_URL}/upload-profile-image`, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Upload concluído!');
        console.log('📝 Resposta:', uploadRes.data);

    } catch (error) {
        if (error.response) {
            console.error('❌ Erro na resposta:', error.response.status, error.response.data);
        } else {
            console.error('❌ Erro na requisição:', error.message);
        }
    }
}

testUpload();
