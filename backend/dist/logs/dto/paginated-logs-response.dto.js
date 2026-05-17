"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginatedLogsResponseDto = void 0;
class PaginatedLogsResponseDto {
    data;
    meta;
    constructor(data, total, page, limit) {
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
exports.PaginatedLogsResponseDto = PaginatedLogsResponseDto;
//# sourceMappingURL=paginated-logs-response.dto.js.map