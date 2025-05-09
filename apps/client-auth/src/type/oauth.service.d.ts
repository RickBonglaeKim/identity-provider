type oauthError =
  | 'invalid_request'
  | 'unauthorized_client'
  | 'access_denied'
  | 'unsupported_response_type'
  | 'invalid_scope'
  | 'server_error'
  | 'temporarily_unavailable';

type oauthErrorDescription = string | null;

type oauthErrorUri = string | null;

type oauthState = string | null;

type oauthRedirection = (
  state: oauthState,
) => (
  error: oauthError,
) => (
  errorDescription: oauthErrorDescription,
) => (errorUri: oauthErrorUri) => string;
