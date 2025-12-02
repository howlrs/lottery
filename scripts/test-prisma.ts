import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Connecting...');
    await prisma.$connect();
    console.log('Connected!');
    const rewards = await prisma.reward.findMany();
    console.log('Rewards:', rewards);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
