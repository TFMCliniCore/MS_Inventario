# MS Inventario

Microservicio REST construido con NestJS, Prisma y PostgreSQL para administrar el inventario de CliniCore.

## Responsabilidades

- Gestionar categorias de productos e insumos veterinarios
- Registrar y consultar productos con control de stock
- Registrar movimientos de inventario (entradas, salidas y ajustes) con trazabilidad completa
- Buscar y filtrar productos por multiples criterios
- Importar productos masivamente desde archivos `.xlsx`, `.xls` o `.csv`
- Servir imagenes de productos subidas localmente

## Stack

- NestJS
- Prisma ORM
- PostgreSQL 16
- Docker / Docker Compose
- TypeScript
- Multer
- XLSX

## Variables de entorno

Crear el archivo `.env` a partir de `.env.example`:

```env
PORT=3007
POSTGRES_USER=<usuario_postgres>
POSTGRES_PASSWORD=<password_postgres>
POSTGRES_DB=ms-inventario
POSTGRES_PORT=5437
DATABASE_URL=postgresql://<usuario_postgres>:<password_postgres>@localhost:5437/ms-inventario?schema=public
MS_ENTIDADES_URL=http://localhost:3001/api/v1
MS_AGENDA_URL=
```

Variables principales:

- `PORT`: puerto HTTP donde se expone la API.
- `DATABASE_URL`: cadena de conexion usada por Prisma.
- `MS_ENTIDADES_URL`: URL base del microservicio de entidades para consultar usuarios y sucursales.
- `MS_AGENDA_URL`: variable disponible para integraciones futuras.

## Ejecucion con Docker

```bash
docker compose up --build
```

Servicios disponibles:

- API: `http://localhost:3007`
- PostgreSQL: `localhost:5437`

Al iniciar el contenedor de la API se ejecutan:

1. Migraciones de Prisma
2. Seed con datos iniciales
3. Arranque del servidor NestJS

Para detener:

```bash
docker compose stop
```

Para detener y borrar volumenes:

```bash
docker compose down -v
```

## Ejecucion local

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev
```

Comandos utiles:

```bash
npm run build
npm run start
npm run start:dev
npm run start:prod
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:migrate:deploy
npm run prisma:seed
```

## Estructura principal

```text
src/
  app.controller.ts
  app.module.ts
  app.service.ts
  categorias/
    dto/
    categorias.controller.ts
    categorias.module.ts
    categorias.service.ts
  entidades-client/
    entidades-client.module.ts
    entidades-client.service.ts
  movimientos-stock/
    dto/
    movimientos-stock.controller.ts
    movimientos-stock.module.ts
    movimientos-stock.service.ts
  prisma/
    prisma.module.ts
    prisma.service.ts
    prisma-client-exception.filter.ts
  productos/
    dto/
    productos.controller.ts
    productos.module.ts
    productos.service.ts
  uploads/
    uploads.controller.ts
    uploads.module.ts
prisma/
  migrations/
  schema.prisma
  seed.js
uploads/
  productos/   ← imagenes subidas via API
```

## Datos iniciales precargados

El seed crea registros iniciales para:

**Categorias:**
- Medicamentos
- Alimentos
- Accesorios
- Vacunas

**Productos de ejemplo:**
- Amoxicilina 500mg
- Alimento Premium Perros Adultos 3kg
- Vacuna Antirabica
- Collar antipulgas talla M

El seed se omite automaticamente si ya existen categorias registradas.

## URL Base

```text
http://localhost:3007/api/v1
```

## Tabla de endpoints

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/api/v1/categorias` | Lista categorias activas ordenadas por nombre, con conteo de productos activos |
| GET | `/api/v1/categorias/:id` | Obtiene una categoria activa por id |
| POST | `/api/v1/categorias` | Crea una categoria |
| PUT | `/api/v1/categorias/:id` | Reemplaza una categoria |
| PATCH | `/api/v1/categorias/:id` | Actualiza campos de una categoria |
| DELETE | `/api/v1/categorias/:id` | Inactiva una categoria (borrado logico) |
| GET | `/api/v1/productos` | Lista productos activos con filtros opcionales |
| GET | `/api/v1/productos/buscar?q=<texto>` | Busca productos por texto libre en multiples campos |
| GET | `/api/v1/productos/:id` | Obtiene un producto activo por id, con categoria y ultimos 10 movimientos |
| POST | `/api/v1/productos` | Crea un producto |
| PUT | `/api/v1/productos/:id` | Reemplaza un producto |
| PATCH | `/api/v1/productos/:id` | Actualiza campos de un producto |
| DELETE | `/api/v1/productos/:id` | Inactiva un producto (borrado logico) |
| POST | `/api/v1/productos/:id/imagen` | Sube una imagen para el producto (jpeg, png, webp, gif — max 5 MB) |
| POST | `/api/v1/productos/importar/preview` | Valida un archivo y devuelve un preview sin guardar en BD |
| POST | `/api/v1/productos/importar` | Importa productos masivamente desde archivo |
| GET | `/api/v1/movimientos-stock` | Lista movimientos de stock con filtros opcionales |
| GET | `/api/v1/movimientos-stock/producto/:productoId` | Lista movimientos asociados a un producto |
| GET | `/api/v1/movimientos-stock/:id` | Obtiene un movimiento por id |
| POST | `/api/v1/movimientos-stock` | Registra una entrada, salida o ajuste y actualiza el stock |
| GET | `/api/v1/uploads/productos/:filename` | Sirve una imagen subida localmente |

## Filtros disponibles

### Productos — `GET /api/v1/productos`

| Query param | Tipo | Descripcion |
| --- | --- | --- |
| `nombre` | string | Coincidencia parcial en el nombre |
| `codigo` | string | Busca en `codigoBarras` y `codigoInterno` |
| `categoriaId` | number | Filtra por categoria |
| `fabricante` | string | Coincidencia parcial en fabricante |
| `marca` | string | Coincidencia parcial en marca |
| `sucursalId` | number | Filtra por sucursal |
| `stockBajo` | boolean | `true` retorna productos con `cantidadActual <= cantidadMinima` |

Ejemplo:

```text
GET /api/v1/productos?categoriaId=1&stockBajo=true
```

### Busqueda libre — `GET /api/v1/productos/buscar?q=<texto>`

Busca coincidencias en: `nombre`, `codigoBarras`, `codigoInterno`, `fabricante`, `marca`, `descripcion`.
Retorna maximo 50 resultados. El parametro `q` es obligatorio.

### Movimientos de stock — `GET /api/v1/movimientos-stock`

| Query param | Tipo | Descripcion |
| --- | --- | --- |
| `productoId` | number | Filtra por producto |
| `tipo` | string | `ENTRADA`, `SALIDA` o `AJUSTE` |
| `sucursalId` | number | Filtra por sucursal |
| `usuarioId` | number | Filtra por usuario responsable |

Ejemplo:

```text
GET /api/v1/movimientos-stock?productoId=1&tipo=ENTRADA
```

## Reglas de negocio

### Categorias

- Solo se retornan categorias con `eliminado = false`.
- `DELETE` realiza borrado logico (`eliminado = true`), no fisico.
- El listado incluye el conteo de productos activos por categoria.

### Productos

- Solo se retornan productos con `eliminado = false`.
- `DELETE` realiza borrado logico, no fisico.
- `codigoBarras` y `codigoInterno` son unicos cuando se informan. Si ya existe un valor igual, la API devuelve `409 Conflict`.
- `precioVenta` es obligatorio. `precioCompra` es opcional.
- Al obtener un producto por id se incluyen su categoria y sus ultimos 10 movimientos de stock.
- Las imagenes subidas via `POST /api/v1/productos/:id/imagen` se almacenan en `uploads/productos/` con nombre UUID y se sirven en `/api/v1/uploads/productos/:filename`.

### Movimientos de stock

Los tipos permitidos son:

- `ENTRADA`: suma la cantidad al stock actual.
- `SALIDA`: resta la cantidad al stock actual. Si el stock es insuficiente, retorna error.
- `AJUSTE`: reemplaza el stock actual por la cantidad enviada.

Cada movimiento guarda: producto afectado, tipo, cantidad, cantidad anterior, cantidad posterior, motivo, usuario y sucursal.

El registro del movimiento y la actualizacion del stock se realizan dentro de una transaccion atomica.

Los movimientos no se pueden eliminar desde la API para conservar la trazabilidad.

## Importacion masiva de productos

La importacion se realiza enviando un archivo en formato `multipart/form-data` con el campo `file`.

Formatos permitidos: `.xlsx`, `.xls`, `.csv`

Los archivos CSV deben estar codificados en **UTF-8**.

### Columnas esperadas

| Columna | Requerida | Tipo | Descripcion |
| --- | --- | --- | --- |
| `nombre` | Si | string | Nombre del producto |
| `descripcion` | No | string | Descripcion del producto |
| `codigoBarras` | No | string | Codigo de barras |
| `codigoInterno` | No | string | Codigo interno |
| `marca` | No | string | Marca |
| `fabricante` | No | string | Fabricante |
| `precioCompra` | No | decimal | Precio de compra |
| `precioVenta` | Si | decimal | Precio de venta |
| `cantidadActual` | No | entero >= 0 | Stock inicial (defecto: 0) |
| `cantidadMinima` | No | entero >= 0 | Stock minimo (defecto: 0) |
| `cantidadMaxima` | No | entero | Stock maximo |
| `fechaVencimiento` | No | fecha ISO | Fecha de vencimiento (`YYYY-MM-DD`) |
| `imagen` | No | string | URL de imagen del producto |

Una plantilla de ejemplo lista para usar se encuentra en:

```text
plantilla_importacion_productos.csv
```

### Comportamiento ante duplicados

Si un producto a importar tiene `codigoBarras` o `codigoInterno` que ya existe en la base de datos, esa fila se **omite silenciosamente** y se contabiliza en `omitidos`. El resto de filas validas se importa normalmente.

### Preview de importacion

```bash
curl -X POST http://localhost:3007/api/v1/productos/importar/preview \
  -F "file=@plantilla_importacion_productos.csv"
```

Respuesta esperada:

```json
{
  "totalFilas": 10,
  "filasValidas": 10,
  "filasConError": 0,
  "errores": [],
  "preview": []
}
```

### Importacion definitiva

```bash
curl -X POST http://localhost:3007/api/v1/productos/importar \
  -F "file=@plantilla_importacion_productos.csv"
```

Respuesta esperada:

```json
{
  "message": "Importacion completada.",
  "importados": 10,
  "omitidos": 0,
  "errores": []
}
```

## Ejemplos de payload

### Crear categoria

```json
{
  "nombre": "Medicamentos",
  "descripcion": "Farmacos y medicamentos veterinarios"
}
```

### Crear producto

```json
{
  "nombre": "Amoxicilina 500mg",
  "descripcion": "Antibiotico de amplio espectro para uso veterinario",
  "codigoInterno": "MED-001",
  "codigoBarras": "7702011234567",
  "marca": "Vetoquinol",
  "fabricante": "Vetoquinol SA",
  "precioCompra": "8500",
  "precioVenta": "15000",
  "cantidadActual": 50,
  "cantidadMinima": 10,
  "cantidadMaxima": 200,
  "fechaVencimiento": "2026-12-31",
  "imagen": "https://example.com/productos/amoxicilina.jpg",
  "categoriaId": 1,
  "sucursalId": 1
}
```

### Actualizar producto (PATCH)

```json
{
  "precioVenta": "16500",
  "cantidadMinima": 15
}
```

### Registrar entrada de stock

```json
{
  "productoId": 1,
  "tipo": "ENTRADA",
  "cantidad": 20,
  "motivo": "Compra a proveedor",
  "usuarioId": 1,
  "sucursalId": 1
}
```

### Registrar salida de stock

```json
{
  "productoId": 1,
  "tipo": "SALIDA",
  "cantidad": 3,
  "motivo": "Venta en mostrador",
  "usuarioId": 2,
  "sucursalId": 1
}
```

### Registrar ajuste de stock

```json
{
  "productoId": 1,
  "tipo": "AJUSTE",
  "cantidad": 45,
  "motivo": "Ajuste por conteo fisico",
  "usuarioId": 1,
  "sucursalId": 1
}
```

## Modelo de datos

### Categoria

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| `id` | Int | Identificador autoincremental |
| `nombre` | String | Nombre de la categoria (max 100 chars) |
| `descripcion` | String? | Descripcion opcional |
| `eliminado` | Boolean | Borrado logico |
| `createdAt` | DateTime | Fecha de creacion |

### Producto

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| `id` | Int | Identificador autoincremental |
| `nombre` | String | Nombre del producto (max 200 chars) |
| `descripcion` | String? | Descripcion (max 1000 chars) |
| `codigoBarras` | String? | Unico cuando se informa |
| `codigoInterno` | String? | Unico cuando se informa |
| `marca` | String? | Marca del producto |
| `fabricante` | String? | Fabricante |
| `precioCompra` | Decimal? | Precio de compra |
| `precioVenta` | Decimal | Precio de venta (obligatorio) |
| `cantidadActual` | Int | Stock actual (defecto: 0) |
| `cantidadMinima` | Int | Stock minimo de alerta (defecto: 0) |
| `cantidadMaxima` | Int? | Stock maximo |
| `fechaVencimiento` | DateTime? | Fecha de vencimiento |
| `imagen` | String? | URL o ruta de imagen (max 500 chars) |
| `eliminado` | Boolean | Borrado logico |
| `categoriaId` | Int? | Relacion con Categoria |
| `sucursalId` | Int? | Sucursal a la que pertenece |

### MovimientoStock

| Campo | Tipo | Descripcion |
| --- | --- | --- |
| `id` | Int | Identificador autoincremental |
| `tipo` | String | `ENTRADA`, `SALIDA` o `AJUSTE` |
| `cantidad` | Int | Unidades del movimiento |
| `cantidadAnterior` | Int | Stock antes del movimiento |
| `cantidadPosterior` | Int | Stock despues del movimiento |
| `motivo` | String? | Descripcion del motivo |
| `usuarioId` | Int? | Usuario responsable |
| `sucursalId` | Int? | Sucursal asociada |
| `productoId` | Int | Producto afectado |
| `createdAt` | DateTime | Fecha y hora del movimiento |

## Integraciones

### MS Entidades Core

El microservicio incluye un cliente para consultar `MS_Entidades-Core` usando la variable `MS_ENTIDADES_URL`.

Rutas consumidas:

- `GET /sucursales/:id`
- `GET /usuarios/:id`

## Validaciones y errores

La API usa `ValidationPipe` global con `whitelist: true`, `transform: true` y `forbidNonWhitelisted: true`.

| Codigo Prisma | HTTP | Descripcion |
| --- | --- | --- |
| `P2002` | 409 Conflict | Ya existe un registro con un valor unico repetido |
| `P2025` | 404 Not Found | El registro solicitado no existe |
| `P2003` | 400 Bad Request | La operacion viola una relacion requerida |

## Notas

- No se implemento autenticacion en este microservicio.
- Las eliminaciones de categorias y productos son logicas, nunca fisicas.
- Los movimientos de stock no se pueden eliminar desde la API para conservar la trazabilidad.
- La importacion masiva no asigna categoria ni sucursal desde el archivo; los productos importados quedan sin esa relacion inicial.
- `MS_AGENDA_URL` esta definido pero no se consume en la logica actual del microservicio.
