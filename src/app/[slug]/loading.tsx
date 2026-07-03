export default function PublicMerchantLoading() {
  return (
    <div className="public-flow w-full">
      <div className="mx-auto flex w-full max-w-lg animate-pulse flex-col gap-5">
        <div className="flex items-center justify-end px-1">
          <div className="h-8 w-24 rounded-[10px] border-2 border-black bg-white" />
        </div>
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-[14px] border-2 border-black bg-white" />
          <div className="mx-auto mt-3 h-5 w-40 rounded bg-white border-2 border-black" />
        </div>
        <div className="public-progress-track">
          <div className="public-progress-fill" style={{ transform: "scaleX(0.33)" }} />
        </div>
        <div className="public-card p-6">
          <div className="mx-auto h-6 w-40 rounded border-2 border-black bg-[var(--c-cream)]" />
          <div className="mt-6 space-y-3">
            <div className="h-12 w-full rounded-[14px] border-2 border-black bg-white" />
            <div className="h-12 w-full rounded-[14px] border-2 border-black bg-[var(--c-yellow)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
