module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-typescript",
    "@babel/preset-react",
  ],
  plugins: [
    [
      "babel-plugin-transform-vite-meta-env",
      {
        env: {
          VITE_SUPABASE_URL: "https://test.supabase.co",
          VITE_SUPABASE_ANON_KEY: "test-anon-key",
          VITE_ENABLE_OCR: "true",
          VITE_ENABLE_OFFLINE: "true",
          VITE_ENABLE_PWA: "true",
          VITE_DEBUG_LOGS: "false",
          VITE_ENABLE_EXTERNAL_LOGGING: "false",
          VITE_ENABLE_CSP: "false",
          VITE_WEBSOCKET_URL: "http://localhost:3001",
          VITE_VAPID_PUBLIC_KEY: "test-vapid-key",
          MODE: "test",
          DEV: false,
          PROD: false,
        },
      },
    ],
  ],
};
