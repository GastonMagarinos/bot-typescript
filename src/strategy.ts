import type { PieceId, Direction,Movement, State,DieValue  } from "./types.js";
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
function findEnemy(state: State, player: string): Map<PieceId, Position> {
  const pieces = new Map<PieceId, Position>();
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cell = state.tablero[row][col];
      if (cell !== "" && cell !== "N" && cell.startsWith(player)) {
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

const samePosition = (dir:Direction|undefined,die: DieValue, a: Position, b: Position) => {
   let rowP =a.row
  let rowE = b.row
  let colP = a.col
  let colE =b.col
  if (dir === "S") rowP = (rowP + die) % 10;
    else if (dir === "N") rowP = (rowP - die +  10) % 10;
    else if (dir === "E") colP = (colP + die) % 10;
    else if (dir === "O") colP = (colP - die + 10) % 10;
return rowP === rowE && colP===colE
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
export function chooseMove(state: State):Movement {
  const movements: Movement = {};
  const house = findHouses(state);
  const pieces = findPieces(state)
  const enemies =findEnemy(state,state.jugador === "A" ? "B" : "A")
  const dado = state.dado;
  const votes: Partial<Record<Direction, number>> = {};
  let bestDirection: Direction|undefined ;
  let lastBestDirection:Direction|undefined;
  let bestScore = 0;


  for (const [pieceId, positionPiece] of pieces) {
    let crashWithTeamMate = false
    let crashWithEnemies = false
    for (const h of house) {
      const dir = direction(positionPiece, h);


      const score = (votes[dir] ?? 0) + 1 / distance(positionPiece, h);
      votes[dir] = score;

      if (score > bestScore) {
        bestScore = score;
        lastBestDirection = bestDirection??"E";
        bestDirection = dir;
      }
    }


    if (positionPiece !== undefined) {
      for (const [clave, valor] of pieces) {
          if (clave === pieceId || valor === undefined) continue;
          if (samePosition(bestDirection,dado,positionPiece, valor)) crashWithTeamMate = true;
        }

      for (const [, valor] of enemies) {
        if (samePosition(bestDirection, dado, positionPiece, valor)) crashWithEnemies = true;
      }
    }

    if (crashWithTeamMate || crashWithEnemies) {
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
    ["A1", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", "", "", ""],
    ["N", "", "", "", "", "N", "", "", "", ""],
    ["B2", "", "", "", "", "", "", "", "", ""],
  ],
};
console.log(chooseMove(state));
