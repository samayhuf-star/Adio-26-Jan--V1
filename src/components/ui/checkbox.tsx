"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "./utils";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative border-2 bg-white dark:bg-input/30 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-indigo-500 data-[state=checked]:to-purple-600 data-[state=checked]:text-white dark:data-[state=checked]:bg-gradient-to-br dark:data-[state=checked]:from-indigo-500 dark:data-[state=checked]:to-purple-600 dark:data-[state=checked]:text-white data-[state=checked]:border-indigo-500 focus-visible:border-indigo-400 focus-visible:ring-indigo-400/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-5 shrink-0 rounded-md border-slate-300 shadow-sm transition-all duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2 hover:border-indigo-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-300 disabled:hover:shadow-sm",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-all duration-200 animate-in fade-in-0 zoom-in-50"
      >
        <CheckIcon className="size-4 font-bold" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
