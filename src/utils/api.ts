import { notifyUnauthorized } from 'src/auth/unauthorized';

type PrimitiveValue = string | number | boolean;
type QueryValue = PrimitiveValue | null | undefined;
type QueryParams = Record<string, QueryValue>;

type ApiRequestBase = {
  api?: string;
  endPoint: string;
  /** Skip session logout on 401 (boot /auth/me and /auth/logout). */
  suppressUnauthorized?: boolean;
};

type ApiGetOptions = ApiRequestBase & {
  params?: QueryParams;
};

type ApiPostOptions<TBody = unknown> = ApiRequestBase & {
  body?: TBody;
};

type ApiPatchOptions<TBody = unknown> = ApiRequestBase & {
  body?: TBody;
};

type ApiPutOptions<TBody = unknown> = ApiRequestBase & {
  body?: TBody;
  params?: QueryParams;
};

type ApiDeleteOptions = ApiRequestBase;

export type ApiResponse<T> = {
  statusCode: number;
  data: T;
  message: string;
  timestamp: number;
};

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

/** Join API base (may include path like `/api/v1`) with an absolute endpoint path. */
const joinApiPath = (api: string, endPoint: string): string => {
  const base = api.replace(/\/$/, '');
  const path = endPoint.startsWith('/') ? endPoint : `/${endPoint}`;
  return `${base}${path}`;
};

const buildUrl = ({
  api = '',
  endPoint,
  params,
}: ApiRequestBase & { params?: QueryParams }): string => {
  // new URL('/auth/login', 'http://host/api/v1') drops `/api/v1` — join manually.
  const url = api
    ? new URL(joinApiPath(api, endPoint))
    : new URL(
        endPoint.startsWith('/') ? endPoint : `/${endPoint}`,
        'http://localhost',
      );
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  // Keep original behavior when api is not provided: return relative endpoint URL.
  if (!api) {
    return `${url.pathname}${url.search}`;
  }

  return url.toString();
};

const parseJsonSafely = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  return response.json();
};

export const unwrapApiResponseData = <TResponse>(payload: unknown): TResponse => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid API response format.');
  }

  const envelope = payload as Partial<ApiResponse<TResponse>>;
  if (
    typeof envelope.statusCode !== 'number' ||
    !('data' in envelope) ||
    typeof envelope.message !== 'string' ||
    typeof envelope.timestamp !== 'number'
  ) {
    throw new Error('Invalid API response format.');
  }

  return envelope.data as TResponse;
};

export const formatApiErrorPayload = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object' || !('message' in payload)) {
    return null;
  }

  const { message } = payload as { message: unknown };
  if (typeof message === 'string') {
    return message;
  }
  if (Array.isArray(message) && message.every((m) => typeof m === 'string')) {
    return message.join(' ');
  }

  return null;
};

const getErrorMessage = (response: Response, payload: unknown): string => {
  return formatApiErrorPayload(payload) || response.statusText || 'Request failed';
};

const throwIfNotOk = (
  response: Response,
  payload: unknown,
  suppressUnauthorized?: boolean,
): void => {
  if (response.ok) {
    return;
  }

  if (response.status === 401 && !suppressUnauthorized) {
    notifyUnauthorized();
  }

  throw new ApiError(getErrorMessage(response, payload), response.status, payload);
};

export const apiGet = async <TResponse = unknown>({
  api = process.env.NEXT_PUBLIC_API_URL || '',
  endPoint,
  params,
  suppressUnauthorized,
}: ApiGetOptions): Promise<TResponse> => {
  const response = await fetch(buildUrl({ api, endPoint, params }), {
    method: 'GET',
    credentials: 'include',
  });

  const payload = await parseJsonSafely(response);

  throwIfNotOk(response, payload, suppressUnauthorized);

  if (response.status === 204) {
    return null as TResponse;
  }

  return unwrapApiResponseData<TResponse>(payload);
};

export const apiPost = async <TResponse = unknown, TBody = unknown>({
  api = process.env.NEXT_PUBLIC_API_URL || '',
  endPoint,
  body,
  params,
  suppressUnauthorized,
}: ApiPostOptions<TBody> & { params?: QueryParams }): Promise<TResponse> => {
  const response = await fetch(buildUrl({ api, endPoint, params }), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await parseJsonSafely(response);

  throwIfNotOk(response, payload, suppressUnauthorized);

  if (response.status === 204) {
    return null as TResponse;
  }

  return unwrapApiResponseData<TResponse>(payload);
};

export const apiPatch = async <TResponse = unknown, TBody = unknown>({
  api = process.env.NEXT_PUBLIC_API_URL || '',
  endPoint,
  body,
}: ApiPatchOptions<TBody>): Promise<TResponse> => {
  const response = await fetch(buildUrl({ api, endPoint }), {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await parseJsonSafely(response);

  throwIfNotOk(response, payload);

  if (response.status === 204) {
    return null as TResponse;
  }

  return unwrapApiResponseData<TResponse>(payload);
};

export const apiPut = async <TResponse = unknown, TBody = unknown>({
  api = process.env.NEXT_PUBLIC_API_URL || '',
  endPoint,
  body,
  params,
}: ApiPutOptions<TBody>): Promise<TResponse> => {
  const response = await fetch(buildUrl({ api, endPoint, params }), {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = await parseJsonSafely(response);

  throwIfNotOk(response, payload);

  if (response.status === 204) {
    return null as TResponse;
  }

  return unwrapApiResponseData<TResponse>(payload);
};

export const apiDelete = async <TResponse = unknown>({
  api = process.env.NEXT_PUBLIC_API_URL || '',
  endPoint,
}: ApiDeleteOptions): Promise<TResponse> => {
  const response = await fetch(buildUrl({ api, endPoint }), {
    method: 'DELETE',
    credentials: 'include',
  });

  const payload = await parseJsonSafely(response);

  throwIfNotOk(response, payload);

  if (response.status === 204) {
    return null as TResponse;
  }

  return unwrapApiResponseData<TResponse>(payload);
};
