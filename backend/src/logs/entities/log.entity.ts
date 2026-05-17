import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { LogType } from '../enums/log-type.enum';

@Entity('logs')
export class Log {
    @PrimaryGeneratedColumn('uuid')
    id?: string;

    @Column({
        name: 'type_log',
        type: 'varchar',
        length: 100,
        comment: 'Tipo de log: USER_CREATED, USER_LOGIN, TRANSACTION_CREATED, etc.',
    })
    typeLog!: LogType;

    @Column({
        name: 'status_code',
        type: 'int',
        nullable: true,
        comment: 'Status code HTTP retornado',
    })
    statusCode?: number;

    @Column({
        type: 'text',
        nullable: true,
        comment: 'Mensagem de erro ou sucesso',
    })
    message?: string;

    @Column({
        name: 'user_id',
        type: 'uuid',
        nullable: true,
        comment: 'ID do usuário relacionado ao log',
    })
    userId?: string;

    @Column({
        name: 'transaction_id',
        type: 'uuid',
        nullable: true,
        comment: 'ID da transação relacionada ao log',
    })
    transactionId?: string;

    @Column({
        type: 'jsonb',
        nullable: true,
        comment: 'Dados adicionais do log',
    })
    metadata?: Record<string, any>;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamp',
        comment: 'Data e hora de criação do log',
    })
    createdAt?: Date;
}
