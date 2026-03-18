import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name, role } = body;

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: "Alle velden zijn verplicht" },
        { status: 400 }
      );
    }

    // Create auth user
    const { data: userData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }

    const user = userData.user;

    // Update profile role
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ role })
      .eq("id", user.id);

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Er is een onverwachte fout opgetreden" },
      { status: 500 }
    );
  }
}
