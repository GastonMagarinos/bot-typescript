# Bot de casas v0.1

Bot HTTP simple con TypeScript y Express. Recibe un estado JSON mediante
`POST /move` y responde con un diccionario como `{"A1":"N"}`.
Cada clave es el identificador de una pieza y su valor es la dirección.

## Antes de empezar

Necesitás tener Node.js y npm instalados. Node.js ejecuta el programa y npm
instala sus dependencias y permite ejecutar los comandos del proyecto.
Estas instrucciones usan **PowerShell en Windows**.

Abrí la carpeta del proyecto en Visual Studio Code y elegí **Terminal → Nueva
terminal**. Verificá que la terminal sea PowerShell. La terminal permite
ejecutar comandos: copiá cada comando y presioná Enter.

Todos los comandos de esta guía se ejecutan desde la carpeta que contiene
`package.json`. Podés comprobarlo escribiendo `dir`: en la lista deberían
aparecer `package.json`, `src` y `fixtures`.

Para comprobar que las herramientas están disponibles:

```powershell/bash
node --version
npm --version
```

Cada comando debe mostrar un número de versión. Si no se reconoce alguno,
revisá la instalación de Node.js antes de continuar y volvé a abrir la terminal.

## Paso 1: instalar las dependencias

```powershell
npm install
```

Este comando descarga las herramientas que necesita el proyecto, como Express
y TypeScript, en la carpeta `node_modules`. Esperá a que termine y vuelva a
aparecer el cursor para escribir. Se hace la primera vez que preparás el
proyecto y cuando cambian sus dependencias; no hace falta hacerlo en cada prueba.

## Paso 2: iniciar el bot en la primera terminal

```powershell
npm run dev
```

Deberías ver este mensaje:

```text
Bot de casas escuchando en http://localhost:3000
```

**Dejá esta terminal abierta y el programa ejecutándose.** Que no vuelva el
cursor para escribir es normal: el servidor queda esperando solicitudes.
El modo `dev` también reinicia el bot cuando guardás cambios en el código.

`localhost` significa «esta misma computadora» y `3000` es el puerto en el
que escucha el bot. Para detenerlo al terminar, presioná **Ctrl+C** en esta terminal.

## Paso 3: enviar una solicitud desde otra terminal

Abrí una **segunda terminal PowerShell** usando el botón `+` del panel de
terminales de Visual Studio Code. Comprobá con `dir` que también esté en la
carpeta del proyecto. La primera terminal debe seguir ejecutando el bot.

El archivo `fixtures/state1.json` contiene un estado de ejemplo: un tablero
de 10×10, el jugador `A` y un dado con valor `3`. Un *fixture* es simplemente
un conjunto de datos preparado para repetir una prueba.

En la segunda terminal, ejecutá estas tres líneas en orden:

```powershell
$estado = Get-Content -Raw fixtures/state1.json
$respuesta = Invoke-RestMethod -Method Post -Uri http://localhost:3000/move -ContentType 'application/json' -Body $estado
$respuesta | ConvertTo-Json
```

Esto es lo que hace cada parte:

- `Get-Content -Raw` lee todo el archivo como un texto. `$estado` guarda ese texto.
- `Invoke-RestMethod` envía una solicitud HTTP al bot y guarda la respuesta en `$respuesta`.
- `-Method Post` indica el tipo de solicitud que espera el bot.
- `-Uri http://localhost:3000/move` indica la dirección del endpoint, es decir,
  la ruta del servidor que recibe solicitudes de movimiento.
- `-ContentType 'application/json'` avisa que los datos enviados tienen formato JSON.
- `-Body $estado` coloca el estado del juego en el cuerpo de la solicitud.
- `$respuesta | ConvertTo-Json` muestra la respuesta como JSON para leerla fácilmente.

Deberías ver:

```json
{
  "A1": "N"
}
```

Significa: «mover la pieza A1 hacia el norte». El servidor responde con código
HTTP **200**, que indica éxito, aunque este comando solo muestra el contenido
de la respuesta. El bot propone el movimiento; esta prueba no mueve piezas
ni muestra una partida en pantalla.

Abrir esa dirección en un navegador no hace esta misma prueba: el navegador
envía normalmente un `GET`, pero nuestro endpoint espera un `POST` con el estado.

Para ejecutarlo en sistemas unix(Linux,MacOs,git bash):

previamente instalar curl
```bash
npm install curl
```

```bash
curl -X POST http://localhost:3000/move \
  -H "Content-Type: application/json" \
  --data @fixtures/state1.json
```
- `curl -X POST ... `→ equivalente a Invoke-RestMethod -Method Post
- `-H "Content-Type: application/json"` → equivalente a -ContentType 'application/json'
- `--data @fixtures/state1.json `→ el @ le dice a curl que lea el body desde ese archivo (reemplaza el Get-Content -Raw + -Body)


## Paso 4: probar otros casos

También hay un segundo ejemplo listo para usar: `fixtures/state2.json`.
Tiene otro tablero, el jugador `B` y un dado con valor `2`. Para enviarlo,
ejecutá estas tres líneas en la segunda terminal:

#### Powershell
```powershell
$estado = Get-Content -Raw fixtures/state2.json
$respuesta = Invoke-RestMethod -Method Post -Uri http://localhost:3000/move -ContentType 'application/json' -Body $estado
$respuesta | ConvertTo-Json
```
#### Bash
```bash
curl -X POST http://localhost:3000/move \
  -H "Content-Type: application/json" \
  --data @fixtures/state2.json
```

Deberías recibir `{"B1":"N","B2":"N"}`: un movimiento hacia el norte
por cada ficha del jugador B que aparece en ese tablero.

Abrí `fixtures/state1.json` en el editor. Después de cada cambio, guardá el archivo
y **volvé a ejecutar las tres líneas del paso 3** para leer su nuevo contenido.

| Cambio en el archivo | Resultado esperado |
| --- | --- |
| Cambiar `"jugador": "A"` por `"jugador": "B"` | Devuelve `{"B2":"N"}`, usando la pieza B2 del ejemplo. |
| Cambiar el dado a `1` o `2` | La solicitud sigue siendo válida; la estrategia todavía no usa el dado para elegir. |
| Cambiar el dado a `4` | Devuelve HTTP 400 porque el dado solo admite 1, 2 o 3. |
| Quitar una casilla de una fila | Devuelve HTTP 400 porque el tablero debe medir 10×10. |

Probá un cambio por vez y deshacelo antes del siguiente. En los casos inválidos,
PowerShell mostrará un error de la solicitud: es el resultado esperado. El bot
debe seguir ejecutándose en la primera terminal. Al terminar, restaurá el archivo
original para que las pruebas automáticas sigan usando los mismos datos.

## Pruebas automáticas

Las pruebas usan Jest. Podés ejecutarlas con un solo comando:

```powershell/bash
npm test
```

No hace falta iniciar el bot para esto: las pruebas levantan su propio servidor
temporal y lo cierran al terminar. Comprueban las respuestas para A y B, los valores
del dado y el rechazo de estados inválidos. Si todo está bien, el resumen indica
`Tests: 6 passed, 6 total`. También verifican que se muevan todas las fichas
propias, se ignoren las ajenas y neutrales, y no se modifique el estado.

## Problemas frecuentes

| Mensaje o problema | Qué revisar |
| --- | --- |
| No se encuentra `package.json` o `fixtures/state1.json` | La terminal debe estar en la carpeta del proyecto. Comprobalo con `dir`. |
| No se puede conectar con el servidor | Verificá que `npm run dev` siga activo en la primera terminal y que la URL use el mismo puerto. |
| `EADDRINUSE` | El puerto 3000 ya está ocupado. Si tenés otra copia del bot abierta, detenela con Ctrl+C. |
| `Cannot GET /move` en el navegador | Enviá el POST desde PowerShell siguiendo el paso 3. |
| Error 400 al enviar el estado | Revisá el jugador, el dado, las dimensiones del tablero y la sintaxis JSON. |
| PowerShell bloquea `npm.ps1` por la política de ejecución | Usá `npm.cmd` en lugar de `npm`, por ejemplo `npm.cmd run dev`. |

## Otros comandos del proyecto

| Comando | Para qué sirve |
| --- | --- |
| `npm run dev` | Inicia el bot y lo reinicia al guardar cambios en el código. |
| `npm start` | Compila TypeScript a JavaScript en `dist/` e inicia el bot sin reinicio automático. |
| `npm run build` | Solo compila; no inicia el servidor. |
| `npm run typecheck` | Revisa los tipos sin generar archivos ni iniciar el servidor. |
| `npm test` | Ejecuta las pruebas automáticas. |

El puerto predeterminado es `3000`; se puede cambiar con la variable de entorno `PORT`.

## Formato del estado y organización del código

El body es un objeto `State`, definido en `src/types.ts`, con:

- `jugador`: `"A"` o `"B"`.
- `dado`: entero de 1 a 3.
- `tablero`: matriz de exactamente 10 filas y 10 columnas.

Las casillas contienen `""` (vacía), `"N"` (casa neutral) o un ID de pieza
como `"A1"`, `"A2"` o `"B2"`, con un entero positivo. El tablero usa tuplas
de longitud 10. El endpoint valida el JSON recibido y devuelve 400 si es inválido.

La estrategia recorre todo el tablero y devuelve norte para cada pieza propia,
por ejemplo `{"A1":"N","A2":"N"}`. Si no hay piezas propias, devuelve `{}`. No modifica el estado.
Por ahora no usa el dado para decidir ni verifica si el movimiento es legal.

La estrategia está en `src/strategy.ts`, el handler en `src/move.ts`,
la validación en `src/state.ts`, la configuración HTTP en `src/app.ts`
y el arranque en `src/server.ts`.

El diccionario de direcciones sigue el formato solicitado para este bot; difiere
del objeto `{pieceId, direction}` mostrado en el PDF de la clase.
