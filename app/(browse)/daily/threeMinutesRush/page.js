export default function ThreeMinuteRushPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-20 text-white sm:px-10">
      <div className="relative flex max-w-4xl flex-col items-center justify-center text-center">
        <div className="pointer-events-none absolute -inset-8 rounded-[48px] bg-[radial-gradient(circle_at_top,rgba(94,78,255,0.35),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(255,143,214,0.28),transparent_62%)] blur-lg" />
        <div className="relative rounded-[40px] border border-white/12 bg-white/5 px-10 py-16 backdrop-blur-lg sm:px-16 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Three Minute Rush</p>
          <h1 className="mt-6 text-3xl font-black leading-tight sm:text-5xl">Coming Soon</h1>
          <p className="mt-4 max-w-2xl text-sm text-white/70 sm:text-base">
            We&apos;re polishing the sprint. Check back shortly to dive into the fastest workout on ChessFast.
          </p>
        </div>
      </div>
    </main>
  );
}
