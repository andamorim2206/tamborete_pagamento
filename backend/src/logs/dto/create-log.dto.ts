import { IsEnum, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import { LogType } from '../enums/log-type.enum';

export class CreateLogDto {
    @IsEnum(LogType)
    typeLog!: LogType;

    @IsOptional()
    @IsInt()
    statusCode?: number;

    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    @IsUUID()
    userId?: string;

    @IsOptional()
    @IsUUID()
    transactionId?: string;

    @IsOptional()
    metadata?: Record<string, any>;
}
