/**
 * Archivo de índice principal
 * Facilita las importaciones de los módulos principales del editor
 */

// Tipos principales
export type { Block, BlockType, CursorPosition } from './types.js';

// Utilidades
export * from './utils/blockUtils.js';

// Parser de markdown
export * from './markdown/parser.js';

// Renderizador
export * from './renderer/htmlRenderer.js';

// Módulos del editor
export * from './editor/cursor.js';
export * from './editor/textOperations.js';
export * from './editor/blockConverter.js';
export * from './editor/display.js';
export { Writer } from './editor/Writer.js';

/**
 * Configuración por defecto del editor
 */
export const DEFAULT_CONFIG = {
    // Configuraciones que podrían añadirse en el futuro
    autoSave: true,
    autoConvertMarkdown: true,
    showLineNumbers: false,
    theme: 'dark'
} as const;
