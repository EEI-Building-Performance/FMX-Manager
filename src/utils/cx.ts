/**
 * Utility function to combine CSS class names
 * Filters out falsy values and joins the remaining classes
 */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
