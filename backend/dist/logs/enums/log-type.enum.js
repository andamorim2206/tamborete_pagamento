"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogType = void 0;
var LogType;
(function (LogType) {
    LogType["USER_CREATED"] = "USER_CREATED";
    LogType["USER_LOGIN"] = "USER_LOGIN";
    LogType["TRANSACTION_CREATED"] = "TRANSACTION_CREATED";
    LogType["TRANSACTION_PROCESSING"] = "TRANSACTION_PROCESSING";
    LogType["TRANSACTION_COMPLETED"] = "TRANSACTION_COMPLETED";
    LogType["TRANSACTION_FAILED"] = "TRANSACTION_FAILED";
    LogType["RABBITMQ_ERROR"] = "RABBITMQ_ERROR";
    LogType["RABBITMQ_SUCCESS"] = "RABBITMQ_SUCCESS";
    LogType["ERROR"] = "ERROR";
})(LogType || (exports.LogType = LogType = {}));
//# sourceMappingURL=log-type.enum.js.map