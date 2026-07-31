import { forwardRef, type InputHTMLAttributes } from "react";
import { getInputClassName } from "./input-classes";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error = false, className, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={error || undefined}
      className={getInputClassName({ error, className })}
      {...props}
    />
  );
});
