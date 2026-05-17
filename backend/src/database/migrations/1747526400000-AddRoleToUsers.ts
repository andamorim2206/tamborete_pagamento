import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRoleToUsers1747526400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adicionar coluna role na tabela users
        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'role',
                type: 'varchar',
                length: '50',
                default: "'USER'",
                isNullable: false,
            }),
        );

        // Atualizar usuários existentes para USER (se houver)
        await queryRunner.query(`
            UPDATE users SET role = 'USER' WHERE role IS NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('users', 'role');
    }
}
