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
exports.LogsService = void 0;
const common_1 = require("@nestjs/common");
const logs_repository_1 = require("./logs.repository");
const log_response_dto_1 = require("./dto/log-response.dto");
const paginated_logs_response_dto_1 = require("./dto/paginated-logs-response.dto");
const log_type_enum_1 = require("./enums/log-type.enum");
let LogsService = class LogsService {
    logsRepository;
    constructor(logsRepository) {
        this.logsRepository = logsRepository;
    }
    async createLog(createLogDto) {
        try {
            const log = await this.logsRepository.create(createLogDto);
            return log_response_dto_1.LogResponseDto.fromEntity(log);
        }
        catch (error) {
            console.error('Erro ao criar log:', error);
            throw error;
        }
    }
    async findAll(page = 1, limit = 10) {
        const { data, total } = await this.logsRepository.findAllWithPagination(page, limit);
        const logsDto = data.map((log) => log_response_dto_1.LogResponseDto.fromEntity(log));
        return new paginated_logs_response_dto_1.PaginatedLogsResponseDto(logsDto, total, page, limit);
    }
    async findById(id) {
        const log = await this.logsRepository.findById(id);
        if (!log) {
            throw new common_1.NotFoundException(`Log com ID ${id} não encontrado`);
        }
        return log_response_dto_1.LogResponseDto.fromEntity(log);
    }
    async findByTransactionId(transactionId) {
        const logs = await this.logsRepository.findByTransactionId(transactionId);
        return logs.map((log) => log_response_dto_1.LogResponseDto.fromEntity(log));
    }
    async logUserCreated(userId, statusCode, message) {
        await this.createLog({
            typeLog: log_type_enum_1.LogType.USER_CREATED,
            statusCode,
            message: message || 'Usuário criado com sucesso',
            userId,
        });
    }
    async logUserLogin(userId, statusCode, email) {
        await this.createLog({
            typeLog: log_type_enum_1.LogType.USER_LOGIN,
            statusCode,
            message: `Login realizado com sucesso para ${email}`,
            userId,
            metadata: { email },
        });
    }
    async logTransactionCreated(transactionId, userId, statusCode) {
        await this.createLog({
            typeLog: log_type_enum_1.LogType.TRANSACTION_CREATED,
            statusCode,
            message: 'Transação criada e enviada para processamento',
            userId,
            transactionId,
        });
    }
    async logTransactionProcessing(transactionId, userId) {
        await this.createLog({
            typeLog: log_type_enum_1.LogType.TRANSACTION_PROCESSING,
            statusCode: 200,
            message: 'Transação em processamento',
            userId,
            transactionId,
        });
    }
    async logTransactionCompleted(transactionId, userId) {
        await this.createLog({
            typeLog: log_type_enum_1.LogType.TRANSACTION_COMPLETED,
            statusCode: 200,
            message: 'Transação concluída com sucesso',
            userId,
            transactionId,
        });
    }
    async logTransactionFailed(transactionId, userId, error) {
        await this.createLog({
            typeLog: log_type_enum_1.LogType.TRANSACTION_FAILED,
            statusCode: 500,
            message: `Transação falhou: ${error}`,
            userId,
            transactionId,
            metadata: { error },
        });
    }
    async logRabbitMQError(error, metadata) {
        await this.createLog({
            typeLog: log_type_enum_1.LogType.RABBITMQ_ERROR,
            statusCode: 500,
            message: `Erro no RabbitMQ: ${error}`,
            metadata,
        });
    }
    async logRabbitMQSuccess(message, metadata) {
        await this.createLog({
            typeLog: log_type_enum_1.LogType.RABBITMQ_SUCCESS,
            statusCode: 200,
            message: `RabbitMQ: ${message}`,
            metadata,
        });
    }
    async logError(error, statusCode = 500, metadata) {
        await this.createLog({
            typeLog: log_type_enum_1.LogType.ERROR,
            statusCode,
            message: error,
            metadata,
        });
    }
    async logErrorWithStack(error, context, userId, additionalData) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const stackTrace = error instanceof Error ? error.stack : undefined;
        await this.createLog({
            typeLog: log_type_enum_1.LogType.ERROR,
            statusCode: 500,
            message: `[${context}] ${errorMessage}`,
            userId,
            metadata: {
                context,
                errorName: error?.name || 'Error',
                errorMessage,
                stackTrace,
                timestamp: new Date().toISOString(),
                ...additionalData,
            },
        });
    }
};
exports.LogsService = LogsService;
exports.LogsService = LogsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [logs_repository_1.LogsRepository])
], LogsService);
//# sourceMappingURL=logs.service.js.map