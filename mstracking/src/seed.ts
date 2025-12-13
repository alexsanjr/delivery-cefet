import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [],
    synchronize: false,
});

async function seed() {
    console.log('Starting database cleanup...');

    try {
        await AppDataSource.initialize();
        console.log('Database connection established');
        await AppDataSource.query('DELETE FROM tracking_positions');
        console.log('Deleted all tracking_positions');
        await AppDataSource.query('DELETE FROM delivery_tracking');
        console.log('Deleted all delivery_tracking');
        console.log('Database cleanup completed successfully!');
    } catch (error) {
        console.error('Error during seed:', error);
        process.exit(1);
    } finally {
        await AppDataSource.destroy();
    }
}
seed();
