import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Add line break when a line is getting too long, only add breaks when there is a space.
 */
export function breakLine(text: string, desiredLineWidth = 20): string {
  let result = "";
  let line = "";

  for (const word of text.split(" ")) {
    // If adding this word would exceed the line width, start a new line
    if ((line + (line.length ? " " : "") + word).length > desiredLineWidth) {
      if (result) {
        result += "\n";
      }
      result += line;
      line = word;
    } else {
      line += (line.length ? " " : "") + word;
    }
  }

  // Add the last line
  if (line) {
    if (result) {
      result += "\n";
    }
    result += line;
  }

  return result;
}

export function truncate(text: string, maxLength = 30): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}
