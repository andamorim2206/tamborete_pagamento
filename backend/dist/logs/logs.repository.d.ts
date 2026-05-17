import { Repository } from 'typeorm';
import { Log } from './entities/log.entity';
import { CreateLogDto } from './dto/create-log.dto';
export declare class LogsRepository {
    private readonly logsRepository;
    constructor(logsRepository: Repository<Log>);
    create(createLogDto: CreateLogDto): Promise<Log>;
    findById(id: string): Promise<Log | null>;
    findAllWithPagination(page: number, limit: number): Promise<{
        data: Log[];
        total: number;
    }>;
    findByUserId(userId: string): Promise<Log[]>;
    findByTransactionId(transactionId: string): Promise<Log[]>;
}
