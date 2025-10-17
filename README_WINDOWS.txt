
# Págamos MVP — Guía paso a paso (Windows)

## 1) Instalar Node.js (una sola vez)
- Abre tu navegador y entra a **nodejs.org**.
- Descarga el instalador **LTS** para Windows (archivo .msi de 64 bits).
- Ejecuta el instalador y pulsa *Next* → *I agree* → *Next* hasta terminar.
- Verifica la instalación: abre **Símbolo del sistema** (Windows + R, escribe `cmd` y Enter) y escribe:
  ```
  node -v
  ```
  Deberías ver un número de versión (por ejemplo `v18.x.x`).

## 2) Descomprimir este proyecto
- Descarga el archivo **pagamos-mvp.zip**.
- Haz clic derecho → **Extraer todo** en una carpeta fácil (por ejemplo, Escritorio).

## 3) Instalar dependencias
- Entra a la carpeta descomprimida `pagamos-mvp`.
- Haz clic en la barra de ruta y escribe `cmd` y presiona **Enter** (esto abrirá la consola *dentro* de esa carpeta).
- En la consola, ejecuta:
  ```
  npm install
  ```
  Esto descargará lo necesario (puede tardar unos minutos).

## 4) Iniciar el servidor
- En la misma consola, ejecuta:
  ```
  npm start
  ```
- Deberías ver: `Págamos MVP listening on 3000`.

## 5) Probar en el navegador
- Abre tu navegador y entra a: **http://localhost:3000**
- Verás un menú con:
  - **Generar vale (admin)** → crea un vale de prueba y te muestra un **QR**.
  - **Verificar vale** → pega el **ID** del vale y verás su estado.
  - **Canjear vale (comercio)** → pega el ID y un número de factura; el vale pasa a **redeemed**.

## 6) Opcional: cambiar el token admin
- Copia el archivo `.env.example` a `.env` y edítalo con el **Bloc de Notas**.
- Cambia `ADMIN_TOKEN=demo-admin-token` por una palabra secreta.
- Guarda el archivo y reinicia con `npm start`.

## 7) Detener el servidor
- En la consola, presiona **Ctrl + C** y confirma con `Y` si te lo pide.

---

> Este proyecto es un **DEMO** para pruebas locales. Para un piloto real, consulta las mejoras de seguridad en el documento y migra a una base de datos gestionada.
