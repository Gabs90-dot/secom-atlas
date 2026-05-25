import { NextResponse } from "next/server";

export async function GET() {
  console.log("AUTO SYNC GLPI AVVIATO");

  return NextResponse.json({
    success: true,
    message: "cron ok",
  });
}