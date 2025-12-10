import { PrismaClientOptions } from '@prisma/client/runtime/library';

export const config: PrismaClientOptions = {
  datasourceUrl: process.env.DATABASE_URL,
};
