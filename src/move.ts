import { chooseMove } from "./strategy.js";
import { isState } from "./state.js";
import type { Request, Response } from "express";
import type { Movement } from "./types.js";

// Este handler conecta HTTP con la estrategia del juego.
// Request tipa, en orden, los parámetros de ruta, la respuesta y el body.
// El body es unknown hasta validarlo; la respuesta puede ser un movimiento o un error.
export function move(
  req: Request<Record<string, never>, Movement | { error: string }, unknown>,
  res: Response<Movement | { error: string }>,
) {
  // express.json() ya convirtió el body JSON en un valor de JavaScript.
  const state = req.body;

  // Un JSON válido puede tener una estructura incorrecta para nuestro juego.
  if (!isState(state)) {
    return res.status(400).json({
      error: 'Estado inválido: se requiere jugador A o B, dado de 1 a 3 y tablero de 10x10 con "", "N" o piezas como A1/B1.',
    });
  }

  // Aquí state ya está validado y tipado como State.
  // res.json envía el diccionario como JSON con estado HTTP 200 por defecto.
  return res.json(chooseMove(state));
}
