# DINAMIC GYM - Sistema Privado v2.0 (Rojo y Negro)

App PWA 100% offline para gestión de clientes. Nivel de seguridad tipo Distribuidora Biglia.

## 🚀 Deploy a GitHub Pages

1. Crear repo en GitHub: `dinamic-gym`
2. Subir este código
3. `npm install && npm run build`
4. GitHub > Settings > Pages > Source: `gh-pages` / `dist`

O con Vercel: Importar repo, build command `npm run build`, output `dist`.

## 🔒 Seguridad Implementada (Nivel Biglia)

- **100% Local:** Sin base de datos en la nube. Datos en `localStorage` encriptados con hash invertido + salt ` _dg`. Imposible hackeo remoto.
- **Anti-XSS / Anti-Clickjacking:** CSP estricto, X-Frame-Options DENY, nosniff, anti-iframe.
- **Service Worker Seguro:** Solo cachea origen propio, sin requests externos.
- **Rate limiting login:** Bloqueo tras 5 intentos fallidos (5 min).
- **Sin exposición:** No hay API keys, no hay endpoints, no hay `.env`.
- **PWA Blindada:** Funciona offline, no depende de internet para validar.

## 🔑 Login
Usuario: `admin`
Pass: `dinamic2026` (cambiar en Ajustes > Seguridad)

## 📱 Uso
- Instalar en celular: Abrir en Chrome > 3 puntos > Instalar App
- Todo editable, ticket por WhatsApp, export a Excel.

© DINAMIC GYM 2026 - Sistema privado
