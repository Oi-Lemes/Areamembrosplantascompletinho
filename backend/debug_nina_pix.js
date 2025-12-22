import axios from 'axios';

const PARADISE_API_TOKEN = 'sk_5801a6ec5051bf1cf144155ddada51120b2d1dda4d03cb2df454fb4eab9a78a9';
const NINA_HASH = 'prod_0d6f903b6855c714'; // Hash from dashboard/page.tsx
const BASE_AMOUNT = 3700; // 37.00
const PRODUCT_TITLE = 'Chatbot Nina Debug';

const paymentPayload = {
    amount: BASE_AMOUNT,
    description: PRODUCT_TITLE,
    reference: `CKO-DEBUG-NINA-${Date.now()}`,
    checkoutUrl: 'https://debug.local',
    productHash: NINA_HASH,
    orderbump: [],
    customer: {
        name: 'Debug User',
        email: 'debug@test.com',
        document: '42879052882', // Valid CPF
        phone: '11999999999'
    }
};

console.log('--- TESTANDO PIX NINA ---');
console.log('URL: https://multi.paradisepags.com/api/v1/transaction.php');
console.log('Payload:', JSON.stringify(paymentPayload, null, 2));

async function run() {
    try {
        const response = await axios.post('https://multi.paradisepags.com/api/v1/transaction.php', paymentPayload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': PARADISE_API_TOKEN
            }
        });

        console.log('\n--- SUCESSO ---');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('\n--- ERRO ---');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log(error.message);
        }
    }
}

run();
