import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { AuthRepository } from '../auth.repository';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly authRepository;
    constructor(configService: ConfigService, authRepository: AuthRepository);
    validate(payload: any): Promise<{
        id: any;
        email: any;
        name: any;
    }>;
}
export {};
