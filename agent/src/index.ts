import { createApp } from "./App/App";
import { SERVER_CONFIG } from "./config/AppConfing";

const app = createApp();

app.listen(SERVER_CONFIG.port, () => {
  console.log(`Servidor en http://${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`);
});
