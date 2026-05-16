import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * MIGRATION: Adicionar campo balance (saldo) na tabela users
 * 
 * Por quê?
 * - Cada usuário precisa ter um saldo para fazer transações
 * - Saldo inicial: R$ 1.000,00
 * - Tipo: DECIMAL(10,2) para armazenar valores monetários com precisão
 * 
 * Exemplo:
 * - Usuário novo: balance = 1000.00
 * - Após enviar R$ 50: balance = 950.00
 * - Após receber R$ 100: balance = 1050.00
 */
export class AddBalanceToUsers1715796000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'balance',
                type: 'decimal',
                precision: 10,
                scale: 2,
                default: 1000.00,
                isNullable: false,
                comment: 'Saldo disponível do usuário em reais',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('users', 'balance');
    }
}
