# Conciliación de Bitácoras · Musicala

Panel estático para cruzar clases registradas en RIP Musicala con bitácoras de clase.

## Qué hace

- Lee clases desde Firebase RIP, colección `registro`.
- Lee bitácoras desde Firebase Bitácoras, colección `bitacoras`.
- Lee estudiantes desde Firebase Bitácoras, colección `students`, para resolver IDs y nombres.
- Calcula el contador de clase desde RIP, agrupando por `estudianteKey + profesorKey` y ordenando cronológicamente.
- Normaliza/expande cada bitácora a una fila por estudiante.
- Cruza cada bitácora normalizada contra RIP por `fecha + profesorKey + estudianteKey` y usa la hora como desempate cuando hay varias clases el mismo día con el mismo profe.
- Después de encontrar la clase RIP equivalente, le asigna a esa bitácora el contador calculado y genera la llave:

```txt
fecha + profesorKey + estudianteKey + contadorClase
```

- No usa servicio/proceso como llave porque ese dato puede variar.
- Detecta OK exacto, OK probable, faltantes, extras, duplicadas, profe distinto, parcial grupal y casos para revisar por ambigüedad.
- Exporta CSV.
- Exporta o sincroniza documentos `expected_class_logs` para que luego la app de Bitácoras pueda mostrar clases pendientes por profe.

## Idea clave

RIP no necesita traer contador. La app lo calcula.

La bitácora tampoco necesita traer contador al principio. La app puede inferirlo así:

1. Toma una bitácora.
2. La convierte en una o varias filas, una por estudiante.
3. Busca en RIP la clase del mismo día, profe y estudiante.
4. Si hay varias posibles, usa hora como apoyo.
5. Cuando encuentra la clase RIP, toma el contador calculado desde RIP.
6. Genera `classLogKey`.

Eso es lo que en los docs llamamos “bitácora normalizada/expandida”. No es otro formulario ni otra bitácora. Es la misma bitácora, pero convertida internamente en filas comparables.

## Caso delicado: varias clases el mismo día

Si un estudiante tiene varias clases el mismo día con el mismo docente, `fecha + profe + estudiante` ya no alcanza. En ese caso el conciliador hace esto:

1. Busca todas las clases RIP posibles de ese día.
2. Si la bitácora tiene `horaClase`, escoge la clase RIP con hora más cercana, máximo a 45 minutos.
3. Si la hora empata entre dos clases, o si la bitácora no tiene hora, marca **Revisar**.
4. Para resolverlo de forma perfecta en el futuro, la bitácora creada desde una clase pendiente debe guardar `ripRegistroIds` y `classLogKeys`.

Sin hora ni vínculo directo no existe una forma honesta de saber si la bitácora era de la clase de las 3:00 o la de las 4:00. Se puede adivinar, pero para eso ya existe la astrología administrativa.

## Archivos principales

```txt
index.html
css/styles.css
js/app.js
js/firebase-config.js
data/sample-rip.json
data/sample-bitacoras.json
docs/modelo-datos.md
docs/implementar-en-bitacora.md
rules/expected_class_logs.rules.snippet
```

## Cómo probar local

Por ser módulos ES, abre con servidor local. No con doble clic, porque el navegador se pone exquisito.

```bash
python -m http.server 8080
```

Luego abre:

```txt
http://localhost:8080
```

Puedes usar **Modo prueba** sin iniciar sesión.

## Cómo subir a GitHub Pages

1. Crea un repositorio nuevo, por ejemplo `conciliacion-bitacoras`.
2. Sube todos los archivos del ZIP.
3. En GitHub: Settings → Pages.
4. Source: Deploy from branch.
5. Branch: `main` / root.
6. Abre la URL publicada.

## Conexión real

El archivo `js/firebase-config.js` trae los proyectos web:

- `rip-musicala`
- `bitacoras-de-clase`

Esto no reemplaza las reglas de seguridad. Firebase usa esas configuraciones para identificar el proyecto, pero el acceso real lo controlan Auth, Firestore Rules y App Check.

## Importante sobre contadores

El contador se calcula desde RIP, no desde Bitácoras.

La fórmula operativa es:

```txt
contadorClase = posición cronológica de la clase dentro de estudiante + profe
```

Ejemplo: si Juan Pérez ha tenido 7 clases con Laura, la séptima clase RIP de esa dupla queda con `contadorClase: 7`.

Si las bitácoras actuales no guardan contador, el panel igual puede conciliarlas usando fecha + profe + estudiante, y luego les asigna el contador calculado desde RIP para generar la llave.

Para que en adelante sea más exacto, al guardar bitácoras desde una clase pendiente se recomienda agregar:

```js
ripRegistroIds
classCounters
classLogKeys
horaClase
profesorKey
```

Ver `docs/implementar-en-bitacora.md`.
