import type { LucideIcon } from 'lucide-react';
import type { AccentKey } from '../theme/foodDecor';
import { accentStyles } from '../theme/foodDecor';

interface Props {
  emoji: string;
  icon: LucideIcon;
  kicker: string;
  title: string;
  accent?: AccentKey;
  description?: string;
  note?: string;
  align?: 'left' | 'center';
}

export function SectionHeader({
  emoji,
  icon: Icon,
  kicker,
  title,
  accent = 'amber',
  description,
  note,
  align = 'left',
}: Props) {
  const styles = accentStyles[accent];
  const centered = align === 'center';

  return (
    <div className={`mb-6 ${centered ? 'text-center' : ''}`}>
      <div
        className={`flex flex-wrap items-center gap-2 sm:gap-3 mb-3 ${
          centered ? 'justify-center' : ''
        }`}
      >
        <span
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm text-xl select-none"
          aria-hidden
        >
          {emoji}
        </span>
        <span
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider ${styles.badge}`}
        >
          <Icon className={`w-3.5 h-3.5 ${styles.icon}`} />
          {kicker}
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400">
          <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
          <span className={`h-1.5 w-1.5 rounded-full ${styles.dot} opacity-60`} />
          <span className={`h-1.5 w-1.5 rounded-full ${styles.dot} opacity-30`} />
        </span>
      </div>
      <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 leading-tight">{title}</h2>
      {description && (
        <p className={`text-slate-600 max-w-3xl mb-2 leading-relaxed ${centered ? 'mx-auto' : ''}`}>
          {description}
        </p>
      )}
      {note && (
        <p className={`text-xs text-slate-500 max-w-3xl ${centered ? 'mx-auto' : ''}`}>{note}</p>
      )}
    </div>
  );
}
