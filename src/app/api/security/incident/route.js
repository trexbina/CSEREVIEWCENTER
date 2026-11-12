import { NextResponse } from "next/server"

// Exam clients still report incidents to this endpoint, but Security & Access
// Policies no longer persist or expose audit records.
export async function POST() {
  return NextResponse.json({ success: true })
}
