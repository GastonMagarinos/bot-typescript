import type { Movement, State } from "./types.js";

// La estrategia no depende de Express: recibe un estado y devuelve una decisión.
// Por ahora no usa el dado ni comprueba obstáculos o límites del tablero.
export function chooseMove(state: State): Movement {
  // Elegimos la primera pieza propia recorriendo el tablero por filas.
  for (const row of state.tablero) {
    for (const cell of row) {
      // El prefijo identifica al dueño; las casillas vacías y neutrales se ignoran.
      // [cell] usa el ID encontrado como clave del diccionario de respuesta.
      // «as const» conserva el tipo literal "N" en lugar del tipo general string.
      if (cell.startsWith(state.jugador)) return { [cell]: "N" as const };
    }
  }
  // Si el jugador no tiene piezas, no proponemos ningún movimiento.
  return {};
}
