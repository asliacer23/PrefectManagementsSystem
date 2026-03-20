import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { handler as appDataHandler } from "./netlify/functions/app-data.js";

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
          server.middlewares.use("/api/app-data", async (req, res) => {
            const requestUrl = new URL(req.url ?? "/", "http://localhost");
            const queryStringParameters = Object.fromEntries(requestUrl.searchParams.entries());
            const chunks: Buffer[] = [];
            await new Promise<void>((resolve) => {
              req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
              req.on("end", () => resolve());
            });
            const result = await appDataHandler({
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
