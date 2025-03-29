import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Medicine, DrugInteraction } from "@shared/schema"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extended type for drug interactions with medicine details
 */
export interface DrugInteractionDetail extends DrugInteraction {
  medicine1: Medicine;
  medicine2: Medicine;
}
