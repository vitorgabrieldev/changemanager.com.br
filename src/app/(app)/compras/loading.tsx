import { SkeletonBone } from "@/components/ui/skeleton-bone";

const CARDS = 6;

export default function ShoppingListsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <SkeletonBone className="h-6 w-40" />
        <SkeletonBone className="h-8 w-32" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: CARDS }).map((_, i) => (
          <div key={i} className="rounded-sm border border-border bg-surface p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <SkeletonBone className="h-9 w-9 shrink-0" />
              <SkeletonBone className="h-4 w-32" />
            </div>
            <SkeletonBone className="mb-2 h-3 w-16" />
            <SkeletonBone className="h-2 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
