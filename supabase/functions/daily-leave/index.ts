// Daily Auto-Leave Edge Function
// Runs at 22:00 KST daily to mark all 'present' students as 'absent'
// and create leave records in attendance_logs.
//
// Trigger: Supabase pg_cron or external cron (GitHub Actions)
// Endpoint: POST /functions/v1/daily-leave
// Auth: Requires service_role key in Authorization header

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  try {
    // Verify this is a POST request
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC+9
    const today = kstDate.toISOString().slice(0, 10); // YYYY-MM-DD

    // 1. Find all students currently 'present'
    const { data: activeStudents, error: fetchError } = await supabase
      .from("students")
      .select("id, name")
      .eq("current_status", "present");

    if (fetchError) {
      throw new Error(`Failed to fetch active students: ${fetchError.message}`);
    }

    if (!activeStudents || activeStudents.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No active students to process",
          processed: 0,
          date: today,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Update all active students to 'absent'
    const studentIds = activeStudents.map((s) => s.id);

    const { error: updateError } = await supabase
      .from("students")
      .update({ current_status: "absent" })
      .in("id", studentIds);

    if (updateError) {
      throw new Error(`Failed to update student statuses: ${updateError.message}`);
    }

    // 3. Create leave records in attendance_logs
    const leaveRecords = activeStudents.map((s) => ({
      student_id: s.id,
      date: today,
      status: "leave",
      check_out_time: now.toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("attendance_logs")
      .insert(leaveRecords);

    if (insertError) {
      throw new Error(`Failed to insert leave records: ${insertError.message}`);
    }

    // 4. Log the operation in audit_logs
    await supabase.from("audit_logs").insert({
      action: "BATCH_LEAVE",
      entity_type: "students",
      details: {
        count: activeStudents.length,
        date: today,
        studentIds: studentIds,
        trigger: "edge-function",
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        processed: activeStudents.length,
        date: today,
        students: activeStudents.map((s) => s.name),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Daily leave error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
