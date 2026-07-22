# Reglas Firestore para la conciliación

Pega los fragmentos de `rules/rip.firestore.rules.snippet` y `rules/bitacoras.firestore.rules.snippet` dentro del bloque `match /databases/{database}/documents` de cada proyecto. No reemplazan las reglas existentes de las apps: se integran con ellas.

## RIP

El panel lee la colección completa `registro` para calcular el contador cronológico por estudiante y docente. Por eso la lectura completa debe ser de administración; una regla no puede filtrar de forma segura datos que el navegador ya descargó.

## Bitácoras

- `expected_class_logs`: administración escribe; cada docente solo lee documentos cuyo `profesorEmail` sea igual a su correo autenticado.
- `bitacoras` y `students`: administración lee para conciliar. Conserva las reglas actuales de escritura de la app de Bitácoras.

## Requisito de roles

Los snippets usan el custom claim `admin: true`. Asígnalo desde un entorno confiable con Firebase Admin SDK o Cloud Functions. No bases el rol de administración en `ADMIN_EMAILS` de `js/firebase-config.js`: ese archivo se entrega al navegador y no protege datos.

## Campos que debe escribir Bitácoras en registros nuevos

Para que cada cruce futuro sea exacto, la app de Bitácoras debe persistir:

```txt
fechaClase, horaClase, profesorKey, studentIds,
ripRegistroIds, classCounters, classLogKeys, reconciliation
```

El detalle y ejemplos de los campos están en `docs/implementar-en-bitacora.md`.
