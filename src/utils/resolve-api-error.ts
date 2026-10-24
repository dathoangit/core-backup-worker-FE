import { ApiError, formatApiErrorPayload } from 'src/utils/api';
import i18n from 'src/i18n';

export function resolveApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return formatApiErrorPayload(error.payload) ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return i18n.t('common:errors.generic');
}
