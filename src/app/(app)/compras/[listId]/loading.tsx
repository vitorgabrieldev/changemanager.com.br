import { SkeletonBone } from "@/components/ui/skeleton-bone";

const CARDS = 8;

export default function ShoppingListLoading() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonBone className="h-3 w-20" />

      <div className="flex items-center justify-between gap-4 rounded-sm border border-border bg-surface p-5 shadow-sm">
        <div className="flex-1">
          <SkeletonBone className="mb-2 h-5 w-40" />
          <SkeletonBone className="h-2 max-w-xs" />
        </div>
        <SkeletonBone className="h-8 w-28" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: CARDS }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-sm border border-border bg-surface shadow-sm">
            <SkeletonBone className="aspect-video w-full !rounded-none" />
            <div className="flex flex-col gap-2 p-4">
              <SkeletonBone className="h-4 w-3/4" />
              <SkeletonBone className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
