
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TARGET_PHONE = '11920001134';

async function resetProgress() {
    try {
        console.log(`🔍 Buscando usuário com telefone: ${TARGET_PHONE}...`);

        const user = await prisma.user.findUnique({
            where: { phone: TARGET_PHONE }
        });

        if (!user) {
            console.error('❌ Usuário não encontrado!');
            return;
        }

        console.log(`👤 Usuário encontrado: ${user.name || 'Sem nome'} (ID: ${user.id})`);

        const deleted = await prisma.progresso.deleteMany({
            where: { userId: user.id }
        });

        console.log(`✅ Sucesso! ${deleted.count} registros de progresso foram apagados.`);
        console.log('🔄 O histórico do usuário foi resetado.');

    } catch (error) {
        console.error('❌ Erro ao resetar progresso:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetProgress();
