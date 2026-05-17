import { LogsRepository } from './logs.repository';
import { CreateLogDto } from './dto/create-log.dto';
import { LogResponseDto } from './dto/log-response.dto';
import { PaginatedLogsResponseDto } from './dto/paginated-logs-response.dto';
export declare class LogsService {
    private readonly logsRepository;
    constructor(logsRepository: LogsRepository);
    createLog(createLogDto: CreateLogDto): Promise<LogResponseDto>;
    findAll(page?: number, limit?: number): Promise<PaginatedLogsResponseDto>;
    findById(id: string): Promise<LogResponseDto>;
    findByTransactionId(transactionId: string): Promise<LogResponseDto[]>;
    logUserCreated(userId: string, statusCode: number, message?: string): Promise<void>;
    logUserLogin(userId: string, statusCode: number, email: string): Promise<void>;
    logTransactionCreated(transactionId: string, userId: string, statusCode: number): Promise<void>;
    logTransactionProcessing(transactionId: string, userId: string): Promise<void>;
    logTransactionCompleted(transactionId: string, userId: string): Promise<void>;
    logTransactionFailed(transactionId: string, userId: string, error: string): Promise<void>;
    logRabbitMQError(error: string, metadata?: Record<string, any>): Promise<void>;
    logRabbitMQSuccess(message: string, metadata?: Record<string, any>): Promise<void>;
    logError(error: string, statusCode?: number, metadata?: Record<string, any>): Promise<void>;
    logErrorWithStack(error: Error | any, context: string, userId?: string, additionalData?: Record<string, any>): Promise<void>;
}
