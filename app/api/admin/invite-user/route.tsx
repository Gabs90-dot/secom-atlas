import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { email, displayName, role, tenantId } = body;

    if (!email || !tenantId) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const invite = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      }
    );

    if (invite.error) {
      return NextResponse.json(
        { error: invite.error.message },
        { status: 500 }
      );
    }

    const userId = invite.data.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "User not created" },
        { status: 500 }
      );
    }

    const { error: tenantError } = await supabaseAdmin
      .from("tenant_users")
      .upsert({
        tenant_id: tenantId,
        user_id: userId,
        email,
        display_name: displayName,
        role,
        status: "active",
      });

    if (tenantError) {
      return NextResponse.json(
        { error: tenantError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}