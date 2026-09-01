import { fail, ok } from "@/lib/apiResponse";
import { getStudentSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ensureProject, loadWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";

type Body = {
  action?: "create" | "join";
  teamName?: string;
  topicTitle?: string;
  joinCode?: string;
};

export async function POST(request: Request) {
  const session = getStudentSession();
  if (!session) return fail("UNAUTHENTICATED", 401);

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return fail("INVALID_INPUT", 400);
  }

  const db = supabaseAdmin();

  try {
    const { data: existingMembership } = await db
      .from("team_members")
      .select("team_id")
      .eq("student_id", session.id)
      .maybeSingle();

    if (existingMembership) return fail("ALREADY_IN_TEAM", 409);

    if (body.action === "create") {
      const teamName = (body.teamName ?? "").trim();
      if (teamName.length < 1 || teamName.length > 40) return fail("INVALID_INPUT", 400);

      const { data: codeData, error: codeError } = await db.rpc("generate_join_code");
      if (codeError || !codeData) return fail("UNKNOWN", 500, codeError);

      const { data: team, error: teamError } = await db
        .from("teams")
        .insert({ name: teamName, join_code: codeData, owner_id: session.id })
        .select("id")
        .single();

      if (teamError || !team) return fail("UNKNOWN", 500, teamError);

      const { error: memberError } = await db
        .from("team_members")
        .insert({ team_id: team.id, student_id: session.id, role: "owner" });

      if (memberError) return fail("UNKNOWN", 500, memberError);

      const topicTitle = (body.topicTitle ?? teamName).trim().slice(0, 80);
      await ensureProject(team.id, topicTitle || teamName);
      return ok(await loadWorkspace(session.id));
    }

    if (body.action === "join") {
      const code = (body.joinCode ?? "").trim().toUpperCase();
      if (code.length !== 6) return fail("INVALID_INPUT", 400);

      const { data: team } = await db
        .from("teams")
        .select("id")
        .eq("join_code", code)
        .maybeSingle();

      if (!team) return fail("TEAM_NOT_FOUND", 404);

      const { error: memberError } = await db
        .from("team_members")
        .insert({ team_id: team.id, student_id: session.id, role: "member" });

      if (memberError) {
        if (memberError.message?.includes("TEAM_FULL")) return fail("TEAM_FULL", 409);
        return fail("UNKNOWN", 500, memberError);
      }

      await ensureProject(team.id);
      return ok(await loadWorkspace(session.id));
    }

    return fail("INVALID_INPUT", 400);
  } catch (error) {
    return fail("UNKNOWN", 500, error);
  }
}
