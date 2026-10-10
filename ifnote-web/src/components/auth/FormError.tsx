interface FormErrorProps {
  message: string | null;
}

/**
 * Pesan kesalahan tingkat form (mis. login gagal). Ditampilkan inline dan
 * diumumkan pembaca layar lewat role="alert", selain toast yang hilang sendiri.
 */
export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-400/30"
    >
      {message}
    </p>
  );
}
