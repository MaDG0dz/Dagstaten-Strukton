export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left branded panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col items-center justify-center bg-[#5b00b4] px-12 relative overflow-hidden">
        {/* Subtle background texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Strukton logo"
            width={80}
            height={80}
            className="mb-8"
          />

          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white tracking-tight">
            Dagstaten
          </h1>
          <p className="mt-1 text-slate-400 text-sm font-medium tracking-wide">
            Strukton Civiel
          </p>

          {/* Red accent line */}
          <div className="mt-6 h-[2px] w-12 bg-[#e43122] rounded-full" />

          <p className="mt-6 text-slate-500 text-sm max-w-[240px] leading-relaxed">
            Dagelijks projectbeheer, gestroomlijnd en betrouwbaar.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12">
        {/* Mobile logo — visible only on small screens */}
        <div className="mb-10 flex flex-col items-center lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Strukton logo"
            width={48}
            height={48}
            className="mb-3"
          />
          <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-slate-900 tracking-tight">
            Dagstaten
          </span>
        </div>

        <div className="w-full max-w-[380px]">
          {children}
        </div>
      </div>
    </div>
  );
}
