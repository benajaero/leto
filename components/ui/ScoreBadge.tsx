import { scoreColor, scoreBgColor, scoreLabel } from '@/lib/formatters';

export function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  const ringSizes = {
    sm: 'w-10 h-10 text-[10px]',
    md: 'w-14 h-14 text-xs',
    lg: 'w-20 h-20 text-sm'
  };

  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${ringSizes[size]} flex items-center justify-center`}>
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="none" stroke="#1a1a24" strokeWidth="3" />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={scoreColor(score)}
          />
        </svg>
        <span className={`relative font-mono font-bold ${scoreColor(score)}`}>{score}</span>
      </div>
      <div className="flex flex-col">
        <span className={`font-mono font-semibold tracking-wider ${scoreColor(score)} ${sizeClasses[size]}`}>
          {scoreLabel(score)}
        </span>
      </div>
    </div>
  );
}
