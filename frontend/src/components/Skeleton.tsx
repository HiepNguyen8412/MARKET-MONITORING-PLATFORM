import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div className={clsx(
      "animate-pulse bg-white/5 rounded-2xl",
      className
    )} />
  );
};
