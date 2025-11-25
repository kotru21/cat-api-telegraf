import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string | number;
      first_name?: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
      auth_date?: number;
    };
  }
}
