import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../enums/user-role.enum';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string | undefined;

    @Column({ type: 'varchar', length: 255 })
    name: string | undefined;

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string | undefined;

    @Column({ type: 'varchar', length: 255 })
    password: string | undefined;

    @Column({
        type: 'varchar',
        length: 50,
        default: UserRole.USER,
        comment: 'Tipo de usuário: ADMIN ou USER',
    })
    role: UserRole | undefined;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 1000.00,
        comment: 'Saldo disponível do usuário em reais',
    })
    balance: number | undefined;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date | undefined;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date | undefined;
}
