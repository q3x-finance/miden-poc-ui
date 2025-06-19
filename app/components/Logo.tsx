export default function Logo() {
  return (
    <div className="flex items-center justify-center gap-3">
      {/* Wallet Icon */}
      <div className="relative">
        <svg
          className="w-10 h-10 text-indigo-600 dark:text-indigo-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
        {/* Quantum effect dots */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
        <div
          className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse"
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>

      {/* Text */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-800 dark:text-white">
          Miden Playground
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          by Quantum3Labs
        </p>
      </div>
    </div>
  );
}
