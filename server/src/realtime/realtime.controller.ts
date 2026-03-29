import { Controller, Sse, UseGuards } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import type { Observable } from 'rxjs';

import { CurrentUser } from '../auth/current-user.decorator';
import type { SessionUser } from '../auth/auth.types';
import { SessionGuard } from '../auth/session.guard';
import { RealtimeService } from './realtime.service';

@Controller('events')
@UseGuards(SessionGuard)
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  @Sse('stream')
  stream(@CurrentUser() viewer: SessionUser): Observable<MessageEvent> {
    return this.realtimeService.streamForViewer(viewer);
  }
}
