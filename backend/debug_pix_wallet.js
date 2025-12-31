
import axios from 'axios';

async function debugPix() {
    // URL da API
    const paradiseUrl = 'https://multi.paradisepags.com/api/v1/transaction.php';
    const apiKey = 'sk_5801a6ec5051bf1cf144155ddada51120b2d1dda4d03cb2df454fb4eab9a78a9'; // Hardcoded in server.js

    // Dados do Produto LIVE (Teste Comparativo)
    const productHash = 'prod_cb02db3516be7ede'; // Live Hash
    const amount = 6700; // R$ 67,00

    // Gerar dados aleatórios para evitar Compliance/Fraude
    const randomCPF = () => {
        const rnd = (n) => Math.round(Math.random() * n);
        const mod = (base, div) => Math.round(base - Math.floor(base / div) * div);
        const n = Array(9).fill(0).map(() => rnd(9));
        let d1 = n.reduce((total, number, index) => total + (number * (10 - index)), 0);
        d1 = 11 - mod(d1, 11);
        if (d1 >= 10) d1 = 0;
        let d2 = n.reduce((total, number, index) => total + (number * (11 - index)), 0) + (d1 * 2);
        d2 = 11 - mod(d2, 11);
        if (d2 >= 10) d2 = 0;
        return `${n.join('')}${d1}${d2}`;
    };

    const cpf = randomCPF();
    const email = `debug.user.${Date.now()}@test.com`;

    const payload = {
        amount: amount,
        description: 'DEBUG Carteira ABRATH',
        reference: `DEBUG-${Date.now()}`,
        checkoutUrl: 'https://areamembros.saberesdafloresta.site',
        productHash: productHash,
        customer: {
            name: 'Debug User Random',
            email: email,
            document: cpf,
            phone: '11999999999'
        },
        orderbump: []
    };

    console.log('Enviando payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await axios.post(paradiseUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': apiKey
            }
        });

        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        if (error.response) {
            console.error('API Error Status:', error.response.status);
            console.error('API Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Connection Error:', error.message);
        }
    }
}

debugPix();
