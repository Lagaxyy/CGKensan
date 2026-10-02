'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { NeuralCanvas, TextScramble } from '@/components/design-system';
import styles from './page.module.css';
import shared from '@/styles/shared.module.css';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [pseudo, setPseudo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [startScramble, setStartScramble] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Card opens after 1.5s
    const cardTimer = setTimeout(() => setIsVisible(true), 200);
    // Scramble starts 0.5s after card opens = 2s
    const scrambleTimer = setTimeout(() => setStartScramble(true), 300);
    return () => {
      clearTimeout(cardTimer);
      clearTimeout(scrambleTimer);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      pseudo,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Pseudo ou mot de passe incorrect.');
      setLoading(false);
      return;
    }

    router.push("/");
  }

  return (
    <div className={styles.loginPage}>
      {/* Neural Canvas Background */}
      <div className={styles.canvasBg}>
        <NeuralCanvas variant="fullscreen" />
      </div>

      {/* Main container */}
      <div className={styles.loginContainer}>
        {/* Form card - brutalist style with entrance animation */}
        <div className={`${shared.formCard} ${styles.loginCard} ${isVisible ? styles.visible : ''}`} data-scramble={startScramble ? 'true' : 'false'}>
          <div className={shared.cardFrame} />

          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>
              <TextScramble>CONNEXION</TextScramble>
            </h1>
            <p className={styles.formSubtitle}>
              <TextScramble>Accède à ton espace</TextScramble>
            </p>
          </div>

          {error && (
            <div className={shared.errorBox}>
              <TextScramble>{error}</TextScramble>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <div className={shared.formGroup}>
              <label>
                <TextScramble>PSEUDO</TextScramble>
              </label>
              <input
                type="text"
                required
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder="ton pseudo"
              />
            </div>

            <div className={shared.formGroup}>
              <label>
                <TextScramble>MOT DE PASSE</TextScramble>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className={shared.submitBtn}>
              {loading ? (
                <TextScramble>Connexion...</TextScramble>
              ) : (
                <TextScramble>SE CONNECTER</TextScramble>
              )}
            </button>
          </form>

          <div className={styles.formFooter}>
            <span className={styles.footerText}>
              <TextScramble>Pas de compte ?</TextScramble>
            </span>
            <Link href="/register" className={styles.registerLink}>
              <TextScramble>S&apos;INSCRIRE</TextScramble>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
