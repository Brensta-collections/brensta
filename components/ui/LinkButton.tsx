import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./Button";
import type { VariantProps } from "class-variance-authority";

/**
 * Button-styled Link. Use this for navigation CTAs so we never render
 * `<a><button>...</button></a>` (invalid HTML and a WAI-ARIA problem).
 *
 * When `disabled` is true we render a non-navigating <span role="link" aria-disabled="true" tabIndex={-1}>
 * so keyboard activation can't bypass the pointer-events-none styling.
 */
export type LinkButtonProps = Omit<ComponentProps<typeof Link>, "className"> &
  VariantProps<typeof buttonVariants> & {
    className?: string;
    disabled?: boolean;
  };

export function LinkButton({ className, variant, size, disabled, children, ...rest }: LinkButtonProps) {
  const cls = cn(
    buttonVariants({ variant, size }),
    disabled && "pointer-events-none opacity-50",
    className
  );

  if (disabled) {
    return (
      <span role="link" aria-disabled="true" tabIndex={-1} className={cls}>
        {children}
      </span>
    );
  }

  return (
    <Link {...rest} className={cls}>
      {children}
    </Link>
  );
}
