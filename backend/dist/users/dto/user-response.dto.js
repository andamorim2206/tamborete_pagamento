"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResponseDto = void 0;
class UserResponseDto {
    id;
    name;
    email;
    createdAt;
    updatedAt;
    static fromEntity(user) {
        const response = new UserResponseDto();
        response.id = user.id;
        response.name = user.name;
        response.email = user.email;
        response.createdAt = user.createdAt;
        response.updatedAt = user.updatedAt;
        return response;
    }
}
exports.UserResponseDto = UserResponseDto;
//# sourceMappingURL=user-response.dto.js.map