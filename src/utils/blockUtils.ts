import type { Block, BlockType } from '../types.js';

/**
 * Utilidades para crear y manipular bloques
 */

/**
 * Genera un ID único para un bloque
 * Usa Math.random() para crear un identificador alfanumérico corto
 */
export function generateBlockId(): string {
    return Math.random().toString(36).substring(2, 9);
}

/**
 * Crea un nuevo bloque con los parámetros especificados
 * @param type - Tipo de bloque a crear
 * @param content - Contenido inicial del bloque (por defecto string vacío)
 * @param attrs - Atributos específicos del bloque
 * @returns Nuevo bloque creado
 */
export function createBlock(
    type: BlockType,
    content: (string | Block)[] = [''],
    attrs: { [key: string]: string } = {}
): Block {
    return {
        id: generateBlockId(),
        type,
        content,
        attrs
    };
}

/**
 * Crea un bloque de párrafo vacío
 * Útil para inicializar el editor o crear nuevos párrafos
 */
export function createEmptyParagraph(): Block {
    return createBlock('paragraph', [''], {});
}

/**
 * Crea un bloque de salto de línea
 * Representa un párrafo vacío que se muestra como espacio vertical
 */
export function createLineBreak(): Block {
    return createBlock('line-break', [''], {});
}

/**
 * Verifica si un bloque está vacío (sin contenido de texto)
 * @param block - Bloque a verificar
 * @returns true si el bloque está vacío
 */
export function isEmptyBlock(block: Block): boolean {
    if (block.content.length === 0) return true;

    // Si solo tiene un elemento y es un string vacío
    if (block.content.length === 1) {
        const content = block.content[0];
        return typeof content === 'string' && content.trim() === '';
    }

    return false;
}

/**
 * Verifica si un bloque es un salto de línea
 */
export function isLineBreak(block: Block): boolean {
    return block.type === 'line-break';
}

/**
 * Limpia bloques consecutivos vacíos, manteniendo máximo uno
 * Útil para evitar acumulación excesiva de saltos de línea
 * @param blocks - Array de bloques a limpiar
 * @returns Array de bloques limpiado
 */
export function cleanConsecutiveLineBreaks(blocks: Block[]): Block[] {
    const cleaned: Block[] = [];
    let consecutiveLineBreaks = 0;

    for (const block of blocks) {
        if (block.type === 'line-break') {
            consecutiveLineBreaks++;
            // Permitir máximo 2 line-breaks consecutivos
            if (consecutiveLineBreaks <= 2) {
                cleaned.push(block);
            }
        } else {
            consecutiveLineBreaks = 0;
            cleaned.push(block);
        }
    }

    return cleaned;
}
