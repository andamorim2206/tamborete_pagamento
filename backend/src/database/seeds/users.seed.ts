import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

config();

async function seed() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        username: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        database: process.env.POSTGRES_DB || 'tamborete_db',
        entities: ['src/**/*.entity.ts'],
        synchronize: false,
    });

    try {
        await dataSource.initialize();
        console.log('📦 Database connection established');

        const queryRunner = dataSource.createQueryRunner();

        // Verificar se os usuários já existem
        const existingAdmin = await queryRunner.query(
            "SELECT id FROM users WHERE email = 'admin@teste.com'"
        );
        const existingUser = await queryRunner.query(
            "SELECT id FROM users WHERE email = 'usuario@teste.com'"
        );

        // Criar usuário admin se não existir
        if (existingAdmin.length === 0) {
            const hashedPassword = await bcrypt.hash('Senha@123', 10);
            await queryRunner.query(
                `INSERT INTO users (name, email, password, role, balance, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
                ['Administrador Teste', 'admin@teste.com', hashedPassword, 'ADMIN', 1000.00]
            );
            console.log('✅ Usuário admin criado: admin@teste.com');
        } else {
            console.log('ℹ️  Usuário admin já existe: admin@teste.com');
        }

        // Criar usuário normal se não existir
        if (existingUser.length === 0) {
            const hashedPassword = await bcrypt.hash('Senha@123', 10);
            await queryRunner.query(
                `INSERT INTO users (name, email, password, role, balance, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
                ['Usuário Teste', 'usuario@teste.com', hashedPassword, 'USER', 1000.00]
            );
            console.log('✅ Usuário normal criado: usuario@teste.com');
        } else {
            console.log('ℹ️  Usuário normal já existe: usuario@teste.com');
        }

        await queryRunner.release();
        await dataSource.destroy();

        console.log('🎉 Seed concluído com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao executar seed:', error);
        process.exit(1);
    }
}

seed();
