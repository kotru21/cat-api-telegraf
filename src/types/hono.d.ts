// User session data type
export interface SessionUser {
  id: string | number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: number;
}

// Session data stored in cookie/memory
export interface SessionData {
  user?: SessionUser;
}

// Extend Hono's Context Variables
declare module 'hono' {
  interface ContextVariableMap {
    session: SessionData;
    sessionId: string;
    cspNonce: string;
    csrfToken: string;
  }
}
