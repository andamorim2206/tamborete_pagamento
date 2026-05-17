import { LogResponseDto } from './log-response.dto';
export declare class PaginatedLogsResponseDto {
    data: LogResponseDto[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
    constructor(data: LogResponseDto[], total: number, page: number, limit: number);
}
