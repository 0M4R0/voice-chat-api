import { Socket } from "socket.io";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { createSupabaseUserClient } from "../config/supabase";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);

export const authMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  const token =
    socket.handshake.auth.token ??
    socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return next(new Error("No token"));

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return next(new Error("Invalid token"));

  socket.data.user = data.user;
  // Keep an authenticated Supabase client so repository calls respect RLS.
  socket.data.supabase = createSupabaseUserClient(token);
  next();
};
