/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the API. Empty means same-origin (nginx proxies /api). */
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
