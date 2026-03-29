import { Injectable } from '@nestjs/common';

import { getUserById, getVisibleUsersForViewer } from '../auth/mock-users';
import type { SessionUser } from '../auth/auth.types';

@Injectable()
export class UsersService {
  getScopedUsers(viewer: SessionUser): SessionUser[] {
    const viewerRecord = getUserById(viewer.id);

    if (!viewerRecord) {
      return [viewer];
    }

    return getVisibleUsersForViewer(viewerRecord);
  }
}
