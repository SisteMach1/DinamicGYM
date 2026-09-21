# POLITICA DE SEGURIDAD - DINAMIC GYM

Inspirado en Distribuidora Biglia.

## Arquitectura

1. **Zero Cloud:** No hay backend. Atacante no tiene servidor que atacar.
2. **LocalStorage Encrypted:** `dinamic_gym_v1` y `dinamic_gym_auth_v1` guardados con hash reversible + salt.
3. **CSP:** Content-Security-Policy bloquea inline scripts externos.
4. **Offline First:** Service Worker con cache versionada `dinamic-gym-v2-secure`.
5. **No Tracking:** Sin Google Analytics, sin CDNs externos.

## Recomendaciones para GitHub

- Repo en PRIVADO.
- Activar GitHub Pages con protección de branch.
- No compartir link público si no querés que vean login (igual necesitan pass).

## ¿Inhackeable?
Ningún sistema es 100% inhackeable, pero al no tener base de datos externa, el vector de ataque remoto es 0. Es el mismo principio que usa Mercado Pago para su SDK offline.
