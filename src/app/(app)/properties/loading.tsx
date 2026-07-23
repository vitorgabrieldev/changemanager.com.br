import { SkeletonBone } from "@/components/ui/skeleton-bone";

const ROWS = 6;
const COLUMN_WIDTHS = ["w-40", "w-16", "w-16", "w-16", "w-24"];

export default function PropertiesLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <SkeletonBone className="h-6 w-56" />
        <SkeletonBone className="h-8 w-32" />
      </div>

      <div className="overflow-hidden rounded-sm border border-border bg-surface p-2 shadow-sm">
        <div className="flex items-center gap-4 border-b border-border px-3 py-3">
          {COLUMN_WIDTHS.map((w, i) => (
            <SkeletonBone key={i} className={`h-4 ${w}`} />
          ))}
        </div>
        {Array.from({ length: ROWS }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center gap-4 border-b border-border px-3 py-3 last:border-b-0"
          >
            {COLUMN_WIDTHS.map((w, i) => (
              <SkeletonBone key={i} className={`h-4 ${w}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
