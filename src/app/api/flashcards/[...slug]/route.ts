import { loadFlashcardDeck } from "@/lib/flashcard-parser";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/flashcards/[slug]
 * Returns a deck with its recto/verso cards.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    const slugPath = slug.join("/");

    const deck = loadFlashcardDeck(slugPath);

    return NextResponse.json(deck);
  } catch {
    return NextResponse.json(
      { error: "Deck de flashcards non trouvé" },
      { status: 404 }
    );
  }
}
