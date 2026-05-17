"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateLogsTable1747527000000 = void 0;
const typeorm_1 = require("typeorm");
class CreateLogsTable1747527000000 {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'logs',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: 'uuid_generate_v4()',
                },
                {
                    name: 'type_log',
                    type: 'varchar',
                    length: '100',
                    comment: 'Tipo de log: USER_CREATED, USER_LOGIN, TRANSACTION_CREATED, etc.',
                },
                {
                    name: 'status_code',
                    type: 'int',
                    isNullable: true,
                    comment: 'Status code HTTP retornado',
                },
                {
                    name: 'message',
                    type: 'text',
                    isNullable: true,
                    comment: 'Mensagem de erro ou sucesso',
                },
                {
                    name: 'user_id',
                    type: 'uuid',
                    isNullable: true,
                    comment: 'ID do usuário relacionado ao log',
                },
                {
                    name: 'transaction_id',
                    type: 'uuid',
                    isNullable: true,
                    comment: 'ID da transação relacionada ao log',
                },
                {
                    name: 'metadata',
                    type: 'jsonb',
                    isNullable: true,
                    comment: 'Dados adicionais do log',
                },
                {
                    name: 'created_at',
                    type: 'timestamp',
                    default: 'CURRENT_TIMESTAMP',
                    comment: 'Data e hora de criação do log',
                },
            ],
        }), true);
        await queryRunner.query(`
      CREATE INDEX idx_logs_type_log ON logs(type_log);
    `);
        await queryRunner.query(`
      CREATE INDEX idx_logs_user_id ON logs(user_id);
    `);
        await queryRunner.query(`
      CREATE INDEX idx_logs_transaction_id ON logs(transaction_id);
    `);
        await queryRunner.query(`
      CREATE INDEX idx_logs_created_at ON logs(created_at DESC);
    `);
    }
    async down(queryRunner) {
        await queryRunner.dropTable('logs');
    }
}
exports.CreateLogsTable1747527000000 = CreateLogsTable1747527000000;
//# sourceMappingURL=1747527000000-CreateLogsTable.js.map