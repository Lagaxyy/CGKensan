import { auth } from "@/lib/auth";
import { loadQuiz } from "@/lib/quiz-parser";
import { persistResult, scoreQuiz, SubmitQuizPayload } from "@/lib/scoring";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  const userId = session.user.id;

  const body = await req.json();
  if (
    typeof body?.slug !== "string" || !body.slug ||
    typeof body?.answers !== "object" || body.answers === null
  ) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }
  const payload = body as SubmitQuizPayload;

  let quiz;
  try {
    quiz = loadQuiz(payload.slug);
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Unknown error when loading quiz" },
      { status: 500 }
    );
  }

  if (quiz.questions.length !== Object.keys(payload.answers).length) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    );
  }
  for (const question of quiz.questions) {
    const answer = payload.answers[question.id];
    if (!answer || answer.type !== question.type) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }
  }

  let quizScoreResult;
  try {
    quizScoreResult = scoreQuiz(quiz, payload.answers);
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json(
        { error: e.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Unknown error when computing score" },
      { status: 500 }
    );
  }

  try {
    await persistResult(userId, quizScoreResult);
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json(
        { error: "Cannot persist score results" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Unknown error when writing score to db" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    slug: quizScoreResult.slug,
    score: quizScoreResult.score,
    maxScore: quizScoreResult.maxScore,
    percentage: quizScoreResult.percentage,
    questions: quizScoreResult.questions
  });
}
