import type { PieceId, Direction,Movement, State,  } from "./types.js";
//tamano del tablero
const size = 10;
//creamos un tipo para agrupar las filas y cpolumnas en un objeto
type Position = { row: number; col: number };

//recorrido del tablero para encontrar la pieza con su ubicacion
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
const samePosition = (a: Position, b: Position) => a.row === b.row && a.col === b.col;

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
  const house = findHouses(state);
  const pieces = findPieces(state)
  const votes: Partial<Record<Direction, number>> = {};
  const piece: Partial<Record<PieceId, Position>> = {};
  let bestDirection: Direction|undefined ;
  let lastBestDirection:Direction|undefined;
  let bestScore = 0;


  for (const [pieceId, positionPiece] of pieces) {
    const myPosition = piece[pieceId];
    const myTeamMate = pieceId[0]
    let crashwithTeamMate = false
    let crashwithEnemies = false
    for (const h of house) {
      const dir = direction(positionPiece, h);


      const score = (votes[dir] ?? 0) + 1 / distance(positionPiece, h);
      votes[dir] = score;

      if (score > bestScore) {
        bestScore = score;
        lastBestDirection = bestDirection;
        bestDirection = dir;
        piece[pieceId] = h
      }
    }

    if (myPosition !== undefined) {
      for (const [clave, valor] of Object.entries(piece)) {
        if (clave === pieceId || valor === undefined) continue;
        if (!samePosition(myPosition, valor)) continue;
        if (clave[0] === myTeamMate) crashwithTeamMate = true
          else crashwithEnemies = true
      }
    }
    if (crashwithTeamMate || crashwithEnemies) {
      movements[pieceId] = lastBestDirection;
    }
    else {
      movements[pieceId] = bestDirection;
    }
  }

  return movements;
};





//prueba al inicializar, muestra en consola el mensaje de chooseMove
const state: State = {
  jugador: "A",
  dado: 1,
  tablero: [
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "A1", "", "", "", ""],
    ["", "", "", "", "", "B1", "A2", "", "", ""],
    ["", "", "", "", "", "N", "", "", "", ""],
    ["", "", "", "", "", "N", "", "", "B2", ""],
    ["", "", "", "", "", "", "", "", "", ""],
  ],
};
console.log(chooseMove(state));
