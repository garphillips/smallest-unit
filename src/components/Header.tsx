import { useEffect, useState } from 'react';
import { OFFWHITE, wowmeta } from '../theme';

const MESSAGES = ['SMALLEST UNIT', 'THE ANTIDOTE IS PLAY'];
const TYPE_MS = 85;
const DELETE_MS = 45;
const START_DELAY_MS = 400;
const HOLD_MS = 1800;

function Logo({ height }: { height: number }) {
  return (
    <svg width={(64 / 60) * height} height={height} viewBox="0 0 64 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Smallest unit logo" role="img">
      <path
        d="M31.3875 0H32.7366L32.7663 0.00477575C33.2313 0.0763344 33.7122 0.0889438 34.2072 0.16951C35.9122 0.446356 37.54 1.07756 38.9859 2.02238C40.38 2.93017 41.6809 4.37866 42.8697 5.569L47.4025 10.1063L64 26.7437V26.7648C62.7669 27.9528 61.5159 29.2424 60.3025 30.4585L53.5519 37.2181C51.3366 34.9119 49.0356 32.6106 46.7931 30.3247L46.8369 39.85L46.8488 43.4334C46.8531 44.4206 46.8803 45.4119 46.7844 46.3944C46.4166 49.8372 44.8766 53.0491 42.4228 55.4919C40.3669 57.5859 37.7488 59.0403 34.8844 59.6797C34.4366 59.78 33.9834 59.8556 33.5272 59.9063C33.3438 59.9259 32.7606 59.9666 32.6191 60H31.2214C30.9729 59.9416 30.1251 59.8909 29.7459 59.8281C28.1372 59.5613 26.5963 58.9816 25.2105 58.1222C23.6701 57.1619 22.0903 55.4166 20.7787 54.1031L15.8033 49.1119L6.07569 39.3653C4.0615 37.3497 2.03107 35.265 0 33.2766V33.2588C0.27312 33.0256 0.817569 32.4475 1.08924 32.1759L3.27988 29.9835L10.5129 22.7311L32.4381 45.0825C32.3513 43.8181 32.3284 42.3928 32.2788 41.1141L32.0059 34.0675C31.9563 32.775 31.92 31.4444 31.8497 30.1558L17.3731 29.6454L17.3042 20.3846L17.2735 16.7539C17.2657 15.7668 17.2303 14.7792 17.3045 13.7952C17.5262 11.0168 18.5322 8.35841 20.2057 6.12944C22.3225 3.25837 25.3808 1.22224 28.8462 0.376669C29.3917 0.248067 29.9444 0.152628 30.5014 0.0908738C30.7787 0.0588681 31.0909 0.0451159 31.3578 0.00469278L31.3875 0ZM31.8588 30.1502L46.6859 30.216L35.6597 18.9765L32.8319 16.0923C32.6484 15.9057 31.7956 15.0069 31.6322 14.8909L31.8588 30.1502Z"
        fill={OFFWHITE}
      />
    </svg>
  );
}

type Phase = 'typing' | 'deleting';

export function Header() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [chars, setChars] = useState(0);
  const [phase, setPhase] = useState<Phase>('typing');
  const message = MESSAGES[msgIndex];

  useEffect(() => {
    if (phase === 'typing') {
      if (chars < message.length) {
        const t = window.setTimeout(() => setChars((n) => n + 1), chars === 0 ? START_DELAY_MS : TYPE_MS);
        return () => clearTimeout(t);
      }
      const t = window.setTimeout(() => setPhase('deleting'), HOLD_MS);
      return () => clearTimeout(t);
    }
    // deleting
    if (chars > 0) {
      const t = window.setTimeout(() => setChars((n) => n - 1), DELETE_MS);
      return () => clearTimeout(t);
    }
    setMsgIndex((i) => (i + 1) % MESSAGES.length);
    setPhase('typing');
  }, [phase, chars, message]);

  return (
    <div className="header-bar">
      <Logo height={28} />
      <div style={{ font: wowmeta(13), letterSpacing: '0.08em', color: OFFWHITE, whiteSpace: 'pre' }}>
        {message.slice(0, chars)}
        <span className="type-caret" />
      </div>
    </div>
  );
}
