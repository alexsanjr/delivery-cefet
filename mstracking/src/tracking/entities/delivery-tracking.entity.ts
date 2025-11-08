import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('delivery_tracking')
export class DeliveryTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  delivery_id: string;

  @Column()
  order_id: string;

  @CreateDateColumn()
  started_at: Date;

  @Column({ nullable: true })
  completed_at: Date;

  @Column({ default: 'pending' })
  status: string;

  @Column('decimal', { precision: 10, scale: 6 })
  destination_lat: number;

  @Column('decimal', { precision: 10, scale: 6 })
  destination_lng: number;
}
