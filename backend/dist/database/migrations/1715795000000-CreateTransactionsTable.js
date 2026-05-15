"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTransactionsTable1715795000000 = void 0;
const typeorm_1 = require("typeorm");
class CreateTransactionsTable1715795000000 {
    async up(queryRunner) {
        await queryRunner.query(`
            CREATE TYPE payment_method_enum AS ENUM ('PIX', 'CARTAO_DE_CREDITO')
        `);
        await queryRunner.query(`
            CREATE TYPE transaction_status_enum AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')
        `);
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'transactions',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: 'uuid_generate_v4()',
                },
                {
                    name: 'sender_id',
                    type: 'uuid',
                    isNullable: false,
                },
                {
                    name: 'receiver_id',
                    type: 'uuid',
                    isNullable: false,
                },
                {
                    name: 'amount',
                    type: 'decimal',
                    precision: 10,
                    scale: 2,
                    isNullable: false,
                },
                {
                    name: 'payment_method',
                    type: 'payment_method_enum',
                    isNullable: false,
                },
                {
                    name: 'status',
                    type: 'transaction_status_enum',
                    default: "'PENDING'",
                },
                {
                    name: 'created_at',
                    type: 'timestamp',
                    default: 'now()',
                },
            ],
        }), true);
        await queryRunner.createForeignKey('transactions', new typeorm_1.TableForeignKey({
            columnNames: ['sender_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
        }));
        await queryRunner.createForeignKey('transactions', new typeorm_1.TableForeignKey({
            columnNames: ['receiver_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
        }));
        await queryRunner.query(`
            CREATE INDEX idx_transactions_sender_id ON transactions(sender_id)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_transactions_receiver_id ON transactions(receiver_id)
        `);
        await queryRunner.query(`
            CREATE INDEX idx_transactions_status ON transactions(status)
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX idx_transactions_status`);
        await queryRunner.query(`DROP INDEX idx_transactions_receiver_id`);
        await queryRunner.query(`DROP INDEX idx_transactions_sender_id`);
        await queryRunner.dropTable('transactions');
        await queryRunner.query(`DROP TYPE transaction_status_enum`);
        await queryRunner.query(`DROP TYPE payment_method_enum`);
    }
}
exports.CreateTransactionsTable1715795000000 = CreateTransactionsTable1715795000000;
//# sourceMappingURL=1715795000000-CreateTransactionsTable.js.map