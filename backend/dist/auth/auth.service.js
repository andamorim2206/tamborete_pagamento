"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const login_response_dto_1 = require("./dto/login-response.dto");
const auth_repository_1 = require("./auth.repository");
const users_repository_1 = require("../users/users.repository");
let AuthService = class AuthService {
    authRepository;
    usersRepository;
    jwtService;
    constructor(authRepository, usersRepository, jwtService) {
        this.authRepository = authRepository;
        this.usersRepository = usersRepository;
        this.jwtService = jwtService;
    }
    async login(loginDto) {
        const user = await this.usersRepository.findByEmail(loginDto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('Email ou senha incorretos');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Email ou senha incorretos');
        }
        await this.authRepository.deactivateAllUserTokens(user.id);
        const payload = {
            sub: user.id,
            email: user.email,
            name: user.name,
        };
        const expiresIn = 86400;
        const token = this.jwtService.sign(payload, {
            expiresIn: `${expiresIn}s`,
        });
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
        await this.authRepository.createToken(user.id, token, expiresAt);
        return new login_response_dto_1.LoginResponseDto(token, expiresIn, {
            id: user.id,
            name: user.name,
            email: user.email,
        });
    }
    async validateToken(token) {
        try {
            const payload = this.jwtService.verify(token);
            const userToken = await this.authRepository.findByToken(token);
            if (!userToken || !userToken.active) {
                throw new common_1.UnauthorizedException('Token inválido ou expirado');
            }
            if (new Date() > userToken.expiresAt) {
                await this.authRepository.deactivateToken(userToken.id);
                throw new common_1.UnauthorizedException('Token expirado');
            }
            return payload;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Token inválido');
        }
    }
    async logout(userId) {
        await this.authRepository.deactivateAllUserTokens(userId);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_repository_1.AuthRepository,
        users_repository_1.UsersRepository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map