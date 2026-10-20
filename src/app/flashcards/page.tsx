'use client';

import { useEffect, useState, useCallback } from 'react';
import { GridCell, CellContent, TextScramble, WordMarquee } from '@/components/design-system';
import styles from './page.module.css';

interface FlashcardDeckEntry {
  slug: string;
  title: string;
  tags: string[];
  difficulty: string;
  wikiRef: string;
  cardCount: number;
}

const PER_PAGE = 5;

export default function FlashcardListPage() {
  const [decks, setDecks] = useState<FlashcardDeckEntry[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/flashcards/catalog')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setDecks(data.decks ?? data.flashcards ?? []);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(decks.length / PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const pageDecks = decks.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);

  const showPrev = safePage > 0;
  const showNext = safePage < totalPages - 1;

  const goPrev = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const goNext = useCallback(() => setPage((p) => Math.min(totalPages - 1, p + 1)), [totalPages]);

  // Build the 5 cells from pageDecks, fill remainder with "???"
  const deckCells: Array<{ glyph: string; label: string; href?: string }> = [];
  for (let i = 0; i < PER_PAGE; i++) {
    if (i < pageDecks.length) {
      const deck = pageDecks[i];
      deckCells.push({
        glyph: deck.title,
        label: `${deck.difficulty} · ${deck.cardCount} carte${deck.cardCount > 1 ? 's' : ''}`,
        href: `/flashcards/${deck.slug}`,
      });
    } else {
      deckCells.push({ glyph: '???', label: '???' });
    }
  }

  // Grid positions for the 5 middle cells
  const cellPositions = [
    { column: '1 / span 4', row: '2' },
    { column: '5 / span 4', row: '2' },
    { column: '9 / span 4', row: '2' },
    { column: '1 / span 4', row: '3' },
    { column: '5 / span 4', row: '3' },
  ];

  if (loading) {
    return (
      <div className={styles.flashcardsPage}>
        <div className={styles.flashcardsGrid}>
          <GridCell column="1 / span 12" row="1" variant="logo">
            <WordMarquee />
            <CellContent glyph="Flashcards disponibles" />
          </GridCell>
          <GridCell column="1 / span 4" row="2">
            <CellContent glyph="Chargement..." />
          </GridCell>
          <GridCell column="1 / span 4" row="3">
            <CellContent glyph="..." />
          </GridCell>
          <GridCell column="9 / span 2" row="3" variant="secondary-cta">
            <CellContent glyph="←" variant="secondary-cta" />
          </GridCell>
          <GridCell column="11 / span 2" row="3" variant="secondary-cta">
            <CellContent glyph="→" variant="secondary-cta" />
          </GridCell>
          <GridCell column="1 / span 6" row="4" href="/" variant="cta">
            <CellContent glyph="← Retour" label="Page d'accueil" variant="cta" />
          </GridCell>
          <GridCell column="7 / span 6" row="4">
            <CellContent glyph="..." label="..." />
          </GridCell>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.flashcardsPage}>
      <div className={styles.flashcardsGrid}>
        {/* Header row - Title with WordMarquee background */}
        <GridCell column="1 / span 12" row="1" variant="logo">
          <WordMarquee />
          <CellContent glyph="Flashcards disponibles" />
        </GridCell>

        {/* 5 middle sections - deck cells */}
        {deckCells.map((cell, i) => (
          <GridCell
            key={i}
            column={cellPositions[i].column}
            row={cellPositions[i].row}
            href={cell.href}
          >
            <CellContent
              glyph={cell.glyph}
              label={<TextScramble active>{cell.label}</TextScramble>}
            />
          </GridCell>
        ))}

        {/* Navigation: previous */}
        <GridCell
          column="9 / span 2"
          row="3"
          variant="secondary-cta"
          onClick={showPrev ? goPrev : undefined}
          style={!showPrev ? { opacity: 0.3, cursor: 'default' } as React.CSSProperties : undefined}
        >
          <CellContent glyph="←" variant="secondary-cta" />
        </GridCell>

        {/* Navigation: next */}
        <GridCell
          column="11 / span 2"
          row="3"
          variant="secondary-cta"
          onClick={showNext ? goNext : undefined}
          style={!showNext ? { opacity: 0.3, cursor: 'default' } as React.CSSProperties : undefined}
        >
          <CellContent glyph="→" variant="secondary-cta" />
        </GridCell>

        {/* Row 4: CTA (left) and stat (right) */}
        <GridCell column="1 / span 6" row="4" href="/" variant="cta">
          <CellContent
            glyph="← Retour"
            label="Page d'accueil"
            variant="cta"
          />
        </GridCell>

        <GridCell column="7 / span 6" row="4">
          <CellContent
            glyph={`${decks.length} deck${decks.length > 1 ? 's' : ''}`}
            label={`Page ${safePage + 1} / ${totalPages}`}
          />
        </GridCell>
      </div>
    </div>
  );
}
