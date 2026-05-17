"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogResponseDto = void 0;
class LogResponseDto {
    id;
    typeLog;
    statusCode;
    message;
    userId;
    transactionId;
    metadata;
    createdAt;
    static fromEntity(log) {
        const response = new LogResponseDto();
        response.id = log.id;
        response.typeLog = log.typeLog;
        response.statusCode = log.statusCode;
        response.message = log.message;
        response.userId = log.userId;
        response.transactionId = log.transactionId;
        response.metadata = log.metadata;
        response.createdAt = log.createdAt;
        return response;
    }
}
exports.LogResponseDto = LogResponseDto;
//# sourceMappingURL=log-response.dto.js.map