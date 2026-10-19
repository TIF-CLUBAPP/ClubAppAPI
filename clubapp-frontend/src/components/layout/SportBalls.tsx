import type { FC, ReactNode } from 'react';

export interface SportBallProps {
  size?: number;
  className?: string;
}

export type SportBallIcon = FC<SportBallProps>;

interface BallSvgProps extends SportBallProps {
  children: ReactNode;
}

const BallSvg: FC<BallSvgProps> = ({ size = 24, className, children }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

// Fútbol: balón con pentágono central y costuras radiales.
export const FootballBall: SportBallIcon = ({ size, className }) => (
  <BallSvg size={size} className={className}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 8.2 L15.6 10.8 L14.25 15 L9.75 15 L8.4 10.8 Z" />
    <path d="M12 8.2 V2.5" />
    <path d="M15.6 10.8 L20.5 7.2" />
    <path d="M14.25 15 L17.3 19.4" />
    <path d="M9.75 15 L6.7 19.4" />
    <path d="M8.4 10.8 L3.5 7.2" />
  </BallSvg>
);

// Tenis: pelota con las dos costuras curvas características.
export const TennisBall: SportBallIcon = ({ size, className }) => (
  <BallSvg size={size} className={className}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M3.5 7.6 c3 2.4 5.4 3.9 8.5 3.9 s5.5 -1.5 8.5 -3.9" />
    <path d="M3.5 16.4 c3 -2.4 5.4 -3.9 8.5 -3.9 s5.5 1.5 8.5 3.9" />
  </BallSvg>
);

// Básquet: balón con costura vertical, horizontal y dos curvas laterales.
export const BasketballBall: SportBallIcon = ({ size, className }) => (
  <BallSvg size={size} className={className}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 2.5 V21.5" />
    <path d="M2.5 12 H21.5" />
    <path d="M5.5 5.5 c1.8 1.7 4 2.6 6.5 2.6 s4.7 -0.9 6.5 -2.6" />
    <path d="M5.5 18.5 c1.8 -1.7 4 -2.6 6.5 -2.6 s4.7 0.9 6.5 2.6" />
  </BallSvg>
);

// Pádel: como la de tenis pero con el punto central (marca) para distinguirla.
export const PadelBall: SportBallIcon = ({ size, className }) => (
  <BallSvg size={size} className={className}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M3.5 7.6 c3 2.4 5.4 3.9 8.5 3.9 s5.5 -1.5 8.5 -3.9" />
    <path d="M3.5 16.4 c3 -2.4 5.4 -3.9 8.5 -3.9 s5.5 1.5 8.5 3.9" />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
  </BallSvg>
);

// Vóley: balón con tres paneles curvos.
export const VolleyballBall: SportBallIcon = ({ size, className }) => (
  <BallSvg size={size} className={className}>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 2.5 c4.2 2.6 6.6 5.8 6.6 9.5 s-2.4 6.9 -6.6 9.5" />
    <path d="M12 2.5 C7.8 5.1 5.4 8.3 5.4 12 s2.4 6.9 6.6 9.5" />
    <path d="M5.4 6.4 c2.2 1.3 4.3 2.9 6.6 2.9 s4.4 -1.6 6.6 -2.9" />
  </BallSvg>
);
