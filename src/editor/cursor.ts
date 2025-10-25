import type { Block, CursorPosition } from '../types.js';

/**
 * Manejador de posición del cursor en el editor
 * Gestiona la navegación y posicionamiento del cursor dentro de la estructura de bloques
 */

/**
 * Navega el cursor hacia la izquierda
 * Maneja la transición entre bloques cuando se llega al inicio de uno
 * 
 * @param blocks - Array de bloques del documento
 * @param currentPosition - Posición actual del cursor
 * @returns Nueva posición del cursor
 */
export function moveCursorLeft(blocks: Block[], currentPosition: CursorPosition): CursorPosition {
    const [blockIndex, contentIndex, charIndex] = currentPosition;

    // Si podemos movernos dentro del contenido actual
    if (charIndex > 0) {
        return [blockIndex, contentIndex, charIndex - 1];
    }

    // Si estamos al inicio del contenido, intentar ir al bloque anterior
    if (blockIndex > 0) {
        const prevBlock = blocks[blockIndex - 1];
        const lastContentIndex = prevBlock.content.length - 1;
        const lastContent = prevBlock.content[lastContentIndex];
        const lastCharIndex = typeof lastContent === 'string' ? lastContent.length : 0;

        return [blockIndex - 1, lastContentIndex, lastCharIndex];
    }

    // Si ya estamos al inicio del documento, no cambiar posición
    return currentPosition;
}

/**
 * Navega el cursor hacia la derecha
 * Maneja la transición entre bloques cuando se llega al final de uno
 */
export function moveCursorRight(blocks: Block[], currentPosition: CursorPosition): CursorPosition {
    const [blockIndex, contentIndex, charIndex] = currentPosition;
    const currentBlock = blocks[blockIndex];

    if (!currentBlock) return currentPosition;

    const currentContent = currentBlock.content[contentIndex];
    const currentContentLength = typeof currentContent === 'string' ? currentContent.length : 0;

    // Si podemos movernos dentro del contenido actual
    if (charIndex < currentContentLength) {
        return [blockIndex, contentIndex, charIndex + 1];
    }

    // Si estamos al final del contenido, intentar ir al siguiente bloque
    if (blockIndex < blocks.length - 1) {
        return [blockIndex + 1, 0, 0];
    }

    // Si ya estamos al final del documento, no cambiar posición
    return currentPosition;
}

/**
 * Navega el cursor hacia arriba
 * Intenta mantener la posición horizontal relativa cuando cambia de bloque
 */
export function moveCursorUp(blocks: Block[], currentPosition: CursorPosition): CursorPosition {
    const [blockIndex, , charIndex] = currentPosition;

    if (blockIndex > 0) {
        const prevBlock = blocks[blockIndex - 1];
        const lastContentIndex = prevBlock.content.length - 1;
        const lastContent = prevBlock.content[lastContentIndex];
        const maxCharIndex = typeof lastContent === 'string' ? lastContent.length : 0;

        // Intentar mantener la posición horizontal, pero limitar al contenido disponible
        return [blockIndex - 1, lastContentIndex, Math.min(charIndex, maxCharIndex)];
    }

    return currentPosition;
}

/**
 * Navega el cursor hacia abajo
 * Intenta mantener la posición horizontal relativa cuando cambia de bloque
 */
export function moveCursorDown(blocks: Block[], currentPosition: CursorPosition): CursorPosition {
    const [blockIndex, , charIndex] = currentPosition;

    if (blockIndex < blocks.length - 1) {
        const nextBlock = blocks[blockIndex + 1];
        const firstContent = nextBlock.content[0];
        const maxCharIndex = typeof firstContent === 'string' ? firstContent.length : 0;

        // Intentar mantener la posición horizontal, pero limitar al contenido disponible
        return [blockIndex + 1, 0, Math.min(charIndex, maxCharIndex)];
    }

    return currentPosition;
}

/**
 * Obtiene el bloque actual basado en la posición del cursor
 */
export function getCurrentBlock(blocks: Block[], position: CursorPosition): Block | null {
    const [blockIndex] = position;
    return blocks[blockIndex] || null;
}

/**
 * Obtiene el contenido actual como string basado en la posición del cursor
 */
export function getCurrentContent(blocks: Block[], position: CursorPosition): string {
    const [blockIndex, contentIndex] = position;
    const block = blocks[blockIndex];

    if (!block) return '';

    const content = block.content[contentIndex];
    return typeof content === 'string' ? content : '';
}
