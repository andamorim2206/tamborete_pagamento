"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddRoleToUsers1747526400000 = void 0;
const typeorm_1 = require("typeorm");
class AddRoleToUsers1747526400000 {
    async up(queryRunner) {
        await queryRunner.addColumn('users', new typeorm_1.TableColumn({
            name: 'role',
            type: 'varchar',
            length: '50',
            default: "'USER'",
            isNullable: false,
        }));
        await queryRunner.query(`
            UPDATE users SET role = 'USER' WHERE role IS NULL;
        `);
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('users', 'role');
    }
}
exports.AddRoleToUsers1747526400000 = AddRoleToUsers1747526400000;
//# sourceMappingURL=1747526400000-AddRoleToUsers.js.map