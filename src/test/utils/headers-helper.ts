/**
 * Helper function to convert Headers to a plain object
 * This resolves TypeScript errors with Headers not implementing [Symbol.iterator]
 */
export function headersToObject(headers: Headers): Record<string, string> {
  const headersObj: Record<string, string> = {};
  headers.forEach((value, key) => {
    headersObj[key] = value;
  });
  return headersObj;
}
