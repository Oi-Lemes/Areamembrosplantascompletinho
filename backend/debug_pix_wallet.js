
import axios from 'axios';

async function debugPix() {
    // URL da API
    const paradiseUrl = 'https://multi.paradisepags.com/api/v1/transaction.php';
    const apiKey = 'sk_5801a6ec5051bf1cf144155ddada51120b2d1dda4d03cb2df454fb4eab9a78a9'; // Hardcoded in server.js

    // Dados do Produto Carteira
    const productHash = 'prod_375f8ceb7a4cffcc';
    const amount = 2700; // R$ 27,00

    // Geradores de Dados Aleatórios
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

    const randomPhone = () => {
        const ddd = Math.floor(Math.random() * 80) + 11;
        const num = Math.floor(Math.random() * 90000000) + 10000000;
        return `${ddd}9${num}`;
    };

    const randomName = () => {
        const names = ['Ana', 'Bruno', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena'];
        const surnames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Lima', 'Ferreira', 'Costa'];
        return `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;
    };

    const cpf = randomCPF();
    const phone = randomPhone();
    const name = randomName();
    const email = `teste.pagamento.${Date.now()}@gmail.com`;

    // Shipping Dummy Strategy
    const shippingObj = {
        name: name,
        price: 1500, // R$ 15,00 (Teste de Frete Pago)
        address: {
            street: 'Rua Principal',
            street_number: Math.floor(Math.random() * 1000).toString(),
            neighborhood: 'Centro',
            city: 'Sao Paulo',
            state: 'SP',
            zipcode: '01001000'
        }
    };

    const payload = {
        amount: 3639, // R$ 36,39 Correct Amount
        description: 'Taxa de Emissao Digital',
        reference: `DEBUG-${Date.now()}`,
        checkoutUrl: 'https://areamembros.saberesdafloresta.site',
        productHash: productHash,
        customer: {
            name: name,
            email: email,
            document: cpf,
            phone: phone
        },
        // shipping: shippingObj, // REMOVED SHIPING
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
