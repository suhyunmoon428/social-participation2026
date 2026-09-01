import type { FriendlyCode } from "@/lib/messages";

export function getServerEnvIssue(): FriendlyCode | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const sessionSecret = process.env.SESSION_SECRET?.trim();

  if (!supabaseUrl || !serviceKey) return "SUPABASE_NOT_CONFIGURED";
  if (!sessionSecret || sessionSecret.length < 16) return "SESSION_NOT_CONFIGURED";
  return null;
}
