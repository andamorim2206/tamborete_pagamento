"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionResponseDto = void 0;
class TransactionResponseDto {
    id;
    senderId;
    senderName;
    senderEmail;
    receiverId;
    receiverName;
    receiverEmail;
    amount;
    paymentMethod;
    status;
    createdAt;
    static fromEntity(transaction) {
        const response = new TransactionResponseDto();
        response.id = transaction.id;
        response.senderId = transaction.senderId;
        response.senderName = transaction.sender?.name || 'N/A';
        response.senderEmail = transaction.sender?.email || 'N/A';
        response.receiverId = transaction.receiverId;
        response.receiverName = transaction.receiver?.name || 'N/A';
        response.receiverEmail = transaction.receiver?.email || 'N/A';
        response.amount = Number(transaction.amount);
        response.paymentMethod = transaction.paymentMethod;
        response.status = transaction.status;
        response.createdAt = transaction.createdAt;
        return response;
    }
}
exports.TransactionResponseDto = TransactionResponseDto;
//# sourceMappingURL=transaction-response.dto.js.map