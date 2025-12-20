import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const authHeader = request.headers.get('authorization');

        if (!authHeader) {
            return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
        }

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${backendUrl}/gerar-certificado`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: errorText || 'Erro no backend' }, { status: response.status });
        }

        // Encaminha o blob (PDF) de volta para o cliente
        const blob = await response.blob();
        return new NextResponse(blob, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': response.headers.get('Content-Disposition') || 'attachment; filename=certificado.pdf',
            },
        });

    } catch (error: any) {
        console.error('Erro no proxy de certificado:', error);
        return NextResponse.json({ error: 'Falha interna no proxy' }, { status: 500 });
    }
}
