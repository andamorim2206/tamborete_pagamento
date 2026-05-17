import { LogResponseDto } from './log-response.dto';

export class PaginatedLogsResponseDto {
    data!: LogResponseDto[];
    meta!: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };

    constructor(data: LogResponseDto[], total: number, page: number, limit: number) {
        this.data = data;
        const totalPages = Math.ceil(total / limit);
        this.meta = {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        };
    }
}
