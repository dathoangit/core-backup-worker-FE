import { useEffect, useRef, useState } from 'react';
import { getPublicApiBaseUrl } from 'src/config/public-api';
import type {
  BackupRunLogEvent,
  BackupRunProgressEvent,
  BackupRunStatusEvent,
  BackupStreamEvent,
} from 'src/types/backup-stream';

const MAX_LOGS = 500;

/** `snapshot` replays a run already buffered on the server (reconnect / new page). */
export type BackupStreamEventSource = 'live' | 'snapshot';

export type UseBackupStreamOptions = {
  enabled?: boolean;
  /** Admin stream by default; set public for wallboard. */
  channel?: 'admin' | 'public';
  runId?: string;
  /** Called when the SSE connection opens (use to HTTP-refetch). */
  onOpen?: () => void;
  onStatus?: (
    event: BackupRunStatusEvent,
    source: BackupStreamEventSource,
  ) => void;
  onProgress?: (event: BackupRunProgressEvent) => void;
};

export type UseBackupStreamResult = {
  connected: boolean;
  progressByRunId: Record<string, BackupRunProgressEvent>;
  statusByRunId: Record<string, BackupRunStatusEvent>;
  logs: BackupRunLogEvent[];
  lastEventAt: string | null;
};

function parseEvent(raw: string): BackupStreamEvent | null {
  try {
    return JSON.parse(raw) as BackupStreamEvent;
  } catch {
    return null;
  }
}

export function useBackupStream(
  options: UseBackupStreamOptions = {},
): UseBackupStreamResult {
  const {
    enabled = true,
    channel = 'admin',
    runId,
    onOpen,
    onStatus,
    onProgress,
  } = options;

  const [connected, setConnected] = useState(false);
  const [progressByRunId, setProgressByRunId] = useState<
    Record<string, BackupRunProgressEvent>
  >({});
  const [statusByRunId, setStatusByRunId] = useState<
    Record<string, BackupRunStatusEvent>
  >({});
  const [logs, setLogs] = useState<BackupRunLogEvent[]>([]);
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);

  const onOpenRef = useRef(onOpen);
  const onStatusRef = useRef(onStatus);
  const onProgressRef = useRef(onProgress);
  onOpenRef.current = onOpen;
  onStatusRef.current = onStatus;
  onProgressRef.current = onProgress;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    const base = getPublicApiBaseUrl().replace(/\/$/, '');
    const path =
      channel === 'public'
        ? '/public/backup/stream'
        : '/admin/backup/stream';
    // Do not use `new URL(path, base)` — absolute path drops `/api/v1` from base.
    const url = new URL(`${base}${path}`);
    if (runId) {
      url.searchParams.set('runId', runId);
    }

    let closed = false;
    let retryTimer: number | undefined;
    let source: EventSource | null = null;

    const connect = () => {
      if (closed) {
        return;
      }

      source = new EventSource(url.toString(), { withCredentials: true });

      source.onopen = () => {
        setConnected(true);
        onOpenRef.current?.();
      };

      source.onerror = () => {
        setConnected(false);
        source?.close();
        source = null;
        if (!closed) {
          retryTimer = window.setTimeout(connect, 3000);
        }
      };

      const handleMessage = (messageEvent: MessageEvent<string>) => {
        const payload = parseEvent(messageEvent.data);
        if (!payload) {
          return;
        }

        setLastEventAt(new Date().toISOString());

        if (payload.type === 'heartbeat') {
          return;
        }

        if (payload.type === 'snapshot') {
          if (payload.status) {
            setStatusByRunId((prev) => ({
              ...prev,
              [payload.runId]: payload.status!,
            }));
            onStatusRef.current?.(payload.status, 'snapshot');
          }
          if (payload.progress) {
            setProgressByRunId((prev) => ({
              ...prev,
              [payload.runId]: payload.progress!,
            }));
            onProgressRef.current?.(payload.progress);
          }
          if (payload.logs.length > 0) {
            setLogs((prev) => {
              const next = runId
                ? [...prev.filter((l) => l.runId === runId), ...payload.logs]
                : [...prev, ...payload.logs];
              return next.slice(-MAX_LOGS);
            });
          }
          return;
        }

        if (payload.type === 'run.status') {
          setStatusByRunId((prev) => ({ ...prev, [payload.runId]: payload }));
          onStatusRef.current?.(payload, 'live');
          return;
        }

        if (payload.type === 'run.progress') {
          setProgressByRunId((prev) => ({ ...prev, [payload.runId]: payload }));
          onProgressRef.current?.(payload);
          return;
        }

        if (payload.type === 'run.log') {
          setLogs((prev) => {
            const next = [...prev, payload];
            return next.slice(-MAX_LOGS);
          });
        }
      };

      // Nest @Sse sets event type from MessageEvent.type
      source.addEventListener('run.status', handleMessage as EventListener);
      source.addEventListener('run.progress', handleMessage as EventListener);
      source.addEventListener('run.log', handleMessage as EventListener);
      source.addEventListener('snapshot', handleMessage as EventListener);
      source.addEventListener('heartbeat', handleMessage as EventListener);
      source.onmessage = handleMessage;
    };

    connect();

    return () => {
      closed = true;
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
      source?.close();
      setConnected(false);
    };
  }, [channel, enabled, runId]);

  return {
    connected,
    progressByRunId,
    statusByRunId,
    logs: runId ? logs.filter((l) => l.runId === runId) : logs,
    lastEventAt,
  };
}
