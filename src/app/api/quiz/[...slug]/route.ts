import { loadQuiz } from "@/lib/quiz-parser";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/quiz/[slug]
 * Returns the quiz data without answer keys (isCorrect / correction).
 * The client receives only the questions and options text.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    const slugPath = slug.join("/");

    const quiz = loadQuiz(slugPath);

    // Strip answer keys from the response sent to the client
    const sanitized = {
      slug: quiz.slug,
      title: quiz.title,
      wikiRef: quiz.wikiRef,
      tags: quiz.tags,
      difficulty: quiz.difficulty,
      created: quiz.created,
      questions: quiz.questions.map((q) => {
        if (q.type === "qcm") {
          return {
            type: "qcm" as const,
            id: q.id,
            question: q.question,
            options: q.options.map((o) => ({
              id: o.id,
              text: o.text,
              // isCorrect intentionally omitted
            })),
          };
        }
        // type === "open"
        return {
          type: "open" as const,
          id: q.id,
          question: q.question,
          // correction intentionally omitted
        };
      }),
    };

    return NextResponse.json(sanitized);
  } catch {
    return NextResponse.json(
      { error: "Quiz non trouvé" },
      { status: 404 }
    );
  }
}