import { app } from "./app.js";

// PORT permite configurar el despliegue; en desarrollo usamos 3000 por defecto.
const port = process.env.PORT || 3000;

// Este archivo abre el puerto y deja el proceso esperando solicitudes HTTP.
app.listen(port, () => {
  // El callback se ejecuta cuando el servidor ya está escuchando.
  console.log(`Bot de casas escuchando en http://localhost:${port}`);
});
