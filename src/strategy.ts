import type { Movement, State } from "./types.js";

// La estrategia no depende de Express: recibe un estado y devuelve una decisión.
// Prioriza movimientos que caen directamente en una casa neutral. Si ninguna
// casa es alcanzable con el dado actual, elige un movimiento válido que deje
// la pieza lo más cerca posible de alguna casa.
export function chooseMove(state: State): Movement {
  const directions = [
    { name: "N", row: -1, column: 0 },
    { name: "E", row: 0, column: 1 },
    { name: "S", row: 1, column: 0 },
    { name: "O", row: 0, column: -1 },
  ] as const;

  const houses: Array<{ row: number; column: number }> = [];
  for (let row = 0; row < state.tablero.length; row += 1) {
    for (let column = 0; column < state.tablero[row].length; column += 1) {
      if (state.tablero[row][column] === "N") houses.push({ row, column });
    }
  }

  const movements: Movement = {};
  for (let row = 0; row < state.tablero.length; row += 1) {
    for (let column = 0; column < state.tablero[row].length; column += 1) {
      const cell = state.tablero[row][column];
      if (cell === "" || cell === "N" || !cell.startsWith(state.jugador)) continue;

      const candidates = directions
        .map(direction => ({
          direction: direction.name,
          row: row + direction.row * state.dado,
          column: column + direction.column * state.dado,
        }))
        .filter(destination =>
          destination.row >= 0 && destination.row < state.tablero.length &&
          destination.column >= 0 && destination.column < state.tablero[0].length
        );

      // Una casa a exactamente «dado» casillas se conquista inmediatamente.
      const conquest = candidates.find(destination =>
        state.tablero[destination.row][destination.column] === "N"
      );
      if (conquest) {
        movements[cell] = conquest.direction;
        continue;
      }

      // Si todavía hay casas, elegimos el destino con menor distancia Manhattan.
      // El orden N, E, S, O resuelve empates de forma determinista.
      const best = candidates.reduce<(typeof candidates)[number] | undefined>((current, candidate) => {
        if (!current) return candidate;
        const distance = (destination: typeof candidate) => Math.min(
          ...houses.map(house =>
            Math.abs(house.row - destination.row) + Math.abs(house.column - destination.column)
          )
        );
        return distance(candidate) < distance(current) ? candidate : current;
      }, undefined);

      // Sin casas neutrales, se conserva un movimiento válido y predecible.
      if (best) movements[cell] = best.direction;
    }
  }

  return movements;
}



// Ejemplo: si cell contiene "casilla5", [cell] pone ese contenido como clave:
// { [cell]: "N" } produce { casilla5: "N" }.
// Sin corchetes, { cell: "N" } usa la palabra "cell" como clave:
// produce { cell: "N" }, sin buscar el contenido de la variable.
//
// Con o sin «as const», al ejecutar el programa se obtiene el mismo objeto.
// La diferencia está en cómo TypeScript interpreta el valor:
// sin «as const», puede inferir string (cualquier texto, incluso "hola");
// con «as const», el tipo del valor es exactamente "N".
// Si se esperan solo direcciones permitidas, como "N" o "S", un string
// general podría rechazarse, pero el valor exacto "N" sí es válido.
// «as const» hace más preciso el tipo; no cambia el comportamiento.
// Si al quitarlo no hay errores de tipos, puede no ser necesario aquí.
