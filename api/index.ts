import { app } from "../src/app.js";

// Vercel convierte este export en una Function serverless.
// No llamamos a app.listen(): el runtime administra el servidor HTTP.
export default app;
