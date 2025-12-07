import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateNotificationDto {
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    orderId: string;

    @IsString()
    @IsNotEmpty()
    status: string;

    @IsString()
    @IsNotEmpty()
    serviceOrigin: string;

    @IsOptional()
    @IsString()
    message?: string;
}