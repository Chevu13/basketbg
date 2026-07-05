export default function GatheringCardSkeleton() {
  return (
    <div className="bg-court-card border border-court-border rounded-[20px] overflow-hidden">
      <div className="h-[186px] bg-gradient-to-r from-court-card2 via-court-muted to-court-card2 bg-[length:800px_100%] animate-shimmer" />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex gap-1.5">
          <div className="h-[22px] w-[30%] bg-court-muted rounded-md animate-shimmer" />
          <div className="h-[22px] w-[22%] bg-court-muted rounded-md animate-shimmer" />
        </div>
        <div className="h-[42px] w-[40%] bg-court-muted rounded-md animate-shimmer" />
        <div className="h-1 bg-court-muted rounded-full animate-shimmer" />
      </div>
    </div>
  )
}
