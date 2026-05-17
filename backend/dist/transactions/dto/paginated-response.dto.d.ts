import { TransactionResponseDto } from './transaction-response.dto';
export declare class PaginatedResponseDto {
    data: TransactionResponseDto[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
    constructor(data: TransactionResponseDto[], total: number, page: number, limit: number);
}
