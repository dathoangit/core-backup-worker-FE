import { ApiError, formatApiErrorPayload } from 'src/utils/api';

export function resolveApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return formatApiErrorPayload(error.payload) ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Đã xảy ra lỗi.';
}
