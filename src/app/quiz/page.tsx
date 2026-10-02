'use client';

import { useEffect, useState, useCallback } from 'react';
import { GridCell, CellContent, TextScramble, WordMarquee } from '@/components/design-system';
import styles from './page.module.css';

interface QuizEntry {
  slug: string;
  title: string;
  tags: string[];
  difficulty: string;
  wikiRef: string;
  questionCount: number;
}

const PER_PAGE = 5;

export default function QuizListPage() {
  const [quizzes, setQuizzes] = useState<QuizEntry[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/quiz/catalog')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setQuizzes(data.quizzes ?? []);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(quizzes.length / PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const pageQuizzes = quizzes.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);

  const showPrev = safePage > 0;
  const showNext = safePage < totalPages - 1;

  const goPrev = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const goNext = useCallback(() => setPage((p) => Math.min(totalPages - 1, p + 1)), [totalPages]);

  // Build the 5 cells from pageQuizzes, fill remainder with "???"
  const quizCells: Array<{ glyph: string; label: string; href?: string }> = [];
  for (let i = 0; i < PER_PAGE; i++) {
    if (i < pageQuizzes.length) {
      const q = pageQuizzes[i];
      quizCells.push({
        glyph: q.title,
        label: `${q.difficulty} · ${q.questionCount} questions`,
        href: `/quiz/${q.slug}`,
      });
    } else {
      quizCells.push({ glyph: '???', label: '???' });
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
      <div className={styles.quizPage}>
        <div className={styles.quizGrid}>
          <GridCell column="1 / span 12" row="1" variant="logo">
            <WordMarquee />
            <CellContent glyph="Quiz disponibles" />
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
    <div className={styles.quizPage}>
      <div className={styles.quizGrid}>
        {/* Header row - Title with WordMarquee background */}
        <GridCell column="1 / span 12" row="1" variant="logo">
          <WordMarquee />
          <CellContent glyph="Quiz disponibles" />
        </GridCell>

        {/* 5 middle sections - quiz cells */}
        {quizCells.map((cell, i) => (
          <GridCell
            key={i}
            column={cellPositions[i].column}
            row={cellPositions[i].row}
            href={cell.href}
          >
            <CellContent
              glyph={cell.glyph}
              label={cell.glyph !== '???'
                ? <TextScramble active>{cell.label}</TextScramble>
                : <TextScramble active>{cell.label}</TextScramble>
              }
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
            glyph={`${quizzes.length} quiz`}
            label={`Page ${safePage + 1} / ${totalPages}`}
          />
        </GridCell>
      </div>

    </div>
  );
}
