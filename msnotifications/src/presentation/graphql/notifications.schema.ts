import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Notification {
    @Field(() => ID)
    id: string;

    @Field()
    userId: string;

    @Field()
    orderId: string;

    @Field()
    status: string;

    @Field()
    message: string;

    @Field()
    serviceOrigin: string;

    @Field()
    isRead: boolean;

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
}
