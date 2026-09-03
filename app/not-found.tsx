import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-[#090A0C] text-white text-center">
      <h1 className="text-4xl font-black font-display tracking-wider text-[#FF5500]">404</h1>
      <h2 className="text-xl font-bold font-display uppercase tracking-wide mt-2">Route Not Found</h2>
      <p className="text-sm text-gray-400 font-mono mt-2 max-w-md">
        The requested logistics route does not exist in the freight directory.
      </p>
      <Link
        href="/"
        className="mt-6 px-4 py-2 rounded bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors"
      >
        Return to Sizer
      </Link>
    </main>
  );
}
