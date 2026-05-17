"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResponseDto = void 0;
const user_role_enum_1 = require("../enums/user-role.enum");
class UserResponseDto {
    id;
    name;
    email;
    balance;
    role;
    createdAt;
    updatedAt;
    static fromEntity(user) {
        const response = new UserResponseDto();
        response.id = user.id;
        response.name = user.name;
        response.email = user.email;
        response.balance = Number(user.balance) || 0;
        response.role = user.role || user_role_enum_1.UserRole.USER;
        response.createdAt = user.createdAt;
        response.updatedAt = user.updatedAt;
        return response;
    }
}
exports.UserResponseDto = UserResponseDto;
//# sourceMappingURL=user-response.dto.js.map