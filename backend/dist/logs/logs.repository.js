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
exports.LogsRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const log_entity_1 = require("./entities/log.entity");
let LogsRepository = class LogsRepository {
    logsRepository;
    constructor(logsRepository) {
        this.logsRepository = logsRepository;
    }
    async create(createLogDto) {
        const log = this.logsRepository.create(createLogDto);
        return await this.logsRepository.save(log);
    }
    async findById(id) {
        return await this.logsRepository.findOne({ where: { id } });
    }
    async findAllWithPagination(page, limit) {
        const skip = (page - 1) * limit;
        const [data, total] = await this.logsRepository.findAndCount({
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });
        return { data, total };
    }
    async findByUserId(userId) {
        return await this.logsRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }
    async findByTransactionId(transactionId) {
        return await this.logsRepository.find({
            where: { transactionId },
            order: { createdAt: 'DESC' },
        });
    }
};
exports.LogsRepository = LogsRepository;
exports.LogsRepository = LogsRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(log_entity_1.Log)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], LogsRepository);
//# sourceMappingURL=logs.repository.js.map