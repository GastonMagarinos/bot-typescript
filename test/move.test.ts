import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { app } from "../src/app.js";
import { isState } from "../src/state.js";
import { chooseMove } from "../src/strategy.js";

// El fixture es un estado conocido para repetir las pruebas con los mismos datos.
// La URL relativa a este archivo permite encontrarlo sin depender del directorio actual.
const fixture = JSON.parse(readFileSync(new URL("../fixtures/state1.json", import.meta.url), "utf8"));

test("elige piezas propias, ignora casas neutrales y no modifica el estado", () => {
  // Validamos el fixture antes de pasarlo a la estrategia.
  assert.ok(isState(fixture));
  // Una copia profunda permite detectar si la estrategia modifica el tablero original.
  const original = structuredClone(fixture);
  assert.deepEqual(chooseMove(fixture), { A1: "N" });
  assert.deepEqual(chooseMove({ ...fixture, jugador: "B" }), { B2: "N" });
  assert.deepEqual(fixture, original);
  // Sin piezas, la respuesta debe ser un diccionario vacío.
  const empty = structuredClone(fixture);
  empty.tablero.forEach(row => row.fill(""));
  assert.deepEqual(chooseMove(empty), {});
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
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), jugador === "A" ? { A1: "N" } : { B2: "N" });
    }
    // Los tres resultados posibles del dado deben ser aceptados.
    for (const dado of [1, 2, 3]) {
      assert.equal((await post(JSON.stringify({ ...fixture, dado }))).status, 200);
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
      assert.equal((await post(JSON.stringify(invalid))).status, 400);
    }
    // También cubrimos un body que ni siquiera tiene sintaxis JSON válida.
    assert.equal((await post("{invalid")).status, 400);
  } finally {
    // Cerramos el servidor incluso si falla una aserción para liberar el puerto.
    await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});
