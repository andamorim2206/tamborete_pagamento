import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from './entities/log.entity';
import { CreateLogDto } from './dto/create-log.dto';

@Injectable()
export class LogsRepository {
    constructor(
        @InjectRepository(Log)
        private readonly logsRepository: Repository<Log>,
    ) { }

    async create(createLogDto: CreateLogDto): Promise<Log> {
        const log = this.logsRepository.create(createLogDto);
        return await this.logsRepository.save(log);
    }

    async findById(id: string): Promise<Log | null> {
        return await this.logsRepository.findOne({ where: { id } });
    }

    async findAllWithPagination(
        page: number,
        limit: number,
    ): Promise<{ data: Log[]; total: number }> {
        const skip = (page - 1) * limit;

        const [data, total] = await this.logsRepository.findAndCount({
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });

        return { data, total };
    }

    async findByUserId(userId: string): Promise<Log[]> {
        return await this.logsRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async findByTransactionId(transactionId: string): Promise<Log[]> {
        return await this.logsRepository.find({
            where: { transactionId },
            order: { createdAt: 'DESC' },
        });
    }
}
