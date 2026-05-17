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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transaction_entity_1 = require("./entities/transaction.entity");
let TransactionsRepository = class TransactionsRepository {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async create(transactionData) {
        const transaction = this.repository.create(transactionData);
        return this.repository.save(transaction);
    }
    async findAll() {
        return this.repository.find({
            relations: ['sender', 'receiver'],
            order: { createdAt: 'DESC' },
        });
    }
    async findAllWithPagination(page, limit) {
        const skip = (page - 1) * limit;
        const [data, total] = await this.repository
            .createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.sender', 'sender')
            .leftJoinAndSelect('transaction.receiver', 'receiver')
            .orderBy('transaction.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        return { data, total };
    }
    async findById(id) {
        return this.repository.findOne({
            where: { id },
            relations: ['sender', 'receiver'],
        });
    }
    async findBySenderId(senderId) {
        return this.repository.find({
            where: { senderId },
            relations: ['sender', 'receiver'],
            order: { createdAt: 'DESC' },
        });
    }
    async findByReceiverId(receiverId) {
        return this.repository.find({
            where: { receiverId },
            relations: ['sender', 'receiver'],
            order: { createdAt: 'DESC' },
        });
    }
    async findByUserId(userId) {
        return this.repository
            .createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.sender', 'sender')
            .leftJoinAndSelect('transaction.receiver', 'receiver')
            .where('transaction.senderId = :userId OR transaction.receiverId = :userId', { userId })
            .orderBy('transaction.createdAt', 'DESC')
            .getMany();
    }
    async findByUserIdWithPagination(userId, page, limit) {
        const skip = (page - 1) * limit;
        const [data, total] = await this.repository
            .createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.sender', 'sender')
            .leftJoinAndSelect('transaction.receiver', 'receiver')
            .where('transaction.senderId = :userId OR transaction.receiverId = :userId', { userId })
            .orderBy('transaction.createdAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        return { data, total };
    }
    async updateStatus(id, status) {
        await this.repository.update(id, { status });
    }
};
exports.TransactionsRepository = TransactionsRepository;
exports.TransactionsRepository = TransactionsRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TransactionsRepository);
//# sourceMappingURL=transactions.repository.js.map