export function FoldMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M2 26V2h24" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 2 14 14 26 2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M14 14v12" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function Spark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 1v16M1 9h16M3.5 3.5l11 11M14.5 3.5l-11 11" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

export function Crane({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 96 64" fill="none" aria-hidden="true">
      <path d="M48 10v44" stroke="currentColor" strokeWidth="1.45" />
      <path d="M48 32 16 12 28 32 16 52Z" stroke="currentColor" strokeWidth="1.45" strokeLinejoin="round" />
      <path d="M48 32 80 12 68 32 80 52Z" stroke="currentColor" strokeWidth="1.45" strokeLinejoin="round" />
    </svg>
  );
}

export function Crystal({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <path d="M40 6 70 28 58 70 22 70 10 28Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M40 6 40 70M10 28h60M22 70 40 28 58 70" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

export function Boat({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 72 40" fill="none" aria-hidden="true">
      <path d="M8 22h56L52 34H20L8 22Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M36 6v16M36 6 22 22h28L36 6Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function HexStar({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <path d="M36 6 62 21v30L36 66 10 51V21Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M36 6v60M10 21h52M10 51h52" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

export function OrigamiGallery() {
  return (
    <div className="relative mx-auto grid w-full max-w-80 grid-cols-3 items-center gap-x-4 gap-y-8 text-white [&>:nth-child(3n+1)]:justify-self-start [&>:nth-child(3n+2)]:justify-self-center [&>:nth-child(3n)]:justify-self-end">
      <Crystal className="h-[4.5rem] w-[4.5rem]" />
      <Crane className="h-[4.5rem] w-24" />
      <HexStar className="h-[4.5rem] w-[4.5rem]" />
      <Spark className="h-6 w-6 opacity-85" />
      <Boat className="h-14 w-24" />
      <Spark className="h-6 w-6 opacity-85" />
    </div>
  );
}
