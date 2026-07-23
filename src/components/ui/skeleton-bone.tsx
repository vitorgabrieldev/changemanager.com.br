export function SkeletonBone({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-sm bg-surface-muted ${className ?? ""}`}
    />
  );
}
