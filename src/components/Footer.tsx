import { OFFWHITE } from '../theme';

export function Footer() {
  return (
    <a
      className="credit-link"
      href="https://www.garphillips.com"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        alignSelf: 'flex-end',
        color: OFFWHITE,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      created by gareth
    </a>
  );
}
