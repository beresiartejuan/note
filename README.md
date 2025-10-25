# Editor Markdown por Bloques

Un editor de markdown modular y extensible que funciona con un sist### Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build
```

### Uso Básico

1. **Navegación**:

   - Flechas: Mover cursor
   - Click: Posicionar cursor (futuro)

2. **Escritura de Markdown**:

   - `# Título` + espacio → Encabezado H1
   - `- Lista` + espacio → Lista no ordenada
   - `> Cita` + espacio → Blockquote
   - `**negrita**` → Texto en negrita
   - `*cursiva*` → Texto en cursiva
   - `` `código` `` → Código inline
   - `[texto](url)` → Enlaces
   - `![alt text](url)` → Imágenes

3. **Controles**:
   - Enter: Nuevo bloque/párrafo (o salto de línea en párrafos vacíos)
   - Enter x2: Salto de línea doble (espacio visual)
   - Backspace: Borrar caracteres, saltos de línea y unir bloques
   - Flechas: Navegación completa incluyendo saltos de línea
   - Ctrl+I: Insertar imagen desde URL
   - Ctrl+C: Copiar todo el documento
   - Ctrl+V: Pegar desde portapapeles
   - Ctrl+X: Cortar todo el documento
   - Ctrl+A: Mostrar información del documento
   - Arrastrar y soltar: Insertar imágenes desde archivos
   - Ctrl+S: Guardar (placeholder)
   - Ctrl+O: Abrir (placeholder)

## 🏗️ Estructura de Bloques

```typescript
interface Block {
  id: string; // ID único generado
  type: string; // Tipo de bloque
  content: (string | Block)[]; // Contenido mixto anidado
  attrs: { [key: string]: string }; // Atributos (nivel, URL, etc.)
  parent?: Block; // Referencia al padre (opcional)
}
```

### Ejemplo de Estructura:

```javascript
{
    id: "abc123",
    type: "paragraph",
    content: [
        "Texto normal ",
        {
            id: "def456",
            type: "bold",
            content: ["texto en negrita"],
            attrs: {}
        },
        " más texto."
    ],
    attrs: {}
}
```

## 🔧 Extensibilidad

### Añadir Nuevo Tipo de Bloque

1. **Actualizar tipos** en `types.ts`:

```typescript
type BlockType = "paragraph" | "heading" | "mi-nuevo-bloque";
```

2. **Añadir renderizado** en `htmlRenderer.ts`:

```typescript
case 'mi-nuevo-bloque':
    return `<div class="mi-bloque">${contentHtml}</div>`;
```

3. **Añadir detección** en `parser.ts` (si necesario):

```typescript
// Detectar sintaxis personalizada
if (text.match(/^@mi-sintaxis\s/)) {
  return { type: "mi-nuevo-bloque", content: "...", attrs: {} };
}
```

### Personalizar Comportamiento

El sistema está diseñado para ser modular. Cada módulo maneja una responsabilidad específica, facilitando modificaciones sin afectar otras partes del código.

## 🔄 Manejo de Saltos de Línea

El editor incluye manejo avanzado de saltos de línea:

- **Saltos simples**: Enter crea nuevos párrafos
- **Saltos dobles**: Enter en párrafo vacío crea `line-break` visible
- **Eliminación inteligente**: Backspace maneja saltos y unión de bloques
- **Limpieza automática**: Máximo 2 saltos consecutivos
- **Navegación fluida**: Cursor se mueve correctamente entre todos los tipos

Ver [LINEBREAK_HANDLING.md](./LINEBREAK_HANDLING.md) para detalles técnicos.

## � Copiar y Pegar

El editor incluye funcionalidad completa de clipboard:

### Funciones Disponibles

- **Ctrl+C**: Copia todo el documento en formato markdown
- **Ctrl+V**: Pega contenido desde el portapapeles (con conversión automática)
- **Ctrl+X**: Corta todo el contenido del documento
- **Ctrl+A**: Muestra información sobre el documento actual

### Características

- ✅ **Clipboard del sistema**: Usa la API nativa del navegador cuando está disponible
- ✅ **Fallback interno**: Clipboard interno como respaldo
- ✅ **Conversión automática**: Convierte bloques a markdown y viceversa
- ✅ **Feedback visual**: Notificaciones toast para confirmar acciones
- ✅ **Manejo de saltos de línea**: Preserva la estructura del documento
- ✅ **Compatibilidad**: Funciona con contenido externo copiado

### Limitaciones Actuales

- Las operaciones afectan todo el documento (no hay selección parcial aún)
- El pegado convierte todo a texto plano con procesamiento markdown

## �🖼️ Inserción de Imágenes

El editor soporta múltiples formas de insertar imágenes:

### Sintaxis Markdown

```markdown
![Texto alternativo](https://ejemplo.com/imagen.jpg)
![Imagen con dimensiones](https://ejemplo.com/imagen.jpg){200x150}
![Imagen pequeña](url){50x50}
```

**Dimensiones opcionales**: Añade `{WIDTHxHEIGHT}` al final para especificar tamaño exacto.

### Métodos de Inserción

1. **Escritura directa**: Escribe la sintaxis markdown manualmente
2. **Atajo de teclado**: Presiona `Ctrl+I` para abrir diálogo de URL
3. **Arrastrar y soltar**: Arrastra archivos de imagen directamente al editor

### Características

- ✅ **Dimensiones personalizadas**: Sintaxis `{WIDTHxHEIGHT}` para tamaño exacto
- ✅ **Auto-centrado**: Sin dimensiones, imagen centrada con mínimo 100px de ancho
- ✅ **Soporte para archivos locales** mediante drag & drop
- ✅ **Conversión automática a base64** para archivos locales
- ✅ **Estilos automáticos** con bordes redondeados y sombras
- ✅ **Imágenes responsivas** (se adaptan cuando no tienen dimensiones fijas)

### Ejemplos de Uso

```markdown
# Imagen automática (centrada, min 100px)

![Logo del proyecto](https://ejemplo.com/logo.png)

# Imagen con dimensiones específicas

![Avatar](https://ejemplo.com/avatar.jpg){64x64}

# Imagen grande personalizada

![Banner](https://ejemplo.com/banner.png){800x200}

# Sintaxis incorrecta (se ignora la parte de dimensiones)

![Imagen](url.jpg){malformateado} → Se renderiza como imagen automática
```

### Formatos Soportados

Todos los formatos de imagen web estándar:

- JPG/JPEG
- PNG
- GIF
- SVG
- WebP

## 🎨 Tecnologías

- **TypeScript**: Tipado estático y mejor experiencia de desarrollo
- **Vite**: Build tool rápido y moderno
- **CSS Custom Properties**: Temas y estilos personalizables
- **Normalize.css**: Consistencia entre navegadores
- **Fuente Quicksand**: Tipografía moderna y legible

---

_Editor desarrollado con arquitectura modular para facilitar mantenimiento y extensibilidad._ anidados. Permite crear estructuras complejas de contenido con una arquitectura limpia y bien organizada.

## 🚀 Características

### Bloques de Nivel Superior

- **Párrafos**: Texto normal con conversión automática
- **Encabezados**: `#`, `##`, `###`, etc. (H1-H6)
- **Listas**:
  - No ordenadas: `-`, `*`, `+` + espacio
  - Ordenadas: `1.` + espacio
- **Citas**: `>` + espacio
- **Bloques de Código**: ` ``` ` + lenguaje opcional

### Bloques Inline (anidados)

- **Negrita**: `**texto**`
- **Cursiva**: `*texto*`
- **Código inline**: `` `código` ``
- **Enlaces**: `[texto](url)`

## 📁 Arquitectura del Código

El código está organizado en módulos especializados para facilitar el mantenimiento:

```
src/
├── main.ts              # Punto de entrada de la aplicación
├── index.ts             # Exportaciones principales
├── types.ts             # Interfaces y tipos TypeScript
├── utils/
│   └── blockUtils.ts    # Utilidades para crear/manipular bloques
├── markdown/
│   └── parser.ts        # Procesador de sintaxis markdown
├── renderer/
│   └── htmlRenderer.ts  # Convertidor de bloques a HTML
└── editor/
    ├── Writer.ts        # Clase principal del editor
    ├── cursor.ts        # Manejo de posición del cursor
    ├── textOperations.ts# Operaciones de edición de texto
    ├── blockConverter.ts# Conversión automática de markdown
    └── display.ts       # Renderizado con cursor visible
```

### Módulos Principales

#### 🎯 `types.ts`

Define la interfaz `Block` y tipos principales:

- Estructura de bloques anidados
- Tipos de bloques soportados
- Sistema de posición del cursor

#### 🔧 `utils/blockUtils.ts`

Utilidades para crear y manipular bloques:

- Generación de IDs únicos
- Factory functions para bloques
- Operaciones básicas de bloques

#### 📝 `markdown/parser.ts`

Procesamiento de sintaxis markdown:

- Detección de patrones markdown de nivel de bloque
- Procesamiento de markdown inline (negrita, cursiva, etc.)
- Conversión de texto plano a bloques estructurados

#### 🎨 `renderer/htmlRenderer.ts`

Conversión de bloques a HTML:

- Renderizado recursivo de bloques anidados
- Manejo de diferentes tipos de bloque
- Generación de HTML semántico

#### ⌨️ `editor/` - Módulos del Editor

**`cursor.ts`** - Navegación del cursor:

- Movimiento entre bloques y contenido
- Preservación de posición horizontal
- Transiciones fluidas entre elementos

**`textOperations.ts`** - Operaciones de edición:

- Inserción y eliminación de caracteres
- Unión de bloques en backspace
- Creación de nuevos bloques con Enter

**`blockConverter.ts`** - Conversión automática:

- Detección de sintaxis markdown en tiempo real
- Conversión automática al escribir espacios
- Preservación del estado del cursor

**`display.ts`** - Renderizado con cursor:

- Integración del cursor visual en el contenido
- Procesamiento de markdown inline
- Actualización eficiente del DOM

**`Writer.ts`** - Coordinador principal:

- Manejo de eventos de teclado
- Coordinación entre todos los módulos
- API pública del editor

## 🛠️ Cómo Usar

- `content`: Array de strings y otros bloques anidados
- `attrs`: Atributos específicos del bloque (nivel de encabezado, URL, etc.)
- `parent`: Referencia al bloque padre (opcional)

## Desarrollo

Para ejecutar el proyecto:

```bash
npm install
npm run dev
```

El proyecto usa Vite con TypeScript y está diseñado para ser extensible con nuevos tipos de bloques.
