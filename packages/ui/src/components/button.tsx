import { type ButtonHTMLAttributes, forwardRef } from "react";
import { type ButtonSize, type ButtonVariant, getButtonClassName } from "./button-classes";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={getButtonClassName({ variant, size, className })}
      {...props}
    />
  );
});
