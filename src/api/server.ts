import { serve } from "@hono/node-server";
import { app } from "./routes.js";

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log("Mock API running on http://localhost:3000");
});
