import type { Block, CursorPosition } from '../types.js';
import { createEmptyParagraph, isEmptyBlock } from '../utils/blockUtils.js';

/**
 * Operaciones de edición de texto en el editor
 * Maneja inserción, eliminación y modificación de contenido
 */

/**
 * Inserta un carácter en la posición actual del cursor
 * 
 * @param blocks - Array de bloques del documento
 * @param position - Posición actual del cursor
 * @param char - Carácter a insertar
 * @returns Nuevo estado con bloques modificados y nueva posición del cursor
 */
export function insertCharacter(
    blocks: Block[],
    position: CursorPosition,
    char: string
): { blocks: Block[], newPosition: CursorPosition } {
    const newBlocks = [...blocks];
    const [blockIndex, contentIndex, charIndex] = position;
    const currentBlock = newBlocks[blockIndex];

    if (!currentBlock) {
        return { blocks: newBlocks, newPosition: position };
    }

    const currentContent = currentBlock.content[contentIndex];
    if (typeof currentContent === 'string') {
        // Insertar el carácter en la posición correcta del string
        const newContent = currentContent.slice(0, charIndex) + char + currentContent.slice(charIndex);
        currentBlock.content[contentIndex] = newContent;

        // Mover el cursor una posición hacia adelante
        const newPosition: CursorPosition = [blockIndex, contentIndex, charIndex + 1];
        return { blocks: newBlocks, newPosition };
    }

    return { blocks: newBlocks, newPosition: position };
}

/**
 * Elimina el carácter anterior al cursor (Backspace)
 * Maneja la unión de bloques y eliminación de saltos de línea
 */
export function deleteCharacterBackward(
    blocks: Block[],
    position: CursorPosition
): { blocks: Block[], newPosition: CursorPosition } {
    const newBlocks = [...blocks];
    const [blockIndex, contentIndex, charIndex] = position;

    // Si podemos eliminar dentro del contenido actual
    if (charIndex > 0) {
        const currentBlock = newBlocks[blockIndex];
        const currentContent = currentBlock.content[contentIndex];

        if (typeof currentContent === 'string') {
            // Eliminar el carácter anterior
            const newContent = currentContent.slice(0, charIndex - 1) + currentContent.slice(charIndex);
            currentBlock.content[contentIndex] = newContent;

            const newPosition: CursorPosition = [blockIndex, contentIndex, charIndex - 1];
            return { blocks: newBlocks, newPosition };
        }
    }

    // Si estamos al inicio de un bloque y hay bloques anteriores
    if (blockIndex > 0) {
        const currentBlock = newBlocks[blockIndex];
        const prevBlock = newBlocks[blockIndex - 1];

        // Verificar que ambos bloques existan
        if (!currentBlock || !prevBlock) {
            return { blocks: newBlocks, newPosition: position };
        }

        // Si el bloque anterior es un line-break, eliminarlo y mover cursor al bloque anterior
        if (prevBlock.type === 'line-break') {
            newBlocks.splice(blockIndex - 1, 1);
            const newPosition: CursorPosition = [blockIndex - 1, 0, 0];
            return { blocks: newBlocks, newPosition };
        }

        // Si el bloque actual es un line-break vacío, eliminarlo y mover al anterior
        if (currentBlock.type === 'line-break' || isEmptyBlock(currentBlock)) {
            newBlocks.splice(blockIndex, 1);

            // Verificar que el bloque anterior aún exista después del splice
            const actualPrevBlock = newBlocks[blockIndex - 1];
            if (!actualPrevBlock) {
                return { blocks: newBlocks, newPosition: [0, 0, 0] };
            }

            // Mover cursor al final del bloque anterior
            const prevContentIndex = actualPrevBlock.content.length - 1;
            const prevContent = actualPrevBlock.content[prevContentIndex];
            const prevLength = typeof prevContent === 'string' ? prevContent.length : 0;

            const newPosition: CursorPosition = [blockIndex - 1, prevContentIndex, prevLength];
            return { blocks: newBlocks, newPosition };
        }

        // Comportamiento normal: unir contenido con bloque anterior
        const currentContent = currentBlock.content[contentIndex];
        if (typeof currentContent === 'string') {
            const prevContentIndex = prevBlock.content.length - 1;
            const prevContent = prevBlock.content[prevContentIndex];

            if (typeof prevContent === 'string') {
                // Unir el contenido del bloque actual con el anterior
                const newContent = prevContent + currentContent;
                prevBlock.content[prevContentIndex] = newContent;

                // Eliminar el bloque actual
                newBlocks.splice(blockIndex, 1);

                // Nueva posición al final del contenido del bloque anterior
                const newPosition: CursorPosition = [blockIndex - 1, prevContentIndex, prevContent.length];
                return { blocks: newBlocks, newPosition };
            }
        }
    } return { blocks: newBlocks, newPosition: position };
}

/**
 * Elimina el carácter siguiente al cursor (Delete)
 */
export function deleteCharacterForward(
    blocks: Block[],
    position: CursorPosition
): { blocks: Block[], newPosition: CursorPosition } {
    const newBlocks = [...blocks];
    const [blockIndex, contentIndex, charIndex] = position;
    const currentBlock = newBlocks[blockIndex];

    if (!currentBlock) {
        return { blocks: newBlocks, newPosition: position };
    }

    const currentContent = currentBlock.content[contentIndex];
    if (typeof currentContent === 'string' && charIndex < currentContent.length) {
        // Eliminar el carácter en la posición actual del cursor
        const newContent = currentContent.slice(0, charIndex) + currentContent.slice(charIndex + 1);
        currentBlock.content[contentIndex] = newContent;
    }

    return { blocks: newBlocks, newPosition: position };
}

/**
 * Crea un nuevo bloque al presionar Enter
 * Maneja saltos de línea múltiples y diferentes tipos de bloques
 */
export function createNewBlock(
    blocks: Block[],
    position: CursorPosition
): { blocks: Block[], newPosition: CursorPosition } {
    const newBlocks = [...blocks];
    const [blockIndex, contentIndex, charIndex] = position;
    const currentBlock = newBlocks[blockIndex];

    if (!currentBlock) {
        return { blocks: newBlocks, newPosition: position };
    }

    // Para bloques de código, Enter simplemente añade nueva línea
    if (currentBlock.type === 'code-block') {
        const currentContent = currentBlock.content[contentIndex];
        if (typeof currentContent === 'string') {
            const newContent = currentContent.slice(0, charIndex) + '\n' + currentContent.slice(charIndex);
            currentBlock.content[contentIndex] = newContent;

            const newPosition: CursorPosition = [blockIndex, contentIndex, charIndex + 1];
            return { blocks: newBlocks, newPosition };
        }
    }

    // Para otros tipos de bloque, crear un nuevo párrafo
    const currentContent = currentBlock.content[contentIndex];
    if (typeof currentContent === 'string') {
        const beforeCursor = currentContent.slice(0, charIndex);
        const afterCursor = currentContent.slice(charIndex);

        // Si el bloque está completamente vacío, crear un line-break
        if (isEmptyBlock(currentBlock) && beforeCursor === '' && afterCursor === '') {
            currentBlock.type = 'line-break';
            currentBlock.content = [''];
        } else {
            // Dividir contenido: antes del cursor se queda, después va al nuevo bloque
            currentBlock.content[contentIndex] = beforeCursor;
        }

        // Crear nuevo párrafo con el contenido restante
        const newBlock = createEmptyParagraph();
        newBlock.content = [afterCursor];

        // Insertar el nuevo bloque después del actual
        newBlocks.splice(blockIndex + 1, 0, newBlock);

        // Posicionar el cursor al inicio del nuevo bloque
        const newPosition: CursorPosition = [blockIndex + 1, 0, 0];
        return { blocks: newBlocks, newPosition };
    } return { blocks: newBlocks, newPosition: position };
}

/**
 * Modifica el contenido de un bloque específico
 * Utilidad para actualizar el contenido de manera segura
 */
export function setBlockContent(
    blocks: Block[],
    position: CursorPosition,
    newContent: string
): Block[] {
    const newBlocks = [...blocks];
    const [blockIndex, contentIndex] = position;
    const currentBlock = newBlocks[blockIndex];

    if (currentBlock) {
        currentBlock.content[contentIndex] = newContent;
    }

    return newBlocks;
}
