export type ErrorCode =
  | 'login_required'
  | 'provider_unavailable'
  | 'tool_not_allowed'
  | 'invalid_request'
  | 'internal_error';

export interface ApiError {
  code: ErrorCode;
  message: string;
  requestId?: string;
}

