export {};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set' | string,
      targetIdOrAction: string | Date,
      params?: Record<string, unknown> | unknown
    ) => void;
    clarity?: (
      command: 'set' | 'identify' | 'event' | 'consent' | 'upgrade' | string,
      ...args: unknown[]
    ) => void;
  }
}
