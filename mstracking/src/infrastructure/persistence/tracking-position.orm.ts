import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('tracking_positions')
export class TrackingPositionORM {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    delivery_id: string;

    @Column()
    order_id: string;

    @Column('decimal', { precision: 10, scale: 6 })
    latitude: number;

    @Column('decimal', { precision: 10, scale: 6 })
    longitude: number;

    @Column()
    delivery_person_id: string;

    @CreateDateColumn()
    timestamp: Date;

    @Column({ default: 'active' })
    status: string;
}
