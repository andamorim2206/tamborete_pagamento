"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginResponseDto = void 0;
class LoginResponseDto {
    accessToken;
    tokenType;
    expiresIn;
    user;
    constructor(token, expiresIn, user) {
        this.accessToken = token;
        this.tokenType = 'Bearer';
        this.expiresIn = expiresIn;
        this.user = user;
    }
}
exports.LoginResponseDto = LoginResponseDto;
//# sourceMappingURL=login-response.dto.js.map