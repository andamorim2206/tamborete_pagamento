"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTransactionDto = void 0;
const class_validator_1 = require("class-validator");
const payment_method_enum_1 = require("../enums/payment-method.enum");
class CreateTransactionDto {
    receiverEmail;
    amount;
    paymentMethod;
}
exports.CreateTransactionDto = CreateTransactionDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'O email do destinatário é obrigatório' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Email do destinatário inválido' }),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "receiverEmail", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'O valor é obrigatório' }),
    (0, class_validator_1.IsNumber)({}, { message: 'O valor deve ser um número' }),
    (0, class_validator_1.IsPositive)({ message: 'O valor deve ser positivo' }),
    __metadata("design:type", Number)
], CreateTransactionDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'O método de pagamento é obrigatório' }),
    (0, class_validator_1.IsEnum)(payment_method_enum_1.PaymentMethod, {
        message: 'Método de pagamento inválido. Use: PIX ou CARTAO_DE_CREDITO',
    }),
    __metadata("design:type", String)
], CreateTransactionDto.prototype, "paymentMethod", void 0);
//# sourceMappingURL=create-transaction.dto.js.map