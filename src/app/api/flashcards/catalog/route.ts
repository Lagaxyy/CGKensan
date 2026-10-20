import { getFlashcardCatalog } from "@/lib/flashcard-parser";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const catalog = getFlashcardCatalog();
    return NextResponse.json(catalog);
  } catch {
    return NextResponse.json(
      { error: "Failed to load flashcard catalog" },
      { status: 500 }
    );
  }
}
