import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('notifications')
@Index(['userId', 'createdAt'])
export class NotificationEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'varchar', length: 255 })
    @Index()
    userId: string;

    @Column({ name: 'order_id', type: 'varchar', length: 255 })
    @Index()
    orderId: string;

    @Column({ name: 'status', type: 'varchar', length: 30 })
    status: string;

    @Column({ name: 'message', type: 'text' })
    message: string;

    @Column({ name: 'service_origin', type: 'varchar', length: 50 })
    serviceOrigin: string;

    @Column({ name: 'is_read', type: 'boolean', default: false })
    isRead: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
