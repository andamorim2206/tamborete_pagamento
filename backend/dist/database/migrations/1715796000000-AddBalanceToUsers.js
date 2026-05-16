"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddBalanceToUsers1715796000000 = void 0;
const typeorm_1 = require("typeorm");
class AddBalanceToUsers1715796000000 {
    async up(queryRunner) {
        await queryRunner.addColumn('users', new typeorm_1.TableColumn({
            name: 'balance',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 1000.00,
            isNullable: false,
            comment: 'Saldo disponível do usuário em reais',
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('users', 'balance');
    }
}
exports.AddBalanceToUsers1715796000000 = AddBalanceToUsers1715796000000;
//# sourceMappingURL=1715796000000-AddBalanceToUsers.js.map