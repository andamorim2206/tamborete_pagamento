import { LogsService } from './logs.service';
import { PaginationQueryDto } from '../transactions/dto/pagination-query.dto';
export declare class LogsController {
    private readonly logsService;
    constructor(logsService: LogsService);
    findAll(paginationQuery: PaginationQueryDto): Promise<import("./dto/paginated-logs-response.dto").PaginatedLogsResponseDto>;
    findByTransactionId(transactionId: string): Promise<import("./dto/log-response.dto").LogResponseDto[]>;
    findById(id: string): Promise<import("./dto/log-response.dto").LogResponseDto>;
}
