// env.ts: Cross-platform environment variable access for Vite (browser) and Node/Jest

export function getEnvVar(key: string): string {
  // Vite/browser
  if (typeof window !== 'undefined' && typeof import.meta !== 'undefined' && import.meta.env && key in import.meta.env) {
    // @ts-ignore
    return import.meta.env[key];
  }
  // Node/Jest
  if (typeof process !== 'undefined' && process.env && key in process.env) {
    return process.env[key] as string;
  }
  return '';
}
