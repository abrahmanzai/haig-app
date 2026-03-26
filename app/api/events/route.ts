import { NextRequest, NextResponse } from "next/server";

const placeholderEvents = [
  {
    id: "2026-03-28",
    title: "Founding Meeting",
    description: "Sign partnership agreement...",
    event_type: "founding",
    event_date: "2026-03-28",
    location: "UNO - Peter Kiewit Institute"
  }
];

export async function GET() {
  return NextResponse.json({ events: placeholderEvents });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // TODO: hook up with Supabase
  return NextResponse.json({ event: body }, { status: 201 });
}
