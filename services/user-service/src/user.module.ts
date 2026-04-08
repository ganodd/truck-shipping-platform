import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { UserRepository } from './repositories/user.repository';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';

@Module({
  controllers: [AuthController, UserController],
  providers: [
    {
      provide: PrismaClient,
      useFactory: () => {
        const client = new PrismaClient();
        void client.$connect();
        return client;
      },
    },
    UserRepository,
    AuthService,
    UserService,
  ],
  exports: [UserService, AuthService],
})
export class UserModule {}
