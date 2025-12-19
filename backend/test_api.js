import axios from 'axios';

const API_KEY = 'sk_5801a6ec5051bf1cf144155ddada51120b2d1dda4d03cb2df454fb4eab9a78a9';
const URL = 'https://multi.paradisepags.com/api/v1/transaction.php';

async function testKey() {
    console.log(`Testando chave: ${API_KEY}`);

    // Payload mínimo exigido (baseado no server.js)
    const payload = {
        amount: 1000, // R$ 10,00
        description: 'Teste de API Key',
        reference: 'TEST-' + Date.now(),
        checkoutUrl: 'http://localhost:3000',
        productHash: 'dig1p',
        customer: {
            name: 'Tester',
            email: 'test@example.com',
            document: '11111111111',
            phone: '11911111111'
        }
    };

    try {
        const response = await axios.post(URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': API_KEY
            }
        });
        console.log('SUCESSO! Status:', response.status);
        console.log('Resposta:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('FALHA (Resposta da API):');
            console.error('Status:', error.response.status);
            console.error('Dados:', error.response.data);
        } else {
            console.error('ERRO DE REDE/CÓDIGO:', error.message);
        }
    }
}

testKey();
