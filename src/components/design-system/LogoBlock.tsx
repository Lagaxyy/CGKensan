import Link from 'next/link';

interface LogoBlockProps {
  href?: string;
  size?: 'full' | 'small';
}

export function LogoBlock({ href, size = 'full' }: LogoBlockProps) {
  const isSmall = size === 'small';
  
  const textStyle: React.CSSProperties = {
    fontSize: isSmall 
      ? 'clamp(28px, 3.5vw, 48px)' 
      : 'clamp(44px, 5.5vw, 80px)',
    fontWeight: 700,
    lineHeight: 0.9,
    letterSpacing: '-0.04em',
    color: 'var(--fg)',
    animation: 'logoBreathe 6s ease-in-out infinite',
  };

  const subStyle: React.CSSProperties = {
    fontFamily: "'Instrument Serif', serif",
    fontStyle: 'italic',
    fontSize: isSmall 
      ? 'clamp(10px, 1vw, 14px)' 
      : 'clamp(13px, 1.4vw, 20px)',
    color: 'var(--fg-dim)',
    marginTop: isSmall ? 6 : 10,
    letterSpacing: '0.08em',
  };

  const tagStyle: React.CSSProperties = {
    fontSize: isSmall ? 8 : 10,
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    color: 'var(--fg-dim)',
    marginTop: isSmall ? 4 : 6,
    opacity: 0.6,
  };

  const container: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  };

  const content = (
    <>
      <div style={textStyle}>CGkensan</div>
      <div style={subStyle}>Kensan / 研修</div>
      <div style={tagStyle}>L&apos;art d&apos;apprendre</div>
    </>
  );

  if (href) {
    return (
      <Link href={href} style={container}>
        {content}
      </Link>
    );
  }

  return <div style={container}>{content}</div>;
}
