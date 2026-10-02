"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { NeuralCanvas } from "@/components/design-system/NeuralCanvas";
import QuizResultScreen from "@/components/QuizResultScreen";
import styles from "./QuizPlayer.module.css";

// ── Sanitized types (no isCorrect / correction) ──────────────────────

interface SanitizedQCMOption {
  id: string;
  text: string;
}

interface SanitizedQCMQuestion {
  type: "qcm";
  id: string;
  question: string;
  options: SanitizedQCMOption[];
}

interface SanitizedOpenQuestion {
  type: "open";
  id: string;
  question: string;
}

type SanitizedQuestion = SanitizedQCMQuestion | SanitizedOpenQuestion;

interface SanitizedQuiz {
  slug: string;
  title: string;
  wikiRef: string;
  tags: string[];
  difficulty: string;
  created: string;
  questions: SanitizedQuestion[];
}

// ── Answer types ─────────────────────────────────────────────────────

interface QCMSelection {
  type: "qcm";
  selected: string[];
}

interface OpenSelection {
  type: "open";
  answer: string;
}

type QuestionAnswer = QCMSelection | OpenSelection;

interface QuizPlayerProps {
  slug: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function scramble(len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
}

function revealLeftToRight(original: string, revealCount: number): string {
  return original
    .split("")
    .map((c, i) => (i < revealCount ? c : CHARS[Math.floor(Math.random() * CHARS.length)]))
    .join("");
}

function revealMulti(originals: string[], progress: number, out: string[]): void {
  for (let s = 0; s < originals.length; s++) {
    const src = originals[s];
    const revealCount = Math.round(progress * src.length);
    out[s] = revealLeftToRight(src, revealCount);
  }
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function animateReveal(
  text: string,
  duration: number,
  onProgress: (text: string, progress: number) => void,
  onDone: () => void
): () => void {
  const len = text.length;
  const startTime = performance.now();
  let rafId: number;

  function frame(now: number) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(t);
    const revealCount = Math.round(eased * len);
    onProgress(revealLeftToRight(text, revealCount), eased);
    if (t < 1) {
      rafId = requestAnimationFrame(frame);
    } else {
      onProgress(text, 1);
      onDone();
    }
  }

  rafId = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(rafId);
}

// ── Component ────────────────────────────────────────────────────────

export default function QuizPlayer({ slug }: QuizPlayerProps) {
  const [quiz, setQuiz] = useState<SanitizedQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [resultPercentage, setResultPercentage] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // ── Animation state ───────────────────────────────────────────────
  const [paused, setPaused] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [displayedAnswers, setDisplayedAnswers] = useState<string[] | null>(null);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const pendingIdxRef = useRef<number | null>(null);
  const cancelAnimRef = useRef<(() => void) | null>(null);

  // ── Fetch quiz from API ───────────────────────────────────────────

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const res = await fetch(`/api/quiz/${slug}`);
        if (!res.ok) {
          setError("Quiz introuvable");
          return;
        }
        const data: SanitizedQuiz = await res.json();
        setQuiz(data);
      } catch {
        setError("Erreur lors du chargement du quiz");
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [slug]);

  // ── Animation helpers ─────────────────────────────────────────────

  function animateNavTransition(newIdx: number) {
    const newQ = quiz!.questions[newIdx];
    if (!newQ) return;

    const newText = newQ.question;
    const answerTexts: string[] = newQ.type === "qcm"
      ? (newQ as SanitizedQCMQuestion).options.map((o) => o.text)
      : [];

    setDisplayedText(scramble(newText.length));
    if (answerTexts.length > 0) {
      setDisplayedAnswers(answerTexts.map((t) => scramble(t.length)));
    }

    setCurrentIdx(newIdx);
    pendingIdxRef.current = null;
    setAnimatingId("unscramble");

    const answerBuf = answerTexts.map(() => "");
    const cancel = animateReveal(newText, 900, (revealedText, progress) => {
      setDisplayedText(revealedText);
      if (answerTexts.length > 0) {
        revealMulti(answerTexts, progress, answerBuf);
        setDisplayedAnswers([...answerBuf]);
      }
    }, () => {
      setAnimatingId(null);
      setPaused(false);
      cancelAnimRef.current = null;

      if (pendingIdxRef.current !== null) {
        const nextIdx = pendingIdxRef.current;
        pendingIdxRef.current = null;
        animateNavTransition(nextIdx);
      }
    });

    cancelAnimRef.current = cancel;
  }

  function animateInit(text: string) {
    const q0 = quiz!.questions[0];
    const answerTexts: string[] = q0?.type === "qcm"
      ? (q0 as SanitizedQCMQuestion).options.map((o) => o.text)
      : [];

    setDisplayedText(scramble(text.length));
    if (answerTexts.length > 0) {
      setDisplayedAnswers(answerTexts.map((t) => scramble(t.length)));
    }
    setAnimatingId("unscramble");

    const answerBuf = answerTexts.map(() => "");
    const cancel = animateReveal(text, 900, (revealedText, progress) => {
      setDisplayedText(revealedText);
      if (answerTexts.length > 0) {
        revealMulti(answerTexts, progress, answerBuf);
        setDisplayedAnswers([...answerBuf]);
      }
    }, () => {
      setAnimatingId(null);
      cancelAnimRef.current = null;
    });

    cancelAnimRef.current = cancel;
  }

  useEffect(() => {
    return () => {
      if (cancelAnimRef.current) {
        cancelAnimRef.current();
        cancelAnimRef.current = null;
      }
    };
  }, []);

  // On quiz loaded: kick off init animation
  useEffect(() => {
    if (!quiz?.questions[0]) return;
    animateInit(quiz.questions[0].question);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz]);

  // ── Answer handlers ───────────────────────────────────────────────

  const currentQuestion = quiz?.questions[currentIdx] ?? null;
  const totalQuestions = quiz?.questions.length ?? 0;
  const progress = totalQuestions > 0 ? ((currentIdx + 1) / totalQuestions) * 100 : 0;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === totalQuestions && totalQuestions > 0;

  const handleQCMToggle = useCallback(
    (optionId: string) => {
      if (finished || !currentQuestion || currentQuestion.type !== "qcm") return;
      const existing = answers[currentQuestion.id] as QCMSelection | undefined;
      let selected: string[];
      if (existing) {
        if (existing.selected.includes(optionId)) {
          selected = existing.selected.filter((i) => i !== optionId);
        } else {
          selected = [...existing.selected, optionId];
        }
      } else {
        selected = [optionId];
      }
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: { type: "qcm", selected },
      }));
    },
    [currentQuestion, finished, answers]
  );

  const handleOpenAnswer = useCallback(
    (text: string) => {
      if (finished || !currentQuestion) return;
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: { type: "open" as const, answer: text },
      }));
    },
    [currentQuestion, finished]
  );

  const navigateTo = useCallback(
    (targetIdx: number) => {
      if (!quiz || targetIdx < 0 || targetIdx >= totalQuestions || targetIdx === currentIdx) return;
      if (paused || animatingId !== null) {
        pendingIdxRef.current = targetIdx;
        return;
      }
      setPaused(true);
      animateNavTransition(targetIdx);
    },
    [quiz, currentIdx, totalQuestions, paused, animatingId]
  );

  const nextQuestion = useCallback(() => {
    if (currentIdx < totalQuestions - 1) navigateTo(currentIdx + 1);
  }, [currentIdx, totalQuestions, navigateTo]);

  const prevQuestion = useCallback(() => {
    if (currentIdx > 0) navigateTo(currentIdx - 1);
  }, [currentIdx, navigateTo]);

  // ── Submit to API ─────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!allAnswered || submitting || !quiz) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: quiz.slug, answers }),
      });

      if (!res.ok) {
        // Fallback: user gets 0, but at least the client didn't cheat
        setScore(0);
        setMaxScore(0);
        setResultPercentage(0);
      } else {
        const data = await res.json();
        setScore(data.score ?? 0);
        setMaxScore(data.maxScore ?? 0);
        setResultPercentage(data.percentage ?? 0);
      }
    } catch {
      setScore(0);
      setMaxScore(0);
      setResultPercentage(0);
    } finally {
      setFinished(true);
      setSubmitting(false);
    }
  }, [answers, quiz, allAnswered, submitting]);

  // ── Derived state ─────────────────────────────────────────────────

  const currentAnswered = currentQuestion ? answers[currentQuestion.id] : undefined;
  const currentComplete = currentAnswered
    ? currentAnswered.type === "qcm"
      ? currentAnswered.selected.length > 0
      : currentAnswered.answer.trim().length > 0
    : false;

  // ── Loading / Error ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.neuralBg}>
          <NeuralCanvas variant="fullscreen" density="dense" />
        </div>
        <div className={styles.centerMessage}>Chargement du quiz...</div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.neuralBg}>
          <NeuralCanvas variant="fullscreen" density="dense" />
        </div>
        <div className={styles.centerMessage}>{error ?? "Quiz introuvable"}</div>
      </div>
    );
  }

  // ── Finished screen ───────────────────────────────────────────────

  if (finished) {
    return <QuizResultScreen score={score} maxScore={maxScore} percentage={resultPercentage} />;
  }

  if (!currentQuestion) return null;

  const isQCM = currentQuestion.type === "qcm";
  const q = isQCM ? (currentQuestion as SanitizedQCMQuestion) : null;
  const currentQCMSelection = currentAnswered?.type === "qcm" ? currentAnswered.selected : [];
  const currentOpenAnswer = currentAnswered?.type === "open" ? currentAnswered.answer : "";

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.neuralBg}>
        <NeuralCanvas variant="fullscreen" density="dense" />
      </div>

      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <Link href="/quiz" className={styles.breadcrumbLink}>← Quiz</Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{quiz.title}</span>
        </div>
        <div className={styles.topRight} />
      </div>

      {/* Progress bar */}
      <div className={styles.progressBar} style={{ width: `${progress}%` }} />

      {/* Cards container */}
      <div className={styles.cardsContainer}>
        <div className={styles.cardsRow}>
          {/* Question card */}
          <div className={`${styles.brutalCard} ${styles.cardQuestionCol} ${animatingId ? styles.isAnimating : ""}`}>
            <div className={styles.cardFrame} />
            <div className={styles.questionInner}>
              <div className={styles.questionTypeBadge}>
                {isQCM ? "QCM" : "Question ouverte"}
              </div>
              <div className={styles.questionText}>
                {displayedText}
              </div>
            </div>
          </div>

          {/* Answers card */}
          <div className={`${styles.brutalCard} ${styles.cardAnswersCol}`}>
            <div className={styles.cardFrame} />
            <div className={styles.cardLabel}>
              {isQCM ? "Sélectionne une ou plusieurs réponses" : "Écris ta réponse"}
            </div>

            {isQCM && q ? (
              <div className={styles.qcmList}>
                {q.options.map((opt, idx) => {
                  const isSelected = currentQCMSelection.includes(opt.id);
                  const displayAnswer = displayedAnswers ? displayedAnswers[idx] : opt.text;
                  return (
                    <div
                      key={idx}
                      className={`${styles.qcmItem} ${isSelected ? styles.selected : ""}`}
                      onClick={() => handleQCMToggle(opt.id)}
                    >
                      <div className={`${styles.qcmCheck} ${isSelected ? styles.checked : ""}`}>
                        {isSelected ? "✓" : ""}
                      </div>
                      <span className={styles.qcmLetter}>{LETTERS[idx]}</span>
                      <span className={styles.qcmText}>{displayAnswer}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <textarea
                className={styles.openInput}
                placeholder="Écris ta réponse ici..."
                value={currentOpenAnswer}
                onChange={(e) => handleOpenAnswer(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Navigation card */}
        <div className={`${styles.brutalCard} ${styles.cardNavRow}`}>
          <div className={styles.cardFrame} />
          <div className={styles.navInner}>
            <button
              className={styles.navBtn}
              onClick={prevQuestion}
              disabled={currentIdx === 0 || (paused && pendingIdxRef.current !== null)}
            >
              ← Précédent
            </button>

            <div className={styles.navDots}>
              {quiz.questions.map((_, idx) => {
                const ans = answers[quiz.questions[idx].id];
                const isAnswered = ans
                  ? ans.type === "qcm"
                    ? ans.selected.length > 0
                    : ans.answer.trim().length > 0
                  : false;
                return (
                  <button
                    key={idx}
                    className={`${styles.dot} ${idx === currentIdx ? styles.dotActive : ""} ${isAnswered ? styles.dotAnswered : ""}`}
                    onClick={() => navigateTo(idx)}
                  />
                );
              })}
            </div>

            {currentIdx < totalQuestions - 1 ? (
              <button
                className={`${styles.navBtn} ${styles.navBtnPrimary}`}
                onClick={nextQuestion}
                disabled={!currentComplete || (paused && pendingIdxRef.current !== null)}
              >
                Suivant →
              </button>
            ) : (
              <button
                className={`${styles.navBtn} ${styles.navBtnSubmit}`}
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
              >
                {submitting
                  ? "Correction en cours..."
                  : allAnswered
                    ? "Soumettre"
                    : `Soumettre (${answeredCount}/${totalQuestions})`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
