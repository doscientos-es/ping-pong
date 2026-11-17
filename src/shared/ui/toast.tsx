export function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={
        message
          ? 'fixed bottom-[calc(90px_+_env(safe-area-inset-bottom))] left-1/2 z-[160] w-[calc(100%_-_40px)] max-w-[90vw] -translate-x-1/2 rounded-xl bg-green px-5 py-4 text-center text-[13px] leading-relaxed text-white shadow-xl desktop:bottom-6 desktop:left-[calc(50%_+_100px)] desktop:w-max desktop:text-xs'
          : 'sr-only'
      }
    >
      {message}
    </div>
  )
}
