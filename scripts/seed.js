const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Clean up
    await prisma.winLog.deleteMany({});
    await prisma.reward.deleteMany({});
    await prisma.event.deleteMany({});

    // Create a default event
    const event = await prisma.event.create({
        data: {
            title: 'Welcome Lottery',
            slug: 'welcome',
            description: 'Participate and win amazing prizes!',
            is_active: true,
        }
    });
    console.log('Created Event:', event.id);

    // Create Win Reward
    const win = await prisma.reward.create({
        data: {
            event_id: event.id,
            name: 'Grand Prize',
            value: 1000,
            count: 100,
            probability: 50,
            is_lose: false,
            description: 'A shiny new token'
        }
    });
    console.log('Created Win Reward:', win.id);

    // Create Lose Reward
    const lose = await prisma.reward.create({
        data: {
            event_id: event.id,
            name: 'Better luck next time',
            value: 0,
            count: 100,
            probability: 50,
            is_lose: true
        }
    });
    console.log('Created Lose Reward:', lose.id);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
