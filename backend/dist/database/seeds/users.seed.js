"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
async function seed() {
    const dataSource = new typeorm_1.DataSource({
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
        const existingAdmin = await queryRunner.query("SELECT id FROM users WHERE email = 'admin@teste.com'");
        const existingUser = await queryRunner.query("SELECT id FROM users WHERE email = 'usuario@teste.com'");
        if (existingAdmin.length === 0) {
            const hashedPassword = await bcrypt.hash('Senha@123', 10);
            await queryRunner.query(`INSERT INTO users (name, email, password, role, balance, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`, ['Administrador Teste', 'admin@teste.com', hashedPassword, 'ADMIN', 1000.00]);
            console.log('✅ Usuário admin criado: admin@teste.com');
        }
        else {
            console.log('ℹ️  Usuário admin já existe: admin@teste.com');
        }
        if (existingUser.length === 0) {
            const hashedPassword = await bcrypt.hash('Senha@123', 10);
            await queryRunner.query(`INSERT INTO users (name, email, password, role, balance, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`, ['Usuário Teste', 'usuario@teste.com', hashedPassword, 'USER', 1000.00]);
            console.log('✅ Usuário normal criado: usuario@teste.com');
        }
        else {
            console.log('ℹ️  Usuário normal já existe: usuario@teste.com');
        }
        await queryRunner.release();
        await dataSource.destroy();
        console.log('🎉 Seed concluído com sucesso!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Erro ao executar seed:', error);
        process.exit(1);
    }
}
seed();
//# sourceMappingURL=users.seed.js.map