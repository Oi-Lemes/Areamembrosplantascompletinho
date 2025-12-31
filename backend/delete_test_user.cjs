
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteUser() {
    const phoneRaw = '11932786835';
    const phoneBR = '5511932786835';

    console.log(`Attempting to delete user with phone: ${phoneRaw} OR ${phoneBR}`);

    try {
        // Primeiro, apagar progresso (se houver relação) - O Cascade deve cuidar disso, mas por segurança:
        // Na verdade o schema não tem Cascade explicito em todos, vamos deletar o User direto e ver.
        // Se der erro de Foreign Key, teremos que apagar o progresso primeiro.

        // Buscar IDs primeiro para logar
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { phone: phoneRaw },
                    { phone: phoneBR },
                    { phone: { contains: '932786835' } } // Busca genérica por segurança
                ]
            }
        });

        if (users.length === 0) {
            console.log('Nenhum usuário encontrado para deletar.');
            return;
        }

        console.log(`Encontrados ${users.length} usuários(s). Deletando...`, users);

        for (const user of users) {
            // Apagar progresso desse user
            await prisma.progresso.deleteMany({
                where: { userId: user.id }
            });
            console.log(`Progresso deletado para User ID ${user.id}`);

            // Apagar User
            await prisma.user.delete({
                where: { id: user.id }
            });
            console.log(`Usuário deletado: ${user.name} (${user.phone})`);
        }

        console.log('Limpeza concluída com sucesso!');

    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteUser();
