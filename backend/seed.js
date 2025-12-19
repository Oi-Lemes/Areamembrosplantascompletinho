import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Criar Módulo 1
    const mod1 = await prisma.modulo.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            nome: 'Módulo 1: Introdução',
            description: 'Boas-vindas e primeiros passos',
            ordem: 1,
            aulas: {
                create: [
                    { nome: 'Aula 1: Boas-vindas', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', ordem: 1 },
                    { nome: 'Aula 2: Como funciona o curso', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', ordem: 2 },
                ]
            }
        }
    });

    // Criar Módulo 2
    const mod2 = await prisma.modulo.upsert({
        where: { id: 2 },
        update: {},
        create: {
            id: 2,
            nome: 'Módulo 2: Fundamentos',
            description: 'Conceitos base da fitoterapia',
            ordem: 2,
            aulas: {
                create: [
                    { nome: 'Aula 1: O que é Fitoterapia', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', ordem: 1 },
                    { nome: 'Aula 2: História das Plantas', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', ordem: 2 },
                    { nome: 'Aula 3: Segurança e Dosagem', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', ordem: 3 },
                ]
            }
        }
    });

    // Criar Módulo 3
    const mod3 = await prisma.modulo.upsert({
        where: { id: 3 },
        update: {},
        create: {
            id: 3,
            nome: 'Módulo 3: Identificação de Plantas',
            description: 'Como reconhecer as principais espécies',
            ordem: 3,
            aulas: {
                create: [
                    { nome: 'Aula 1: Morfologia Vegetal', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', ordem: 1 },
                    { nome: 'Aula 2: Guia de Campo', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', ordem: 2 },
                ]
            }
        }
    });

    // Criar Módulo 4
    const mod4 = await prisma.modulo.upsert({
        where: { id: 4 },
        update: {},
        create: {
            id: 4,
            nome: 'Módulo 4: Preparo de Chás',
            description: 'Infusão, Decocção e Maceração',
            ordem: 4,
            aulas: {
                create: [
                    { nome: 'Aula 1: Tipos de Preparo', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', ordem: 1 },
                    { nome: 'Aula 2: Utensílios Necessários', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', ordem: 2 },
                ]
            }
        }
    });

    // Criar Módulo 5
    const mod5 = await prisma.modulo.upsert({
        where: { id: 5 },
        update: {},
        create: {
            id: 5,
            nome: 'Módulo 5: Tinturas e Extratos',
            description: 'Extraindo princípios ativos',
            ordem: 5,
            aulas: {
                create: [
                    { nome: 'Aula 1: O que são Tinturas', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', ordem: 1 },
                    { nome: 'Aula 2: Fazendo sua primeira tintura', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', ordem: 2 },
                ]
            }
        }
    });

    // Criar Módulo 6
    const mod6 = await prisma.modulo.upsert({
        where: { id: 6 },
        update: {},
        create: {
            id: 6,
            nome: 'Módulo 6: Pomadas e Unguentos',
            description: 'Uso tópico de ervas',
            ordem: 6,
            aulas: {
                create: [
                    { nome: 'Aula 1: Bases para Pomadas', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', ordem: 1 },
                ]
            }
        }
    });


    console.log('✅ Seeding complete!');
    console.log(`Created Module 1: ${mod1.nome}`);
    console.log(`Created Module 2: ${mod2.nome}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
