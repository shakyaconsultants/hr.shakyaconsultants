/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_PREFIX: string;
  readonly VITE_API_PROXY_TARGET: string;
  readonly VITE_AUTH_USE_HTTP_ONLY_COOKIES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
