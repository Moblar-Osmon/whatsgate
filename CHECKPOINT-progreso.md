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

