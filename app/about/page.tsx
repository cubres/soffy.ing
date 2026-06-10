export default function AboutPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-[#cccccc] font-serif p-8">
      <div className="max-w-2xl">
        <h1 className="font-sans text-3xl mb-6 text-center">
          <a href="/" className="text-red-600 underline hover:text-red-500 transition-colors">
            soffy.ing
          </a>
        </h1>

        <nav className="font-sans flex justify-center gap-6 mb-8 text-sm">
          <a href="/" className="text-zinc-400 hover:text-[#B5D1B1] transition-colors">
            write
          </a>
          <a href="/about" className="text-white underline">
            about
          </a>
        </nav>

        <div className="space-y-4 leading-relaxed">
          <p>
            soffy.ing is a minimalist writing tool designed to keep you in the flow. The countdown timer forces you to
            keep writing - if you stop, everything disappears.
          </p>

          <p>
            Set your own timer or choose no timer at all. Write with formatting support (bold and italic) and export
            your work as rich text or PDF. Made with love by Presian Georgiev.
          </p>

          <p className="text-zinc-500 italic text-sm">"Men must live and create. Live to the point of tears."</p>
        </div>
      </div>
    </div>
  )
}
