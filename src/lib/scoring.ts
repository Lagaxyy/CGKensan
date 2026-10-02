import type { Quiz, QCMQuestion, OpenQuestion } from "@/lib/quiz-parser";
import { prisma } from "@/lib/prisma";
import type { QuizResult } from "@prisma/client";

export interface QCMUserAnswer {
  type: "qcm";
  selected: string[];
}

export interface OpenUserAnswer {
  type: "open";
  answer: string;
}

export type UserAnswer = QCMUserAnswer | OpenUserAnswer;

export interface SubmitQuizPayload {
  slug: string;
  answers: Record<string, UserAnswer>;
}

export interface ScoredQCM {
  questionId: string;
  type: "qcm";
  earnedPoints: number;
  maxPoints: number;
  selectedIds: string[];
}

export interface ScoredOpen {
  questionId: string;
  type: "open";
  earnedPoints: number;
  maxPoints: number;
  userAnswer: string;
}

export type ScoredQuestion = ScoredQCM | ScoredOpen;

export interface QuizScoreResult {
  slug: string;
  score: number;
  maxScore: number;
  percentage: number;
  questions: ScoredQuestion[];
}

function scoreQCM(question: QCMQuestion, answer: QCMUserAnswer): ScoredQCM {
  // O(1) lookup table
  // classic +1 scoring, can change
  const mapped = new Map(question.options.map((opt) => [opt.id, opt]));
  const correctOptionIndices = question.options.filter((opt) => opt.isCorrect).map((opt) => opt.id);
  const maxPoints = correctOptionIndices.length;
  const selectedSet = new Set(answer.selected);
  let earnedPoints = 0;
  for (const selected of selectedSet) {
    const option = mapped.get(selected);

    if (!option) {
      throw new Error(`scoreQCM: Unknown option ID: ${selected}`);
    }

    if (option.isCorrect) {
      earnedPoints += 1;
    }
  }

  return {
    questionId: question.id,
    type: "qcm",
    earnedPoints,
    maxPoints,
    selectedIds: answer.selected
  };
}

function scoreOpen(question: OpenQuestion, answer: OpenUserAnswer): ScoredOpen {
  // TEMP, IA correction not implemented yet
  const maxPoints = 1;
  const earnedPoints = 1;

  return {
    questionId: question.id,
    type: "open",
    earnedPoints,
    maxPoints,
    userAnswer: answer.answer,
  };
}

export function scoreQuiz(quiz: Quiz, answers: Record<string, UserAnswer>): QuizScoreResult {
  const result = {
    slug: quiz.slug,
    score: 0,
    maxScore: 0,
    percentage: 0,
    questions: [] as ScoredQuestion[]
  };

  for (const question of quiz.questions) {
    const answer = answers[question.id];
    if (!answer) {
      throw new Error(`scoreQuiz: Missing answer for question ${question.id}`);
    }

    let scored;
    if (question.type === "qcm") {
      scored = scoreQCM(question, answer as QCMUserAnswer);
    } else {
      scored = scoreOpen(question, answer as OpenUserAnswer);
    }

    result.score += scored.earnedPoints;
    result.maxScore += scored.maxPoints;
    result.questions.push(scored);
    result.percentage = (result.maxScore > 0) ? Math.round(result.score / result.maxScore * 100) : 0;
  }

  if (result.maxScore <= 0) {
    throw new Error(`scoreQuiz: quiz "${quiz.slug}" is empty`);
  }

  return result;
}

export async function persistResult(userId: string, result: QuizScoreResult): Promise<QuizResult> {
  return prisma.quizResult.create({
    data: {
      userId,
      slug: result.slug,
      score: result.score,
      maxScore: result.maxScore,
      answers: {
        create: result.questions.map((q) => ({
          questionId: q.questionId,
          questionType: q.type,
          earnedPoints: q.earnedPoints,
          maxPoints: q.maxPoints,
          selectedOptions: (q.type === "qcm") ? q.selectedIds : [],
          openAnswer: (q.type === "open") ? q.userAnswer : null
        })),
      },
    },
  });
}
