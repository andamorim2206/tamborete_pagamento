import { LogType } from '../enums/log-type.enum';
export declare class Log {
    id?: string;
    typeLog: LogType;
    statusCode?: number;
    message?: string;
    userId?: string;
    transactionId?: string;
    metadata?: Record<string, any>;
    createdAt?: Date;
}
