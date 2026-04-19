interface FormErrorProps {
  message: string | null;
}

/**
 * Displays a validation / API error beneath the form fields.
 */
export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-2 text-sm text-destructive text-center"
    >
      {message}
    </div>
  );
}
