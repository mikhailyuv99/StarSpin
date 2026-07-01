export default function RootLoading() {
  return (
    <div className="min-h-screen bg-ink">
      <div className="mx-auto flex h-14 max-w-6xl animate-pulse items-center justify-between px-5">
        <div className="h-8 w-28 rounded-sm bg-zinc-800" />
        <div className="h-9 w-32 rounded-sm bg-zinc-800" />
      </div>
      <div className="mx-auto max-w-6xl animate-pulse px-5 py-24">
        <div className="h-4 w-48 rounded-sm bg-zinc-800" />
        <div className="mt-6 h-14 w-full max-w-xl rounded-sm bg-zinc-800" />
        <div className="mt-4 h-24 w-full max-w-lg rounded-sm bg-zinc-900" />
      </div>
    </div>
  );
}
