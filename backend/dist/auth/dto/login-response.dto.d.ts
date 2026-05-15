export declare class LoginResponseDto {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    user: {
        id: string;
        name: string;
        email: string;
    };
    constructor(token: string, expiresIn: number, user: {
        id: string;
        name: string;
        email: string;
    });
}
