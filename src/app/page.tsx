'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { NeuralCanvas, LogoBlock, GridCell, CellContent, MobileSection, CursorTrail, TextScramble } from '@/components/design-system';
import styles from './page.module.css';

export default function HomePage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  // Desktop view
  const desktopView = (
    <div className={`${styles.homeDesktop} desktop-only`}>
      <div className={styles.homeGrid}>
        {/* Row 1 */}
        <GridCell column="1 / span 3" row="1" href="/quiz">
          <CellContent
            glyph="QZ"
            label={<TextScramble active>QCMs, questions ouvertes avec correction IA basés sur mes notes de cours</TextScramble>}
          />
        </GridCell>

        <GridCell column="4 / span 3" row="1" href="#">
          <CellContent
            glyph="???"
            label={<TextScramble active>???</TextScramble>}
          />
        </GridCell>

        <GridCell column="7 / span 3" row="1" href="#">
          <CellContent
            glyph="???"
            label={<TextScramble active>???</TextScramble>}
          />
        </GridCell>

        <GridCell column="10 / span 3" row="1" href="#">
          <CellContent
            glyph="???"
            label={<TextScramble active>???</TextScramble>}
          />
        </GridCell>

        {/* Row 2 */}
        <GridCell column="1 / span 3" row="2" href="#">
          <CellContent
            glyph="???"
            label={<TextScramble active>???</TextScramble>}
          />
        </GridCell>

        <GridCell column="4 / span 6" row="2 / span 2" variant="logo">
          <NeuralCanvas variant="cell" />
          <LogoBlock />
        </GridCell>

        <GridCell column="10 / span 3" row="2" href="#">
          <CellContent
            glyph="???"
            label={<TextScramble active>???</TextScramble>}
          />
        </GridCell>

        {/* Row 3 */}
        <GridCell column="1 / span 3" row="3" href="#">
          <CellContent
            glyph="???"
            label={<TextScramble active>???</TextScramble>}
          />
        </GridCell>

        <GridCell column="10 / span 3" row="3" href="#">
          <CellContent
            glyph="???"
            label={<TextScramble active>???</TextScramble>}
          />
        </GridCell>

        {/* Row 4 */}
        <GridCell column="1 / span 4" row="4">
          <CellContent
            glyph="???"
            label={<TextScramble active>???</TextScramble>}
          />
        </GridCell>

        <GridCell column="5 / span 4" row="4">
          <CellContent
            glyph="???"
            label={<TextScramble active>???</TextScramble>}
          />
        </GridCell>

        <GridCell column="9 / span 4" row="4" href="/quiz" variant="cta">
          <CellContent
            glyph="???"
            label={<TextScramble active>???</TextScramble>}
            variant="cta"
          />
        </GridCell>
      </div>

    </div>
  );

  // Mobile view
  const mobileView = (
    <div className={`${styles.homeMobile} mobile-only`}>
      <NeuralCanvas variant="fullscreen" />

      {/* Section 0: Logo */}
      <MobileSection isCentered>
        <LogoBlock />
      </MobileSection>

      {/* Section 1: Quiz */}
      <MobileSection>
        <Link href="/quiz" style={{ width: '100%' }}>
          <CellContent
            glyph="QZ"
            label={<TextScramble active>QCMs, questions ouvertes avec correction IA basés sur mes notes de cours</TextScramble>}
          />
        </Link>
      </MobileSection>

      {/* Section 2: Analyse */}
      <MobileSection>
        <CellContent
          glyph="???"
          label={<TextScramble active>???</TextScramble>}
        />
      </MobileSection>

      {/* Section 3: Flash */}
      <MobileSection>
        <CellContent
          glyph="???"
          label={<TextScramble active>???</TextScramble>}
        />
      </MobileSection>

      {/* Section 4: Competition */}
      <MobileSection>
        <CellContent
          glyph="???"
          label={<TextScramble active>???</TextScramble>}
        />
      </MobileSection>

      {/* Section 5: Generer */}
      <MobileSection>
        <CellContent
          glyph="???"
          label={<TextScramble active>???</TextScramble>}
        />
      </MobileSection>

      {/* Section 6: Stats */}
      <MobileSection>
        <CellContent
          glyph="???"
          label={<TextScramble active>???</TextScramble>}
        />
      </MobileSection>

      {/* Section 7: Corriger */}
      <MobileSection>
        <CellContent
          glyph="???"
          label={<TextScramble active>???</TextScramble>}
        />
      </MobileSection>

      {/* Section 8: Reviser */}
      <MobileSection>
        <CellContent
          glyph="???"
          label={<TextScramble active>???</TextScramble>}
        />
      </MobileSection>

      {/* Section 9: CTA */}
      <MobileSection>
        <Link href="/quiz" style={{ width: '100%' }}>
          <CellContent
            glyph="???"
            label={<TextScramble active>???</TextScramble>}
          />
        </Link>
      </MobileSection>

    </div>
  );

  return (
    <>
      <CursorTrail />
      {isMobile ? mobileView : desktopView}
    </>
  );
}