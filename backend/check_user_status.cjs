
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    const phone = '11932786835';
    console.log(`Checking for user with phone: ${phone}`);

    try {
        const user = await prisma.user.findFirst({
            where: {
                phone: {
                    contains: '932786835'
                }
            }
        });

        if (user) {
            console.log('User found:', user);
        } else {
            console.log('User NOT found.');
            // List all users to see if it was saved differently
            const count = await prisma.user.count();
            console.log(`Total users in DB: ${count}`);
        }
    } catch (error) {
        console.error('Error querying DB:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
