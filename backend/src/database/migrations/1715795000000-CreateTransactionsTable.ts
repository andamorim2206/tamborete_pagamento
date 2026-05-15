import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTransactionsTable1715795000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Criar enum para payment_method
        await queryRunner.query(`
            CREATE TYPE payment_method_enum AS ENUM ('PIX', 'CARTAO_DE_CREDITO')
        `);

        // Criar enum para status
        await queryRunner.query(`
            CREATE TYPE transaction_status_enum AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')
        `);

        // Criar tabela transactions
        await queryRunner.createTable(
            new Table({
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
            }),
            true,
        );

        // Criar foreign key para sender_id
        await queryRunner.createForeignKey(
            'transactions',
            new TableForeignKey({
                columnNames: ['sender_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        // Criar foreign key para receiver_id
        await queryRunner.createForeignKey(
            'transactions',
            new TableForeignKey({
                columnNames: ['receiver_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        // Criar índices para melhorar performance
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

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover índices
        await queryRunner.query(`DROP INDEX idx_transactions_status`);
        await queryRunner.query(`DROP INDEX idx_transactions_receiver_id`);
        await queryRunner.query(`DROP INDEX idx_transactions_sender_id`);

        // Remover tabela (foreign keys são removidas automaticamente)
        await queryRunner.dropTable('transactions');

        // Remover enums
        await queryRunner.query(`DROP TYPE transaction_status_enum`);
        await queryRunner.query(`DROP TYPE payment_method_enum`);
    }
}
