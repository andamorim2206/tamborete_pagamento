"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserTokensTable1715794000000 = void 0;
const typeorm_1 = require("typeorm");
class CreateUserTokensTable1715794000000 {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'user_tokens',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: 'uuid_generate_v4()',
                },
                {
                    name: 'user_id',
                    type: 'uuid',
                    isNullable: false,
                },
                {
                    name: 'token',
                    type: 'text',
                    isNullable: false,
                },
                {
                    name: 'expires_at',
                    type: 'timestamp',
                    isNullable: false,
                },
                {
                    name: 'active',
                    type: 'boolean',
                    default: true,
                },
                {
                    name: 'created_at',
                    type: 'timestamp',
                    default: 'now()',
                },
            ],
        }), true);
        await queryRunner.createForeignKey('user_tokens', new typeorm_1.TableForeignKey({
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
        }));
        await queryRunner.query(`CREATE INDEX idx_user_tokens_user_id ON user_tokens(user_id)`);
        await queryRunner.query(`CREATE INDEX idx_user_tokens_active ON user_tokens(active)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX idx_user_tokens_active`);
        await queryRunner.query(`DROP INDEX idx_user_tokens_user_id`);
        await queryRunner.dropTable('user_tokens');
    }
}
exports.CreateUserTokensTable1715794000000 = CreateUserTokensTable1715794000000;
//# sourceMappingURL=1715794000000-CreateUserTokensTable.js.map