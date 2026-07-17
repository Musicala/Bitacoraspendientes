# Cómo integrar esto en la app de Bitácoras

## Principio

RIP no trae contador y Bitácoras tampoco tiene que traerlo obligatoriamente.

El sistema de conciliación puede calcularlo con RIP y anexarlo a la bitácora durante el cruce.

La meta para el futuro es que el docente no tenga que escoger estudiante/fecha/profe desde cero, sino abrir una clase pendiente generada desde RIP.

## Flujo recomendado para docentes

1. El profe entra a Bitácoras.
2. El sistema consulta `expected_class_logs` filtrando por su correo o `profesorKey`.
3. Se muestran tarjetas de clases pendientes:

```txt
15:00 · Juan Pérez · Clase #7
[Crear bitácora]
```

4. Al crear la bitácora desde esa tarjeta, el formulario ya trae:
   - fecha
   - hora
   - estudiante
   - profe
   - contador de clase calculado desde RIP
   - `ripRegistroId`
   - `classLogKey`

5. El profe solo escribe el contenido pedagógico.

## Datos que debe recibir el editor

```js
const selectedExpectedClass = {
  ripRegistroId: "abc123",
  fecha: "2026-07-06",
  hora: "15:00",
  profesorKey: "laura-gomez",
  estudianteKey: "juan-perez",
  contadorClase: 7,
  classLogKey: "2026-07-06|laura-gomez|juan-perez|7",
};
```

## Al guardar bitácora individual

Agregar o fusionar estos campos al documento que ya guarda la app:

```js
{
  fechaClase: selectedExpectedClass.fecha,
  horaClase: selectedExpectedClass.hora,
  profesorKey: selectedExpectedClass.profesorKey,
  studentIds: [selectedExpectedClass.estudianteKey],
  ripRegistroIds: [selectedExpectedClass.ripRegistroId],
  classCounters: {
    [selectedExpectedClass.estudianteKey]: selectedExpectedClass.contadorClase,
  },
  classLogKeys: [selectedExpectedClass.classLogKey],
  reconciliation: {
    status: "matched",
    matchedBy: "teacher_from_expected_class",
    matchedAt: new Date().toISOString(),
  },
}
```

## Al guardar bitácora grupal

Si una bitácora cubre varias clases esperadas:

```js
const expectedClasses = [/* clases seleccionadas */];

const studentIds = expectedClasses.map((item) => item.estudianteKey);
const ripRegistroIds = expectedClasses.map((item) => item.ripRegistroId);
const classLogKeys = expectedClasses.map((item) => item.classLogKey);
const classCounters = Object.fromEntries(
  expectedClasses.map((item) => [item.estudianteKey, item.contadorClase])
);

const bitacoraPatch = {
  mode: "group",
  fechaClase: expectedClasses[0].fecha,
  horaClase: expectedClasses[0].hora,
  profesorKey: expectedClasses[0].profesorKey,
  studentIds,
  ripRegistroIds,
  classCounters,
  classLogKeys,
  reconciliation: {
    status: "matched",
    matchedBy: "teacher_from_expected_class",
    matchedAt: new Date().toISOString(),
  },
};
```

## Bitácoras antiguas

Las bitácoras antiguas pueden no tener:

```txt
ripRegistroIds
classCounters
classLogKeys
horaClase
```

No pasa nada. El conciliador hace una versión normalizada/expandida de cada bitácora y trata de vincularla con RIP por:

```txt
fecha + profe + estudiante
```

Si hay más de una clase posible el mismo día con el mismo profe, usa `horaClase` como desempate. Si la bitácora no tiene hora, o la hora no permite decidir con seguridad, marca `Revisar`.

## Lo que NO debe ser llave

No usar servicio/proceso como condición obligatoria para conciliar.
Puede guardarse como `servicioOriginal` o `procesoTexto`, pero solo para ver contexto.

Sí, esto evita que “Piano”, “MS Piano” y “Personalizada Piano 1” se vuelvan tres realidades paralelas. Qué detallazo.
