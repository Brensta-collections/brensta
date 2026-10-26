import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Liveness probe. Returns 200 + a tiny JSON body whenever the Node process
 * is responsive. Deliberately does NOT touch the database so that a
 * downstream outage (Neon suspend, pool exhaustion) does not force the
 * container to be killed by an uptime monitor.
 *
 * Readiness (DB reachable, migrations applied) will land in a separate
 * route when the ops surface needs it.
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "brensta",
      uptimeSec: Math.round(process.uptime()),
      time: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
