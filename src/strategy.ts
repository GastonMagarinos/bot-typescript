import type { Movement, State, PieceId, Direction } from "./types.js";
//tamano del tablero
const size = 10;
//creamos un tipo para agrupar las filas y cpolumnas en un objeto
type Position = { row: number; col: number };

//recoorido del tablero para encontrar la pieza con su ubicacion
function findPieces(state: State): Map<PieceId, Position> {
  const pieces = new Map<PieceId, Position>();
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cell = state.tablero[row][col];
      if (cell !== "" && cell !== "N" && cell.startsWith(state.jugador)) {
        pieces.set(cell, { row, col });
      }
    }
  }
  return pieces;
}
//recorrido del tablero para encontrar las casas y devolver las ubicaciones en un array
function findHouses(state: State): Position[] {
  const houses: Position[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cell = state.tablero[row][col];
      if (cell === "N") {
        houses.push({ row, col }); //[{},{}]
      }
    }
  }
  return houses;
}
// funcion para que el tablero sea toroidal, si toroide es mayor a 5 o -5 la mitad del tablero, busca los extremos sino va por dentro
const toroidal = (toroide: number) =>toroide > size / 2  ? toroide - size: toroide < -size / 2? toroide + size: toroide;

// funcion para medir la distancia que hay entre la pieza y la casa, utilizamos la distancia manhattan para esto
// Math.abs se utiliza para que el valor de la distancia sea positivo
const distance = (a: Position, b: Position) => Math.abs(toroidal(b.row - a.row)) + Math.abs(toroidal(b.col - a.col));//(x2-x1)+(y2-y1)

//funcion para que le diga en que direccion esta la casa
function direction(a: Position, b: Position): Direction {
  const directionRow = toroidal(b.row - a.row);
  const directionCol = toroidal(b.col - a.col);
  if (Math.abs(directionRow) >= Math.abs(directionCol)) {
    return directionRow < 0 ? "N" : "S";
  } else {
    return directionCol < 0 ? "O" : "E";
  }
}
//funcion que exportamos la mejor jugada de cada pieza
export function chooseMove(state: State): Movement {
  const movements: Movement = {};
  const houses = findHouses(state);

  for (const [pieceId, positionPiece] of findPieces(state)) {
    const votes: Partial<Record<Direction, number>> = {};
    let bestDirection: Direction|undefined ;
    let bestScore = 0;

    for (const house of houses) {
      const dir = direction(positionPiece, house);

      const score = (votes[dir] ?? 0) + 1 / distance(positionPiece, house);
      votes[dir] = score;

      if (score > bestScore) {
        bestScore = score;
        bestDirection = dir;
      }
    }

    if (bestDirection) movements[pieceId] = bestDirection;//movements{A1:"S"}
  }

  return movements;
}




//prueba al inicializar, muestra en consola el mensaje de chooseMove
const state: State = {
  jugador: "A",
  dado: 3,
  tablero: [
    ["", "", "", "", "N", "", "N", "", "", ""],
    ["", "", "", "N", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "A1", "", "", "N", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "N", "N", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
  ],
};
console.log(chooseMove(state));
