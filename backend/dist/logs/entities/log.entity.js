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
exports.Log = void 0;
const typeorm_1 = require("typeorm");
const log_type_enum_1 = require("../enums/log-type.enum");
let Log = class Log {
    id;
    typeLog;
    statusCode;
    message;
    userId;
    transactionId;
    metadata;
    createdAt;
};
exports.Log = Log;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Log.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'type_log',
        type: 'varchar',
        length: 100,
        comment: 'Tipo de log: USER_CREATED, USER_LOGIN, TRANSACTION_CREATED, etc.',
    }),
    __metadata("design:type", String)
], Log.prototype, "typeLog", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'status_code',
        type: 'int',
        nullable: true,
        comment: 'Status code HTTP retornado',
    }),
    __metadata("design:type", Number)
], Log.prototype, "statusCode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
        comment: 'Mensagem de erro ou sucesso',
    }),
    __metadata("design:type", String)
], Log.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'user_id',
        type: 'uuid',
        nullable: true,
        comment: 'ID do usuário relacionado ao log',
    }),
    __metadata("design:type", String)
], Log.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'transaction_id',
        type: 'uuid',
        nullable: true,
        comment: 'ID da transação relacionada ao log',
    }),
    __metadata("design:type", String)
], Log.prototype, "transactionId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        nullable: true,
        comment: 'Dados adicionais do log',
    }),
    __metadata("design:type", Object)
], Log.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        name: 'created_at',
        type: 'timestamp',
        comment: 'Data e hora de criação do log',
    }),
    __metadata("design:type", Date)
], Log.prototype, "createdAt", void 0);
exports.Log = Log = __decorate([
    (0, typeorm_1.Entity)('logs')
], Log);
//# sourceMappingURL=log.entity.js.map