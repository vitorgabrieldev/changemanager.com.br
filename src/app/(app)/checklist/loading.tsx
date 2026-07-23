import { SkeletonBone } from "@/components/ui/skeleton-bone";

const GROUPS = 3;
const ROWS_PER_GROUP = 4;

export default function ChecklistLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <SkeletonBone className="h-2 max-w-xs flex-1" />
        <SkeletonBone className="h-4 w-16" />
        <SkeletonBone className="ml-auto h-8 w-28" />
      </div>

      {Array.from({ length: GROUPS }).map((_, groupIndex) => (
        <div
          key={groupIndex}
          className="rounded-sm border border-border bg-surface shadow-sm"
        >
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <SkeletonBone className="h-5 w-24 !rounded-sm" />
          </div>
          <div>
            {Array.from({ length: ROWS_PER_GROUP }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0"
              >
                <SkeletonBone className="h-4 w-4 shrink-0" />
                <SkeletonBone className="h-4 w-48" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
