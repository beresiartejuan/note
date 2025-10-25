# Manejo Avanzado de Saltos de Línea

## 🔧 Refactorización Implementada

El editor ahora maneja los saltos de línea de manera más intuitiva y visualmente coherente.

### ✨ Nuevas Características

1. **Tipo de Bloque `line-break`**:

   - Representa párrafos vacíos que se muestran como espacios verticales
   - Se renderizan como `<p class="line-break">&nbsp;</p>`

2. **Comportamiento Mejorado de Enter**:

   - En párrafo vacío: Se convierte a `line-break` y crea nuevo párrafo
   - En párrafo con contenido: Divide el contenido normalmente
   - En `line-break`: Crea nuevo párrafo después

3. **Backspace Inteligente**:

   - Elimina `line-breaks` directamente
   - Une bloques de texto correctamente
   - Maneja la navegación entre diferentes tipos de bloques

4. **Limpieza Automática**:
   - Máximo 2 `line-breaks` consecutivos
   - Previene acumulación excesiva de espacios

### 🎨 Estilos CSS Añadidos

```css
/* Saltos de línea visibles */
p.line-break {
  min-height: 1.5em;
  margin: 0.25em 0;
  line-height: 1.5;
}

/* Párrafos vacíos con altura mínima */
p:empty {
  min-height: 1.5em;
}

/* Todos los párrafos mantienen altura */
p {
  min-height: 1.5em;
}
```

### 🚀 Funciones Nuevas

#### `utils/blockUtils.ts`

- `createLineBreak()`: Crea bloques de salto de línea
- `isEmptyBlock()`: Verifica si un bloque está vacío
- `isLineBreak()`: Verifica si es un salto de línea
- `cleanConsecutiveLineBreaks()`: Limpia saltos consecutivos

#### `textOperations.ts`

- Manejo inteligente de Enter para crear `line-breaks`
- Backspace mejorado para eliminar `line-breaks`
- Detección de párrafos vacíos

#### `display.ts`

- Renderizado especial para `line-breaks` con cursor
- Procesamiento visual mejorado

### 📝 Cómo Usar

1. **Salto de línea simple**: Presiona Enter una vez
2. **Salto de línea doble**: Presiona Enter dos veces (crea espacio visual)
3. **Eliminar saltos**: Usa Backspace para eliminar líneas vacías
4. **Navegación**: Las flechas navegan correctamente entre todos los tipos de bloques

### 🔍 Debugging

Los bloques `line-break` aparecen en la estructura como:

```javascript
{
    id: "abc123",
    type: "line-break",
    content: [""],
    attrs: {}
}
```

### ⚡ Beneficios

- ✅ Saltos de línea visibles y consistentes
- ✅ Comportamiento intuitivo similar a editores tradicionales
- ✅ No hay acumulación invisible de bloques vacíos
- ✅ Navegación fluida con el cursor
- ✅ Renderizado HTML limpio y semántico

La implementación mantiene la filosofía de bloques del editor mientras proporciona una experiencia de usuario más familiar para el manejo de espacios y saltos de línea.
