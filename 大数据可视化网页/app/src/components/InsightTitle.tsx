import type { ReactNode } from 'react';

interface Props {
  emoji: string;
  children: ReactNode;
  className?: string;
}

/** 卡片小标题：emoji + 文字 */
export function InsightTitle({ emoji, children, className = '' }: Props) {
  return (
    <h4 className={`font-semibold mb-1 flex items-center gap-1.5 ${className}`}>
      <span aria-hidden>{emoji}</span>
      <span>{children}</span>
    </h4>
  );
}
