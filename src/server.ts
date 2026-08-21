import http from "http";
import app from "./app";
import { config } from "./config/config";
import { initSocket } from "./sockets";

const httpServer = http.createServer(app);
initSocket(httpServer);

async function startServer() {
  try {
    const response = await fetch(`${config.supabase.url}/auth/v1/health`, {
      headers: { apikey: config.supabase.anonKey },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    console.log("Supabase OK:", data.version);

    httpServer.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error("Supabase connection failed: ", error);
    process.exit(1);
  }
}

startServer();
