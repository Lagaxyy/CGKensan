"use client";

import Link from "next/link";
import { NeuralCanvas } from "@/components/design-system/NeuralCanvas";
import styles from "./QuizResultScreen.module.css";

interface QuizResultScreenProps {
  score: number;
  maxScore: number;
  percentage: number;
}

export default function QuizResultScreen({
  score,
  maxScore,
  percentage,
}: QuizResultScreenProps) {
  const ratioText = `${score}/${maxScore}`;

  return (
    <div className={styles.resultPage}>
      <div className={styles.resultBg}>
        <NeuralCanvas variant="fullscreen" density="dense" />
      </div>

      <div className={styles.resultContent}>
        {/* Result card */}
        <div className={styles.resultCard}>
          <div className={styles.resultFrame} />
          <div className={styles.resultLabel}>Resultat</div>
          <div className={styles.resultScore}>
            <span className={styles.resultScoreNum}>{score}</span>
            <span className={styles.resultScoreTotal}>/{maxScore}</span>
          </div>
          <div className={styles.resultPct}>{percentage}%</div>
          <div className={styles.resultRatio}>{ratioText} bonnes reponses</div>
        </div>

        {/* Actions card */}
        <div className={styles.actionsCard}>
          <div className={styles.resultFrame} />
          <div className={styles.actionsRow}>
            <Link
              href="/quiz"
              className={`${styles.resultBtn} ${styles.resultBtnSecondary}`}
            >
              Retour au catalogue
            </Link>
            <Link
              href="/"
              className={`${styles.resultBtn} ${styles.resultBtnPrimary}`}
            >
              Voir le scoring en details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
