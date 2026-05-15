export class LoginResponseDto {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    user: {
        id: string;
        name: string;
        email: string;
    };

    constructor(
        token: string,
        expiresIn: number,
        user: { id: string; name: string; email: string },
    ) {
        this.accessToken = token;
        this.tokenType = 'Bearer';
        this.expiresIn = expiresIn;
        this.user = user;
    }
}
