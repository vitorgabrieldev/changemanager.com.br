export function SkeletonBone({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-muted ${className ?? ""}`}
    />
  );
}
