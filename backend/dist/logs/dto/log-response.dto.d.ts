import { Log } from '../entities/log.entity';
import { LogType } from '../enums/log-type.enum';
export declare class LogResponseDto {
    id: string;
    typeLog: LogType;
    statusCode?: number;
    message?: string;
    userId?: string;
    transactionId?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    static fromEntity(log: Log): LogResponseDto;
}
