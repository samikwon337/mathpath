import { NextResponse } from "next/server";

// Placeholder for Supabase OAuth callback
// When Supabase is connected, this will handle the OAuth code exchange
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    // TODO: Exchange code with Supabase
    // const supabase = createClient()
    // await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
