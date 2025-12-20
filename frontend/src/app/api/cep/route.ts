import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const cep = searchParams.get('cep');

    if (!cep || cep.length !== 8) {
        return NextResponse.json({ error: 'CEP inválido' }, { status: 400 });
    }

    try {
        // Tentativa 1: BrasilAPI
        const res1 = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
        if (res1.ok) {
            const data = await res1.json();
            return NextResponse.json({
                street: data.street,
                neighborhood: data.neighborhood,
                city: data.city,
                state: data.state
            });
        }
    } catch (e) {
        console.error("BrasilAPI falhou", e);
    }

    try {
        // Tentativa 2: ViaCEP
        const res2 = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (res2.ok) {
            const data = await res2.json();
            if (!data.erro) {
                return NextResponse.json({
                    street: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf
                });
            }
        }
    } catch (e) {
        console.error("ViaCEP falhou", e);
    }

    return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 });
}
