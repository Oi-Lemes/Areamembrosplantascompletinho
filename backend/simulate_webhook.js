
import axios from 'axios';
import 'dotenv/config';

// --- CONFIGURAÇÃO ---
const WEBHOOK_URL = 'http://localhost:3001/webhook/paradise';
const PRODUCT_HASH = process.env.PARADISE_PRODUCT_HASH || 'prod_372117ff2ba365a1'; // O hash configurado

// --- DADOS DO TESTE ---
// Mude o telefone para o SEU número de teste
const TEST_PAYLOAD = {
    event: 'purchase.approved',
    product: {
        hash: PRODUCT_HASH, // O hash correto
        name: 'Curso Segredos da Floresta'
    },
    client: {
        name: 'Cliente Teste Local',
        email: 'teste@local.com',
        phone: '11999999999', // <--- SEU WHATSAPP AQUI
        cpf: '000.000.000-00'
    }
};

console.log('🚀 Enviando Webhook Simulado para:', WEBHOOK_URL);
console.log('📦 Payload:', JSON.stringify(TEST_PAYLOAD, null, 2));

try {
    const response = await axios.post(WEBHOOK_URL, TEST_PAYLOAD);
    console.log('\n✅ Sucesso! Resposta do Servidor:', response.data);
    console.log('Agora tente logar com o telefone:', TEST_PAYLOAD.client.phone);
} catch (error) {
    console.error('\n❌ Erro ao enviar:', error.message);
    if (error.code === 'ECONNREFUSED') {
        console.error('Dica: Verifique se o servidor backend está rodando na porta 3001!');
    }
}
