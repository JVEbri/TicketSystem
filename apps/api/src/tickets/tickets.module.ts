import { Module } from '@nestjs/common';
import { TicketsService } from './application/tickets.service';
import { TICKETS_REPOSITORY } from './application/ports/tickets-repository';
import { PrismaTicketsRepository } from './infrastructure/prisma-tickets.repository';
import { TicketsController } from './presentation/tickets.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TicketsController],
  providers: [
    TicketsService,
    {
      provide: TICKETS_REPOSITORY,
      useClass: PrismaTicketsRepository,
    },
  ],
})
export class TicketsModule {}
