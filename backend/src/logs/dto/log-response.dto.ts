import { Log } from '../entities/log.entity';
import { LogType } from '../enums/log-type.enum';

export class LogResponseDto {
    id!: string;
    typeLog!: LogType;
    statusCode?: number;
    message?: string;
    userId?: string;
    transactionId?: string;
    metadata?: Record<string, any>;
    createdAt!: Date;

    static fromEntity(log: Log): LogResponseDto {
        const response = new LogResponseDto();
        response.id = log.id!;
        response.typeLog = log.typeLog;
        response.statusCode = log.statusCode;
        response.message = log.message;
        response.userId = log.userId;
        response.transactionId = log.transactionId;
        response.metadata = log.metadata;
        response.createdAt = log.createdAt!;
        return response;
    }
}
