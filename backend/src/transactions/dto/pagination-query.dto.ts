import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'A página deve ser um número inteiro' })
    @Min(1, { message: 'A página deve ser no mínimo 1' })
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'O limite deve ser um número inteiro' })
    @Min(1, { message: 'O limite deve ser no mínimo 1' })
    @Max(100, { message: 'O limite deve ser no máximo 100' })
    limit?: number = 10;
}
