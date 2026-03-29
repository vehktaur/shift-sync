import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { withTailwindClamp } from "tailwind-clamp-merge";

const twMerge = extendTailwindMerge(withTailwindClamp);

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
