/**
 * Tipos y interfaces principales del editor de markdown
 */

/**
 * Representa un bloque de contenido en el editor.
 * Los bloques pueden ser anidados, permitiendo estructuras complejas como:
 * - Un párrafo que contiene texto normal y texto en negrita
 * - Una lista que contiene elementos con enlaces e imágenes
 */
export interface Block {
    /** Identificador único del bloque */
    id: string;

    /** Tipo de bloque que determina cómo se renderiza */
    type: string;

    /** 
     * Contenido del bloque: puede ser strings de texto o bloques anidados
     * Ejemplo: ['Texto normal ', { type: 'bold', content: ['texto en negrita'] }, ' más texto']
     */
    content: (string | Block)[];

    /** Atributos específicos del bloque (ej: nivel de encabezado, URL de enlace) */
    attrs: { [key: string]: string };

    /** Referencia al bloque padre (opcional) */
    parent?: Block;
}

/**
 * Tipos de bloques soportados por el editor
 */
export type BlockType =
    | 'paragraph'     // Párrafo normal
    | 'heading'       // Encabezados H1-H6
    | 'bold'          // Texto en negrita
    | 'italic'        // Texto en cursiva
    | 'code'          // Código inline
    | 'code-block'    // Bloque de código
    | 'link'          // Enlaces
    | 'image'         // Imágenes
    | 'list-item'     // Elemento de lista
    | 'ordered-list'  // Lista ordenada
    | 'unordered-list'// Lista no ordenada
    | 'quote'         // Cita/blockquote
    | 'line-break'    // Salto de línea/párrafo vacío
    | 'text';         // Texto plano

/**
 * Posición del cursor en el editor
 * [índice del bloque, índice del contenido dentro del bloque, índice del carácter]
 */
export type CursorPosition = [number, number, number];
