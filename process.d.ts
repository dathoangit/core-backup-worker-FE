declare namespace NodeJS {
  export interface ProcessEnv {
    /** Optional FE runtime flags kept for compatibility. */
    IS_DEV?: string;
    PROJECT_ID?: string;
    /** Public API base URL (for direct FE -> BE calls). */
    NEXT_PUBLIC_API_URL?: string;
  }
}
