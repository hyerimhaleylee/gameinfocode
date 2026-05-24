import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  await supabase.from("page_visits").insert({});
  return NextResponse.json({ ok: true });
}
