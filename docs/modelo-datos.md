# Modelo de datos recomendado

## Llave de conciliación

La conciliación no usa servicio/proceso porque ese texto puede variar entre RIP y Bitácoras.

La llave final es:

```txt
fecha + profesorKey + estudianteKey + contadorClase
```

Ejemplo:

```txt
2026-07-06|laura-gomez|juan-perez|7
```

## De dónde sale el contador

RIP no trae contador. El panel lo calcula.

El cálculo es:

```txt
contadorClase = número de clase del estudiante con ese profe, ordenado por fecha y hora
```

Ejemplo RIP simplificado:

| Fecha | Hora | Profe | Estudiante | Contador calculado |
|---|---:|---|---|---:|
| 2026-07-01 | 15:00 | Laura | Juan | 1 |
| 2026-07-03 | 15:00 | Laura | Juan | 2 |
| 2026-07-06 | 15:00 | Laura | Juan | 3 |

La llave de la tercera clase sería:

```txt
2026-07-06|laura|juan|3
```

## Qué es una bitácora normalizada o expandida

Una bitácora normalizada/expandida **no es una bitácora nueva**.

Es la misma bitácora original, pero convertida por el sistema en una estructura más fácil de comparar contra RIP.

Por ejemplo, una bitácora grupal original puede decir:

```json
{
  "fechaClase": "2026-07-06",
  "docente": "Carlos Ruiz",
  "studentIds": ["juan", "maria", "ana"],
  "mode": "group"
}
```

Internamente el panel la expande así:

```json
[
  { "fecha": "2026-07-06", "profesorKey": "carlos-ruiz", "estudianteKey": "juan" },
  { "fecha": "2026-07-06", "profesorKey": "carlos-ruiz", "estudianteKey": "maria" },
  { "fecha": "2026-07-06", "profesorKey": "carlos-ruiz", "estudianteKey": "ana" }
]
```

Luego busca en RIP cada combinación `fecha + profe + estudiante`. Cuando encuentra la clase RIP equivalente, le agrega:

```json
{
  "contadorClase": 5,
  "ripRegistroId": "abc123",
  "classLogKey": "2026-07-06|carlos-ruiz|juan|5"
}
```

Eso permite conciliar incluso si la bitácora original no guardaba contador.

## Cuando hay varias clases el mismo día

El cruce base `fecha + profe + estudiante` funciona cuando solo hay una clase posible ese día.

Si hay dos o más clases RIP para el mismo estudiante con el mismo profe en la misma fecha, el panel usa `horaClase` como desempate:

```txt
RIP 15:00 · Juan · Laura · contador 7
RIP 16:00 · Juan · Laura · contador 8
Bitácora 16:05 · Juan · Laura => se vincula a contador 8
```

Si la bitácora no trae hora, o si la hora queda empatada entre dos clases, el estado será `Revisar`. Eso no es un error del sistema: es el sistema negándose a inventar datos, que ya bastante hace la humanidad con las hojas de cálculo.

La solución más fuerte para bitácoras futuras es guardar desde el formulario:

```txt
ripRegistroIds
classLogKeys
classCounters
horaClase
```

## Documento esperado generado desde RIP

Colección recomendada en Firebase Bitácoras:

```txt
expected_class_logs
```

Documento ejemplo:

```json
{
  "source": "rip",
  "ripRegistroId": "abc123",
  "fecha": "2026-07-06",
  "hora": "15:00",
  "profesorNombre": "Laura Gómez",
  "profesorKey": "laura-gomez",
  "profesorEmail": "laura@correo.com",
  "estudianteNombre": "Juan Pérez",
  "estudianteKey": "juan-perez",
  "contadorClase": 7,
  "classLogKey": "2026-07-06|laura-gomez|juan-perez|7",
  "servicioOriginal": "Piano personalizado",
  "matchedBitacoraId": null,
  "reconciliationStatus": "missing"
}
```

## Campos nuevos recomendados en cada bitácora hacia adelante

Estos campos no son obligatorios para conciliar bitácoras antiguas, pero sí ayudan a que las nuevas queden exactas desde el inicio.

```json
{
  "fechaClase": "2026-07-06",
  "horaClase": "15:00",
  "profesorKey": "laura-gomez",
  "studentIds": ["juan-perez"],
  "classCounters": {
    "juan-perez": 7
  },
  "classLogKeys": [
    "2026-07-06|laura-gomez|juan-perez|7"
  ],
  "ripRegistroIds": ["abc123"],
  "reconciliation": {
    "status": "matched",
    "matchedAt": "2026-07-06T20:00:00.000Z",
    "matchedBy": "system"
  }
}
```

## Clases grupales

Una bitácora grupal puede cubrir varios estudiantes. El sistema la expande internamente a una fila por estudiante.

```json
{
  "mode": "group",
  "fechaClase": "2026-07-06",
  "horaClase": "16:00",
  "docente": "Carlos Ruiz",
  "profesorKey": "carlos-ruiz",
  "studentIds": ["juan-perez", "maria-gomez"],
  "classCounters": {
    "juan-perez": 5,
    "maria-gomez": 4
  },
  "classLogKeys": [
    "2026-07-06|carlos-ruiz|juan-perez|5",
    "2026-07-06|carlos-ruiz|maria-gomez|4"
  ]
}
```

## Estados del panel

| Estado | Significado |
|---|---|
| OK exacto | Coincide por `ripRegistroId`, `classLogKey` o contador calculado. |
| OK probable | Coincide fecha + profe + estudiante, pero requiere revisión por falta de dato fuerte. |
| Faltante | RIP tiene clase, pero no hay bitácora. |
| Parcial grupal | Hay bitácora grupal del día/profe, pero no incluye a ese estudiante. |
| Profe distinto | Hay bitácora para estudiante/fecha, pero con otro docente. |
| Extra | Hay bitácora sin clase RIP equivalente. |
| Duplicada | Hay más de una bitácora para la misma clase esperada. |
