import express, { type ErrorRequestHandler } from "express";
import { move } from "./move.js";

// Creamos la aplicación sin abrir un puerto; así también se puede usar en pruebas.
export const app = express();

// Este middleware interpreta los cuerpos con Content-Type: application/json.
// Debe registrarse antes del endpoint para que req.body esté disponible.
app.use(express.json());
// El motor solicita una decisión enviando el estado mediante POST /move.
app.post("/move", move);

// Express reconoce los manejadores de errores por sus cuatro parámetros,
// aunque este manejador no necesite usar req ni next.
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // Un error de sintaxis JSON se detecta antes de llegar al handler move.
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El body contiene JSON inválido." });
  }

  // Conservamos el código de error HTTP si existe; por defecto usamos 500.
  // La respuesta no expone detalles internos del error al cliente.
  const status = err.status || 500;
  return res.status(status).json({ error: status === 500 ? "Error interno del bot." : "Solicitud inválida." });
};

// Se registra al final para recibir los errores del parser y de las rutas anteriores.
app.use(errorHandler);
