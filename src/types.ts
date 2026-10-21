// Estos tipos describen el contrato del bot durante el desarrollo.
// La validación del JSON recibido se realiza por separado en state.ts.
// Solo existen dos jugadores posibles.
export type Player = "A" | "B";
// El dado de este juego tiene únicamente tres resultados posibles.
export type DieValue = 1 | 2 | 3;
// Direcciones: norte, sur, este y oeste.
export type Direction = "N" | "S" | "E" | "O";
// Un ID combina el jugador y un número, como A1 o B2.
// El validador exige además que ese número sea un entero positivo.
export type PieceId = `${Player}${number}`;
// En el tablero, N representa una casa neutral; no una dirección.
// Una cadena vacía representa una casilla sin contenido.
export type Cell = "" | "N" | PieceId;
// Una tupla fija la cantidad de elementos, a diferencia de un array común.
// T permite reutilizar la misma estructura con distintos tipos de elementos.
export type Ten<T> = [T, T, T, T, T, T, T, T, T, T];
// Diez filas de diez casillas cada una forman el tablero de 10x10.
export type Board = Ten<Ten<Cell>>;

// Estado que el motor del juego envía en el body de POST /move.
export interface State {
  // Se accede a una casilla mediante tablero[fila][columna].
  tablero: Board;
  // Resultado del dado para este turno.
  dado: DieValue;
  // Jugador para el que debe decidir el bot.
  jugador: Player;
}

// Diccionario de IDs de piezas a direcciones, por ejemplo { A1: "N" }.
// Partial permite incluir solo las piezas elegidas o devolver un objeto vacío.
export type Movement = Partial<Record<PieceId, Direction>>;

