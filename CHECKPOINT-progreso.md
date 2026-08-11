### BLOQUE 2 - Motor WhatsApp [COMPLETADO 2026-08-07 09:13]
- Docker + WSL2 operativos
- Evolution API v2.3.7 corriendo (evolution+postgres+redis)
- Instancia 'sergio-personal' vinculada y en estado open
- Primer mensaje real enviado con exito (status PENDING)
- API Key motor guardada en docker/.env

### BLOQUE 3 - Supabase [COMPLETADO 2026-08-10 12:49]
- Proyecto Supabase 'whatsgate' (ipctbyobohuikkhyymos) creado y linkeado
- Schema: 4 tablas (profiles, instances, messages_log, groups_cache) + RLS + triggers
- Migracion aplicada a produccion (db push) y local (start)
- Edge Function api-proxy: valida x-api-token, rutea a Evolution, registra en messages_log
- Instancia 'sergio-personal' creada, token propio funcionando
- PRUEBA E2E OK: token -> api-proxy -> Evolution -> WhatsApp + registro en messages_log
- GRANT a service_role agregado a la migracion

### BLOQUE 4 - Frontend Next.js [COMPLETADO 2026-08-10 15:58]
- Next.js 16 + TS + Tailwind en web/
- Supabase conectado (client, server, middleware)
- Login, Dashboard con metricas, Instancias con token real
- Commit + push a Moblar-Osmon/whatsgate

### BLOQUE 5 - Deploy completo [COMPLETADO 2026-08-11 10:34]
- Frontend en Vercel: whatsgate-cha.vercel.app
- Supabase Auth configurado (Site URL + Redirect)
- api-proxy desplegado a produccion (Supabase nube)
- Motor expuesto via tunel ngrok
- Secrets EVOLUTION_API_URL y KEY configurados en produccion
- PRUEBA E2E DESDE INTERNET OK: mensaje enviado via api-proxy nube -> tunel -> motor -> WhatsApp
- URL real puesta en docs
- Vercel redespliega automatico con git push
- PENDIENTE: privar repo, tunel cambia de URL al reiniciar (Hetzner futuro)

### BLOQUE 6 - Multi-instancia + PDFs [COMPLETADO 2026-08-11 12:14]
- api-proxy ampliado con acciones admin (JWT): create-instance, get-qr, list-instances, delete-instance, sync-status
- UI: boton Agregar instancia con modal + QR en navegador
- UI: boton Sincronizar estado (actualiza status y numero desde el motor)
- Multi-instancia funcionando: 2 instancias conectadas (Sergio Personal + Servicio al cliente)
- Docs con selector de instancia (ejemplos por token)
- Envio de PDFs probado y documentado (send-file con URL de Storage)
- Flujo PDF+mensaje documentado (caso cotizacion)
- Auth dual confirmada: JWT para admin, x-api-token para envio
- Todo desplegado en produccion (Vercel + Supabase)

