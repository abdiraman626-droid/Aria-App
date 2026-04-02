/**
 * Sanitize user input to prevent XSS and injection attacks.
 * Call on any text that will be stored or rendered as HTML.
 */
export function sanitize(value, maxLength = 500) {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .slice(0, maxLength)
    // Strip angle brackets to prevent HTML injection
    .replace(/[<>]/g, '')
    // Strip javascript: protocol
    .replace(/javascript:/gi, '')
    // Strip inline event handlers
    .replace(/on\w+\s*=/gi, '');
}
