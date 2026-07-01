export default function PublicMerchantLoading() {
  return (
    <div className="public-flow w-full bg-zinc-900">
      <div className="mx-auto flex w-full max-w-lg animate-pulse flex-col gap-5">
        <div className="flex items-center gap-3 px-1">
          <div className="h-12 w-12 rounded-sm bg-white/20" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded-sm bg-white/25" />
            <div className="h-3 w-20 rounded-sm bg-white/15" />
          </div>
        </div>
        <div className="h-2 rounded-full bg-white/15" />
        <div className="rounded-sm border border-white/20 bg-white p-6">
          <div className="mx-auto h-6 w-40 rounded-sm bg-zinc-200" />
          <div className="mt-6 space-y-3">
            <div className="h-12 w-full rounded-sm bg-zinc-100" />
            <div className="h-12 w-full rounded-sm bg-zinc-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
