# Registro de Mejoras — Gather Clone

> Última actualización: 19 de marzo de 2026

---

## 🐳 Docker y Entorno de Desarrollo

- **Hot Reload completo** — Cliente (Vite) y servidor (Nodemon) recargan automáticamente al guardar cambios sin reiniciar los contenedores.
- **Volúmenes nombrados** — `client_node_modules` y `server_node_modules` declarados en `docker-compose.yml` como volúmenes Docker gestionados. Evita que el bind-mount del código fuente sobreescriba los módulos instalados dentro de la imagen.
- **Polling de archivos** — `usePolling: true` + `interval: 300` en `vite.config.js` y la flag `-L` en Nodemon garantizan detección de cambios en Docker sobre Windows (donde los eventos `inotify` no funcionan).

---

## 🏗️ Reestructuración del Proyecto

- **Separación clara cliente/servidor** — Cada servicio tiene su propio `Dockerfile.dev`. El cliente solo sabe de Vite; el servidor solo sabe de Node/Nodemon.
- **`jsconfig.json` en el cliente** — Añadido con opciones completas (`target`, `module`, `moduleResolution`, `jsx`, `strict`, etc.) para que el transpilador Oxc de Vite 8 resuelva correctamente los tipos JSX.
- **Variables de entorno correctas** — `VITE_SERVER_URL=http://localhost:3001` en el cliente; `PORT=3001` y `NODE_ENV=development` en el servidor.

---

## 🧘 Modo Zen

El Modo Zen permite trabajar sin distracciones. Al activarse bloquea completamente las interacciones de chat y video, y solo muestra quién está cerca.

### Comportamiento
- **Al activar** — Se desmontan del DOM: `HUD`, `BuilderPanel`, `ReactionOverlay` e indicador de zoom. Solo permanecen el mapa Phaser y el botón 🧘.
- **Al activar** — Si el usuario estaba en una conversación activa, **la abandona automáticamente** (`leaveConversation()`).
- **Mientras está activo** — El hook `useProximityChat` recibe `zenMode=true` y bloquea la creación de nuevas conexiones WebRTC (`createPeer`) y el inicio de conversaciones (`conv:start`), sin importar la proximidad.
- **Radio de proximidad** — Pasa de 4 tiles (normal) a 1 tile (zen). El anillo visual en Phaser se sincroniza en tiempo real a través de `window.__GATHER__.proximityRadius`.
- **Al desactivar** — Todo vuelve a la normalidad: el HUD reaparece y las conexiones por proximidad se retoman.

### Notificaciones de presencia
Cuando el modo está activo y hay compañeros dentro del radio de 4 tiles de notificación (independiente del radio de 1 tile de conexión), aparece un panel flotante encima del botón con una tarjeta por cada persona:

```
● Ana García is nearby
● Luis Martínez is nearby
```

Las tarjetas se animan con un slide-in y desaparecen solos cuando el compañero se aleja.

### Lo que NO hace en modo Zen
- ❌ No inicia conversaciones automáticas
- ❌ No muestra solicitudes de unión
- ❌ No activa la cámara/micrófono
- ❌ No muestra el video de otros

---

## 💬 Sistema de Conversaciones (Modo Normal)

- **Inicio automático** — Cuando dos jugadores sin conversación activa se acercan a ≤ 4 tiles, se crea automáticamente una conversación y se establece la conexión WebRTC.
- **Solicitud de unión** — Un jugador externo puede pedir unirse a una conversación existente desde el HUD. Los miembros actuales reciben una tarjeta con botones **Aprobar** / **Rechazar**.
- **Salida limpia** — Al pulsar "Leave", se destruyen los peers WebRTC, se libera la cámara y se notifica al servidor.
- **Video siempre montado** — `VideoOverlay` permanece en el DOM en todo momento (incluso en modo Zen) para que las streams WebRTC no se pierdan al cambiar de modo.

---

## 😊 Reacciones con Emoji

- **Tray de reacciones** — Botón circular en esquina inferior derecha (derecha del botón Zen). Despliega un panel con los emojis disponibles.
- **Broadcast global** — Las reacciones se emiten vía `player:reaction` → `player:reacted` y aparecen sobre el avatar del jugador en Phaser en tiempo real para todos los conectados.
- **Lista blanca** — Solo se permiten emojis de la constante `ALLOWED_REACTIONS` del servidor, previniendo envío de datos arbitrarios.

---

## Cómo levantar el proyecto

```bash
# Primera vez o tras cambios en package.json / Dockerfiles
docker compose up --build

# Ejecuciones posteriores (más rápido, usa caché)
docker compose up

# Limpiar todo (incluye volúmenes de node_modules)
docker compose down -v
```

| Servicio | URL |
|----------|-----|
| Cliente (Vite) | http://localhost:5173 |
| Servidor (Express + Socket.io) | http://localhost:3001 |
