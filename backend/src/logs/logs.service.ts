import { Injectable, NotFoundException } from '@nestjs/common';
import { LogsRepository } from './logs.repository';
import { CreateLogDto } from './dto/create-log.dto';
import { LogResponseDto } from './dto/log-response.dto';
import { PaginatedLogsResponseDto } from './dto/paginated-logs-response.dto';
import { LogType } from './enums/log-type.enum';

@Injectable()
export class LogsService {
    constructor(private readonly logsRepository: LogsRepository) { }

    async createLog(createLogDto: CreateLogDto): Promise<LogResponseDto> {
        try {
            const log = await this.logsRepository.create(createLogDto);
            return LogResponseDto.fromEntity(log);
        } catch (error) {
            console.error('Erro ao criar log:', error);
            throw error;
        }
    }

    async findAll(page: number = 1, limit: number = 10): Promise<PaginatedLogsResponseDto> {
        const { data, total } = await this.logsRepository.findAllWithPagination(page, limit);
        const logsDto = data.map((log) => LogResponseDto.fromEntity(log));
        return new PaginatedLogsResponseDto(logsDto, total, page, limit);
    }

    async findById(id: string): Promise<LogResponseDto> {
        const log = await this.logsRepository.findById(id);
        if (!log) {
            throw new NotFoundException(`Log com ID ${id} não encontrado`);
        }
        return LogResponseDto.fromEntity(log);
    }

    async findByTransactionId(transactionId: string): Promise<LogResponseDto[]> {
        const logs = await this.logsRepository.findByTransactionId(transactionId);
        return logs.map((log) => LogResponseDto.fromEntity(log));
    }

    // Métodos auxiliares para criar logs específicos
    async logUserCreated(userId: string, statusCode: number, message?: string): Promise<void> {
        await this.createLog({
            typeLog: LogType.USER_CREATED,
            statusCode,
            message: message || 'Usuário criado com sucesso',
            userId,
        });
    }

    async logUserLogin(userId: string, statusCode: number, email: string): Promise<void> {
        await this.createLog({
            typeLog: LogType.USER_LOGIN,
            statusCode,
            message: `Login realizado com sucesso para ${email}`,
            userId,
            metadata: { email },
        });
    }

    async logTransactionCreated(transactionId: string, userId: string, statusCode: number): Promise<void> {
        await this.createLog({
            typeLog: LogType.TRANSACTION_CREATED,
            statusCode,
            message: 'Transação criada e enviada para processamento',
            userId,
            transactionId,
        });
    }

    async logTransactionProcessing(transactionId: string, userId: string): Promise<void> {
        await this.createLog({
            typeLog: LogType.TRANSACTION_PROCESSING,
            statusCode: 200,
            message: 'Transação em processamento',
            userId,
            transactionId,
        });
    }

    async logTransactionCompleted(transactionId: string, userId: string): Promise<void> {
        await this.createLog({
            typeLog: LogType.TRANSACTION_COMPLETED,
            statusCode: 200,
            message: 'Transação concluída com sucesso',
            userId,
            transactionId,
        });
    }

    async logTransactionFailed(transactionId: string, userId: string, error: string): Promise<void> {
        await this.createLog({
            typeLog: LogType.TRANSACTION_FAILED,
            statusCode: 500,
            message: `Transação falhou: ${error}`,
            userId,
            transactionId,
            metadata: { error },
        });
    }

    async logRabbitMQError(error: string, metadata?: Record<string, any>): Promise<void> {
        await this.createLog({
            typeLog: LogType.RABBITMQ_ERROR,
            statusCode: 500,
            message: `Erro no RabbitMQ: ${error}`,
            metadata,
        });
    }

    async logRabbitMQSuccess(message: string, metadata?: Record<string, any>): Promise<void> {
        await this.createLog({
            typeLog: LogType.RABBITMQ_SUCCESS,
            statusCode: 200,
            message: `RabbitMQ: ${message}`,
            metadata,
        });
    }

    async logError(error: string, statusCode: number = 500, metadata?: Record<string, any>): Promise<void> {
        await this.createLog({
            typeLog: LogType.ERROR,
            statusCode,
            message: error,
            metadata,
        });
    }

    // Método específico para capturar erros com stack trace completo
    async logErrorWithStack(
        error: Error | any,
        context: string,
        userId?: string,
        additionalData?: Record<string, any>,
    ): Promise<void> {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const stackTrace = error instanceof Error ? error.stack : undefined;

        await this.createLog({
            typeLog: LogType.ERROR,
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
}
