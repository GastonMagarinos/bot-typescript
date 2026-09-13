import type { State } from "./types.js";

// El JSON externo empieza como unknown: no podemos confiar en su estructura.
// Si devuelve true, «value is State» permite a TypeScript tratarlo como State.
export function isState(value: unknown): value is State {
  // En JavaScript, typeof null también devuelve "object"; por eso se excluye.
  if (typeof value !== "object" || value === null) return false;
  // Podemos leer propiedades, pero sus valores siguen siendo desconocidos.
  // Esta conversión no valida el estado: las comprobaciones siguientes sí.
  const state = value as Record<string, unknown>;

  return (
    // El jugador debe coincidir exactamente con uno de los dos IDs permitidos.
    (state.jugador === "A" || state.jugador === "B") &&
    // Rechazamos texto como "3", números decimales y valores fuera de 1 a 3.
    typeof state.dado === "number" &&
    Number.isInteger(state.dado) &&
    state.dado >= 1 && state.dado <= 3 &&
    // Primero comprobamos las diez filas y después las diez casillas por fila.
    Array.isArray(state.tablero) &&
    state.tablero.length === 10 &&
    state.tablero.every(row =>
      Array.isArray(row) && row.length === 10 &&
      // Cada casilla debe ser texto: vacía, neutral o una pieza válida.
      // La expresión regular exige A/B seguida de un entero positivo sin ceros iniciales.
      row.every(cell => typeof cell === "string" &&
        (cell === "" || cell === "N" || /^[AB][1-9]\d*$/.test(cell)))
    )
  );
}
