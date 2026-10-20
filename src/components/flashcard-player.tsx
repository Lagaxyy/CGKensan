"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { NeuralCanvas } from "@/components/design-system/NeuralCanvas";
import styles from "./FlashcardPlayer.module.css";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface FlashcardDeck {
  slug: string;
  title: string;
  wikiRef: string;
  tags: string[];
  difficulty: string;
  created: string;
  cards: Flashcard[];
}

interface FlashcardPlayerProps {
  slug: string;
}

/**
 * Rendu inline minimal du markdown présent dans les notes (gras, italique, code).
 * Le texte reste échappé par React : aucun HTML brut n'est injecté.
 */
function renderInlineMarkdown(text: string) {
  const tokens = text
    .split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g)
    .filter(Boolean);

  return tokens.map((token, idx) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={idx}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith("`") && token.endsWith("`")) {
      return (
        <code key={idx} className={styles.inlineCode}>
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      return <em key={idx}>{token.slice(1, -1)}</em>;
    }
    return <span key={idx}>{token}</span>;
  });
}

function FormattedText({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <span>
      {lines.map((line, idx) => (
        <span key={idx}>
          {renderInlineMarkdown(line)}
          {idx < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </span>
  );
}

export default function FlashcardPlayer({ slug }: FlashcardPlayerProps) {
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);

  const cards = useMemo(() => deck?.cards ?? [], [deck]);
  const totalCards = cards.length;
  const currentCard = cards[currentIdx] ?? null;

  // ── Fetch deck from API ───────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function fetchDeck() {
      try {
        const res = await fetch(`/api/flashcards/${slug}`);
        if (!res.ok) {
          if (!cancelled) setError("Deck introuvable");
          return;
        }
        const data: FlashcardDeck = await res.json();
        if (!cancelled) setDeck(data);
      } catch {
        if (!cancelled) setError("Erreur lors du chargement des flashcards");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDeck();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ── Navigation ────────────────────────────────────────────────────

  const goTo = useCallback(
    (targetIdx: number) => {
      if (totalCards === 0) return;
      const nextIdx = Math.min(Math.max(targetIdx, 0), totalCards - 1);
      setCurrentIdx(nextIdx);
      setFlipped(false);
    },
    [totalCards]
  );

  const nextCard = useCallback(() => {
    if (currentIdx < totalCards - 1) goTo(currentIdx + 1);
  }, [currentIdx, totalCards, goTo]);

  const prevCard = useCallback(() => {
    if (currentIdx > 0) goTo(currentIdx - 1);
  }, [currentIdx, goTo]);

  const toggleFlip = useCallback(() => {
    if (!currentCard) return;
    setFlipped((value) => !value);
    setReviewed((prev) => {
      if (prev.has(currentCard.id)) return prev;
      const next = new Set(prev);
      next.add(currentCard.id);
      return next;
    });
  }, [currentCard]);

  const restart = useCallback(() => {
    setCurrentIdx(0);
    setFlipped(false);
    setReviewed(new Set());
    setFinished(false);
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────

  useEffect(() => {
    if (!deck || finished) return;

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        return;
      }

      const isInteractive = Boolean(
        target?.closest("button, a, input, textarea, select, [role='button']")
      );

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        nextCard();
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        prevCard();
      } else if (event.code === "Space" || event.key === "Enter") {
        // Laisse les contrôles natifs (boutons, liens) gérer leur activation.
        if (isInteractive) return;
        event.preventDefault();
        toggleFlip();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deck, finished, nextCard, prevCard, toggleFlip]);

  // ── Loading / Error ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.neuralBg}>
          <NeuralCanvas variant="fullscreen" density="dense" />
        </div>
        <div className={styles.centerMessage}>Chargement des flashcards...</div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.neuralBg}>
          <NeuralCanvas variant="fullscreen" density="dense" />
        </div>
        <div className={styles.centerMessage}>{error ?? "Deck introuvable"}</div>
      </div>
    );
  }

  if (totalCards === 0) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.neuralBg}>
          <NeuralCanvas variant="fullscreen" density="dense" />
        </div>
        <div className={styles.centerMessage}>
          Ce deck ne contient aucune carte pour le moment.
        </div>
      </div>
    );
  }

  // ── Finished screen ───────────────────────────────────────────────

  if (finished) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.neuralBg}>
          <NeuralCanvas variant="fullscreen" density="dense" />
        </div>

        <div className={styles.finishContainer}>
          <div className={styles.finishCard}>
            <div className={styles.finishLabel}>Session terminée</div>
            <h1 className={styles.finishTitle}>{deck.title}</h1>
            <p className={styles.finishText}>
              {reviewed.size} / {totalCards}{" "}
              {totalCards > 1 ? "cartes retournées" : "carte retournée"}
            </p>

            <div className={styles.finishActions}>
              <button
                type="button"
                className={`${styles.finishBtn} ${styles.finishBtnSecondary}`}
                onClick={restart}
              >
                Recommencer
              </button>
              <Link
                href="/flashcards"
                className={`${styles.finishBtn} ${styles.finishBtnPrimary}`}
              >
                Retour aux flashcards
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentIdx + 1) / totalCards) * 100;
  const isLastCard = currentIdx === totalCards - 1;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.neuralBg}>
        <NeuralCanvas variant="fullscreen" density="dense" />
      </div>

      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <Link href="/flashcards" className={styles.breadcrumbLink}>
            ← Flashcards
          </Link>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbCurrent}>{deck.title}</span>
        </div>
        <div className={styles.topRight}>
          <span className={styles.counter}>
            {currentIdx + 1} / {totalCards}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressBar} style={{ width: `${progress}%` }} />

      <div className={styles.studyContainer}>
        {/* Deck metadata */}
        <div className={styles.deckHeader}>
          <span className={styles.deckDifficulty}>{deck.difficulty}</span>
          {deck.tags.map((tag) => (
            <span key={tag} className={styles.deckTag}>
              {tag}
            </span>
          ))}
        </div>

        {/* Flip card */}
        <button
          type="button"
          className={styles.cardScene}
          onClick={toggleFlip}
          aria-label={flipped ? "Afficher le recto" : "Afficher le verso"}
        >
          <div className={`${styles.cardInner} ${flipped ? styles.cardFlipped : ""}`}>
            <div
              className={`${styles.cardFace} ${styles.cardFront}`}
              aria-hidden={flipped}
            >
              <div className={styles.cardSide}>Recto</div>
              <div className={styles.cardText}>
                <FormattedText text={currentCard.front} />
              </div>
              <div className={styles.cardHint}>Clique pour révéler la réponse · Espace</div>
            </div>

            <div
              className={`${styles.cardFace} ${styles.cardBack}`}
              aria-hidden={!flipped}
            >
              <div className={styles.cardSide}>Verso</div>
              <div className={`${styles.cardText} ${styles.cardBackText}`}>
                <FormattedText text={currentCard.back} />
              </div>
              <div className={styles.cardHint}>Clique pour revenir au recto · Espace</div>
            </div>
          </div>
        </button>

        {/* Navigation */}
        <div className={styles.navCard}>
          <div className={styles.navInner}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={prevCard}
              disabled={currentIdx === 0}
            >
              ← Précédent
            </button>

            <div className={styles.navDots}>
              {cards.map((card, idx) => (
                <button
                  key={card.id}
                  type="button"
                  className={`${styles.dot} ${idx === currentIdx ? styles.dotActive : ""} ${reviewed.has(card.id) ? styles.dotReviewed : ""}`}
                  onClick={() => goTo(idx)}
                  aria-label={`Carte ${idx + 1}`}
                />
              ))}
            </div>

            {isLastCard ? (
              <button
                type="button"
                className={`${styles.navBtn} ${styles.navBtnPrimary}`}
                onClick={() => setFinished(true)}
              >
                Terminer ✓
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.navBtn} ${styles.navBtnPrimary}`}
                onClick={nextCard}
              >
                Suivant →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
