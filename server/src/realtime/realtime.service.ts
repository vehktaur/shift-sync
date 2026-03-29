import { Injectable } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { Subject, interval, merge } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { DateTime } from 'luxon';

import type { SessionUser, UserRole } from '../auth/auth.types';
import type {
  RealtimeEventPayload,
  RealtimeEventResponse,
  RealtimeEventTopic,
} from '../scheduling/scheduling.types';

type RealtimeVisibility = {
  userIds?: string[];
  roles?: UserRole[];
  locationIds?: string[];
};

type RealtimeEventRecord = RealtimeEventResponse & {
  visibility?: RealtimeVisibility;
};

@Injectable()
export class RealtimeService {
  private readonly events$ = new Subject<RealtimeEventRecord>();

  streamForViewer(viewer: SessionUser): Observable<MessageEvent> {
    return merge(
      this.events$.pipe(
        filter((event) => this.canViewerSeeEvent(viewer, event)),
        map((event) => ({ data: this.toResponse(event) })),
      ),
      interval(60_000).pipe(
        map(() => ({
          data: this.toResponse({
            id: crypto.randomUUID(),
            topic: 'heartbeat',
            createdAtUtc: DateTime.utc().toISO() ?? '',
          }),
        })),
      ),
    );
  }

  publish(params: {
    topic: RealtimeEventTopic;
    payload?: RealtimeEventPayload;
    visibility?: RealtimeVisibility;
  }) {
    this.events$.next({
      id: crypto.randomUUID(),
      topic: params.topic,
      createdAtUtc: DateTime.utc().toISO() ?? '',
      payload: params.payload,
      visibility: params.visibility,
    });
  }

  private toResponse(event: RealtimeEventRecord): RealtimeEventResponse {
    return {
      id: event.id,
      topic: event.topic,
      createdAtUtc: event.createdAtUtc,
      payload: event.payload,
    };
  }

  private canViewerSeeEvent(viewer: SessionUser, event: RealtimeEventRecord) {
    const visibility = event.visibility;

    if (!visibility) {
      return true;
    }

    if (visibility.userIds?.length && !visibility.userIds.includes(viewer.id)) {
      return false;
    }

    if (visibility.roles?.length && !visibility.roles.includes(viewer.role)) {
      return false;
    }

    if (!visibility.locationIds?.length) {
      return true;
    }

    if (viewer.role === 'admin') {
      return true;
    }

    if (viewer.role === 'manager') {
      return visibility.locationIds.some((locationId) =>
        viewer.managedLocationIds?.includes(locationId),
      );
    }

    return visibility.locationIds.some((locationId) =>
      viewer.certifiedLocationIds?.includes(locationId),
    );
  }
}
