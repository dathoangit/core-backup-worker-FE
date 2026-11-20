import { wbClass } from './wallboard-theme';

type StatusPulseDotVariant = 'live' | 'scheduleOk' | 'warn' | 'error' | 'neutral';

type StatusPulseDotProps = {
  variant: StatusPulseDotVariant;
  className?: string;
};

const CORE: Record<StatusPulseDotVariant, string> = {
  live: wbClass.dotOk,
  scheduleOk: wbClass.dotOk,
  warn: wbClass.dotWarn,
  error: wbClass.dotErr,
  neutral: wbClass.dotNeutral,
};

const RING: Record<StatusPulseDotVariant, string> = {
  live: wbClass.dotOk,
  scheduleOk: wbClass.dotOk,
  warn: wbClass.dotWarn,
  error: wbClass.dotErr,
  neutral: wbClass.dotNeutral,
};

const PULSE: Record<StatusPulseDotVariant, boolean> = {
  live: true,
  scheduleOk: true,
  warn: false,
  error: false,
  neutral: false,
};

/** Flat 2D status dot; live / on-schedule variants use a soft ring pulse. */
export function StatusPulseDot({ variant, className = '' }: StatusPulseDotProps) {
  const pulse = PULSE[variant];
  const size =
    variant === 'live' ? 'h-2 w-2' : variant === 'scheduleOk' ? 'h-1.5 w-1.5' : 'h-1.5 w-1.5';

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${size} ${className}`}
      aria-hidden="true">
      {pulse ? (
        <>
          <span
            className={`absolute inset-0 rounded-full opacity-60 ${RING[variant]} animate-live-ring motion-reduce:animate-none`}
          />
          <span
            className={`relative rounded-full ${size} ${CORE[variant]} animate-live-core motion-reduce:animate-none`}
          />
        </>
      ) : (
        <span className={`rounded-full ${size} ${CORE[variant]}`} />
      )}
    </span>
  );
}
