import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import { statSync } from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  process.env.DATABASE_URL ||= env.DATABASE_URL || env.SUPABASE_DB_URL;
  process.env.SUPABASE_DB_URL ||= env.SUPABASE_DB_URL;

  return {
    server: {
      host: "::",
      port: 8081,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      mode === "development" && {
        name: "app-data-dev-api",
        configureServer(server) {
          const loadFunctionModule = async (importPath) => {
            const absolutePath = path.resolve(process.cwd(), importPath);
            const version = statSync(absolutePath).mtimeMs;
            return import(`${pathToFileURL(absolutePath).href}?t=${version}`);
          };

          const registerFunctionRoute = (route, importPath) => {
            server.middlewares.use(route, async (req, res) => {
              const { handler } = await loadFunctionModule(importPath);
              const requestUrl = new URL(req.url ?? "/", "http://localhost");
              const queryStringParameters = Object.fromEntries(requestUrl.searchParams.entries());
              const chunks: Buffer[] = [];
              await new Promise<void>((resolve) => {
                req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
                req.on("end", () => resolve());
              });
              const result = await handler({
                queryStringParameters,
                httpMethod: req.method,
                body: chunks.length > 0 ? Buffer.concat(chunks).toString("utf8") : undefined,
              });

              res.statusCode = result.statusCode ?? 200;

              if (result.headers) {
                Object.entries(result.headers).forEach(([key, value]) => {
                  res.setHeader(key, value);
                });
              }

              res.end(result.body ?? "");
            });
          };

          registerFunctionRoute("/api/app-data", "./netlify/functions/app-data.js");
          registerFunctionRoute("/api/integrations-hub", "./netlify/functions/integrations-hub.js");
        },
      },
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
