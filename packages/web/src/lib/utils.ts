import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// `cn` is web-only (Tailwind class merging). All other utilities live in @ctok/core.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export {
  formatNumber,
  formatUsd,
  uid,
  clamp,
  truncate,
} from "@ctok/core";
