import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

export async function GET() {
  const lessons = await client.fetch(`
    *[_type == "lesson"] | order(title asc) {
      _id,
      title
    }
  `);

  return NextResponse.json(lessons);
}
