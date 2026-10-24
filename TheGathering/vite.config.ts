
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import inject from "@rollup/plugin-inject";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Dùng automatic JSX runtime (React 17+)
    react(),
    tailwindcss(),
    inject({
      global: ["globalThis", "global"],
      // Exclude HTML files from injection
      include: ["**/*.js", "**/*.ts", "**/*.tsx", "**/*.jsx"],
      exclude: ["**/*.html"],
    }),
  ],
  build: {
    outDir: "dist",
    sourcemap: false, // Tắt sourcemap trong production để giảm bundle size
    minify: "esbuild", // Sử dụng esbuild cho minify nhanh hơn
    target: "esnext", // Target modern browsers
    cssCodeSplit: true, // Split CSS để load song song
    // Ensure Rollup's CommonJS handling sees pnpm's nested node_modules
    commonjsOptions: {
      include: [/node_modules/, /node_modules\/\.pnpm/],
      transformMixedEsModules: true,
      // Đảm bảo Phaser được xử lý đúng cách (CommonJS module)
      requireReturnsDefault: "auto",
    },
    rollupOptions: {
      output: {
        // Chunk splitting strategy để tối ưu loading
        manualChunks: (id) => {
          // Vendor chunks - tách các thư viện lớn
          if (id.includes("node_modules")) {
            // Phaser - game engine lớn, tách riêng
            if (id.includes("phaser")) {
              return "phaser";
            }
            // Mediasoup - WebRTC SFU, tách riêng
            if (id.includes("mediasoup")) {
              return "mediasoup";
            }
            // Socket.io - real-time communication (keep in vendor to avoid circular dependency)
            // Note: socket.io has dependencies that might cause circular chunks
            // Keeping it in vendor chunk instead of separate chunk
            // React và React DOM - core framework
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }
            // React Router
            if (id.includes("react-router")) {
              return "react-router";
            }
            // Framer Motion - animation library
            if (id.includes("framer-motion")) {
              return "framer-motion";
            }
            // Các vendor libraries khác
            return "vendor";
          }
        },
        // Tối ưu chunk file names
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    },
    // Tăng chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  define: {
    global: "globalThis",
    "process.browser": "true",
  },
  resolve: {
    // Đảm bảo Vite/Rollup chỉ dùng một bản React duy nhất
    dedupe: ["react", "react-dom"],
    // Node polyfills removed - SFU (mediasoup) only, no simple-peer needed
    alias: [
      {
        find: "globalThis",
        replacement: fileURLToPath(new URL("./src/polyfills/globalThis.ts", import.meta.url)),
      },
      // @react-oauth/google alias removed - use real package for Google OAuth
      {
        find: "react-icons/fa",
        replacement: fileURLToPath(
          new URL("./src/shims/react-icons-fa.tsx", import.meta.url)
        ),
      },
      {
        find: "react-icons/fc",
        replacement: fileURLToPath(
          new URL("./src/shims/react-icons-fc.tsx", import.meta.url)
        ),
      },
    ],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "socket.io-client",
      "mediasoup-client",
      "phaser", // Pre-bundle Phaser (UMD) thành ESM để tránh lỗi "Cannot set properties of undefined"
    ],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
      // Tối ưu cho production
      target: "esnext",
    },
  },
  ssr: {
    // Đảm bảo Vite bundle/react-icons thay vì externalize để tránh lỗi default export
    noExternal: ["react-icons"],
  },

  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:5001",
        ws: true,
      },
    },
  },
});
