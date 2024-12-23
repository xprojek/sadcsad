export interface Env {
  readDB: D1Database;
  readAkun: D1Database;
}

export interface Email {
  id: number;
  from_address: string;
  to_address: string;
  subject: string | null;
  text_content: string | null;
  html_content: string | null;
  received_at: string;
}

export interface User {
  id: number;
  user: string;
  pin: string;
  access: string;
  whitelist: string;
  blacklist: string;
}

export interface Session {
  user: string;
  access: string;
  isAdmin: boolean;
  createdAt: number;
  whitelist: string[];
  blacklist: string[];
}

export interface EmailCount {
  to_address: string;
  count: number;
}