import { Injectable } from '@nestjs/common';

import { RuntimeDataService } from '../database/runtime-data.service';
import type { SessionUser } from '../auth/auth.types';

@Injectable()
export class UsersService {
  constructor(private readonly runtimeData: RuntimeDataService) {}

  getScopedUsers(viewer: SessionUser): SessionUser[] {
    const viewerRecord = this.runtimeData.getUserById(viewer.id);

    if (!viewerRecord) {
      return [viewer];
    }

    return this.runtimeData.getVisibleUsersForViewer(viewerRecord);
  }
}
