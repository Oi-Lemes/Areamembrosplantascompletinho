import axios from 'axios';

async function testPlans() {
    const url = 'http://localhost:3001/webhook/paradise';

    const events = [
        {
            name: "Compra de Plano BÁSICO",
            payload: {
                event: "purchase.approved",
                product: { hash: "prod_372117ff2ba365a1", offer_hash: "9b7d69dcb4" },
                client: {
                    name: "Teste Básico",
                    email: "basico@teste.com",
                    phone: "5511999990001",
                    cpf: "00000000001"
                }
            }
        },
        {
            name: "Compra de Plano PREMIUM",
            payload: {
                event: "purchase.approved",
                product: { hash: "prod_372117ff2ba365a1", offer_hash: "6adf6a54a5" },
                client: {
                    name: "Teste Premium",
                    email: "premium@teste.com",
                    phone: "5511999990002",
                    cpf: "00000000002"
                }
            }
        },
        {
            name: "Upgrade: Básico -> Premium",
            payload: {
                event: "purchase.approved",
                product: { hash: "prod_372117ff2ba365a1", offer_hash: "6adf6a54a5" },
                client: {
                    name: "Teste Básico Upgraded",
                    email: "basico@teste.com",
                    phone: "5511999990001", // Mesmo telefone do básico
                    cpf: "00000000001"
                }
            }
        }
    ];

    for (const test of events) {
        console.log(`\n--- Testando: ${test.name} ---`);
        try {
            const res = await axios.post(url, test.payload);
            console.log(`Status: ${res.status} | Resposta: ${res.data}`);
        } catch (error) {
            console.error(`Erro: ${error.message}`);
            if (error.code) console.error(`Code: ${error.code}`);
            if (error.response) console.error(`Response: ${JSON.stringify(error.response.data)}`);
        }
    }
}

testPlans();
