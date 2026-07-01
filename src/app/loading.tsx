export default function RootLoading() {
  return (
    <div className="brutal-page">
      <div className="brutal-nav-wrap animate-pulse">
        <div className="brutal-nav">
          <div className="h-6 w-32 rounded-lg bg-[var(--c-lavender-dark)]" />
          <div className="h-9 w-28 rounded-[14px] border-2 border-black bg-[var(--c-yellow)]" />
        </div>
      </div>
      <div className="mx-auto max-w-5xl animate-pulse px-4 py-12 sm:px-6">
        <div className="h-8 w-64 rounded-lg bg-white border-2 border-black" />
        <div className="mt-6 brutal-card h-32" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="brutal-card h-24" />
          <div className="brutal-card h-24" />
        </div>
      </div>
    </div>
  );
}
