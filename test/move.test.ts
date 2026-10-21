import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { expect, test } from "@jest/globals";
import { app } from "../src/app.js";
import { isState } from "../src/state.js";
import { chooseMove } from "../src/strategy.js";

// El fixture es un estado conocido para repetir las pruebas con los mismos datos.
// La URL relativa a este archivo permite encontrarlo sin depender del directorio actual.
const fixture = JSON.parse(readFileSync(new URL("../fixtures/state1.json", import.meta.url), "utf8"));

test("elige piezas propias, se acerca a casas neutrales y no modifica el estado", () => {
  // Validamos el fixture antes de pasarlo a la estrategia.
  assert.ok(isState(fixture));
  // Una copia profunda permite detectar si la estrategia modifica el tablero original.
  const original = structuredClone(fixture);
  expect(chooseMove(fixture)).toEqual({ A1: "E" });
  expect(chooseMove({ ...fixture, jugador: "B" })).toEqual({ B2: "N" });
  expect(fixture).toEqual(original);
  // Sin piezas, la respuesta debe ser un diccionario vacío.
  const empty = structuredClone(fixture);
  empty.tablero.forEach(row => row.fill(""));
  expect(chooseMove(empty)).toEqual({});
});

test.each(["A", "B"] as const)("mueve todas las fichas de %s sin modificar el estado", jugador => {
  const state = structuredClone(fixture);
  state.jugador = jugador;
  // Dos fichas en la misma fila y otra en una fila posterior.
  state.tablero[2][3] = "A2";
  state.tablero[8][4] = "A3";
  state.tablero[7][8] = "B3";
  state.tablero[9][9] = "B4";
  const original = structuredClone(state);
  expect(chooseMove(state)).toEqual(jugador === "A"
    ? { A1: "E", A2: "O", A3: "N" }
    : { B2: "N", B3: "N", B4: "N" });
  expect(state).toEqual(original);
});

test("prioriza conquistar una casa alcanzable con el valor del dado", () => {
  const state = structuredClone(fixture);
  state.tablero.forEach(row => row.fill(""));
  state.jugador = "A";
  state.dado = 3;
  state.tablero[3][3] = "A1";
  state.tablero[3][6] = "N";
  expect(chooseMove(state)).toEqual({ A1: "E" });
});

test.each(["A", "B"] as const)("devuelve un objeto vacío si %s no tiene fichas", jugador => {
  const state = structuredClone(fixture);
  state.jugador = jugador;
  state.tablero.forEach(row => row.fill(""));
  state.tablero[0][0] = "N";
  state.tablero[1][1] = jugador === "A" ? "B1" : "A1";
  expect(chooseMove(state)).toEqual({});
});

test("POST /move valida el estado y devuelve un diccionario", async () => {
  // El puerto 0 solicita un puerto libre al sistema para evitar conflictos.
  const server = app.listen(0, "127.0.0.1");
  // Esperamos a que el servidor esté listo antes de enviar solicitudes.
  await new Promise<void>(resolve => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  // Reutilizamos el mismo envío HTTP para los casos válidos e inválidos.
  const post = (body: string) => fetch(`http://127.0.0.1:${address.port}/move`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body,
  });
  try {
    // Verificamos tanto el código HTTP como la pieza elegida para cada jugador.
    for (const jugador of ["A", "B"]) {
      const response = await post(JSON.stringify({ ...fixture, jugador }));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(jugador === "A" ? { A1: "E" } : { B2: "N" });
    }
    // El endpoint también debe devolver todas las fichas de cada jugador.
    const multiple = structuredClone(fixture);
    multiple.tablero[2][3] = "A2";
    multiple.tablero[8][4] = "A3";
    multiple.tablero[7][8] = "B3";
    for (const jugador of ["A", "B"]) {
      const response = await post(JSON.stringify({ ...multiple, jugador }));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(jugador === "A"
        ? { A1: "E", A2: "O", A3: "N" }
        : { B2: "N", B3: "N" });
    }
    // Los tres resultados posibles del dado deben ser aceptados.
    for (const dado of [1, 2, 3]) {
      expect((await post(JSON.stringify({ ...fixture, dado }))).status).toBe(200);
    }
    // Alteramos copias para probar casillas inválidas y filas incompletas.
    const badCell = structuredClone(fixture);
    badCell.tablero[0][0] = null;
    const shortRow = structuredClone(fixture);
    shortRow.tablero[0].pop();
    // Cada estado inválido debe devolver 400, sin llegar a elegir un movimiento.
    for (const invalid of [null, {}, { ...fixture, jugador: "C" },
      ...[0, 4, 5, 6, 7, 1.5, "3"].map(dado => ({ ...fixture, dado })),
      { ...fixture, tablero: fixture.tablero.slice(1) }, badCell, shortRow]) {
      expect((await post(JSON.stringify(invalid))).status).toBe(400);
    }
    // También cubrimos un body que ni siquiera tiene sintaxis JSON válida.
    expect((await post("{invalid")).status).toBe(400);
  } finally {
    // Cerramos el servidor incluso si falla una aserción para liberar el puerto.
    await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});

test("GET /profile devuelve exactamente el perfil público del bot", async () => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    // No enviamos body ni autenticación: el perfil debe ser completamente público.
    const response = await fetch(`http://127.0.0.1:${address.port}/profile`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/^application\/json\b/);
    expect(await response.json()).toEqual({
      name: "Bot Xeneize",
      colors: ["#003B73", "#FFCC00", "#003B73"],
    });
  } finally {
    await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});
