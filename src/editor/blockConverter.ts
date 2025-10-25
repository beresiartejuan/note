import type { Block, BlockType, CursorPosition } from '../types.js';

/**
 * Manejador de conversiones de markdown
 * Se encarga de convertir bloques cuando se detecta sintaxis markdown
 */

/**
 * Convierte el bloque actual al tipo especificado
 * Mantiene el contenido pero cambia la estructura y atributos
 * 
 * @param blocks - Array de bloques del documento
 * @param position - Posición actual del cursor
 * @param newType - Nuevo tipo de bloque
 * @param newContent - Nuevo contenido del bloque
 * @param newAttrs - Nuevos atributos del bloque
 * @returns Nuevo estado con bloques modificados y posición actualizada
 */
export function convertBlockTo(
    blocks: Block[],
    position: CursorPosition,
    newType: BlockType,
    newContent: (string | Block)[] = [''],
    newAttrs: { [key: string]: string } = {}
): { blocks: Block[], newPosition: CursorPosition } {
    const newBlocks = [...blocks];
    const [blockIndex] = position;
    const currentBlock = newBlocks[blockIndex];

    if (!currentBlock) {
        return { blocks: newBlocks, newPosition: position };
    }

    // Actualizar el bloque existente con el nuevo tipo y atributos
    currentBlock.type = newType;
    currentBlock.content = newContent;
    currentBlock.attrs = { ...currentBlock.attrs, ...newAttrs };

    // Calcular nueva posición del cursor
    // Posicionarlo al final del nuevo contenido
    const firstContent = newContent[0];
    const newCharIndex = typeof firstContent === 'string' ? firstContent.length : 0;
    const newPosition: CursorPosition = [blockIndex, 0, newCharIndex];

    return { blocks: newBlocks, newPosition };
}

/**
 * Verifica si el texto contiene sintaxis markdown y realiza la conversión automática
 * Se ejecuta después de escribir un espacio en un párrafo
 * 
 * @param blocks - Array de bloques del documento
 * @param position - Posición actual del cursor
 * @param text - Texto a verificar
 * @returns Nuevo estado si se realizó conversión, o estado original si no
 */
export function tryAutoConvertMarkdown(
    blocks: Block[],
    position: CursorPosition,
    text: string
): { blocks: Block[], newPosition: CursorPosition, converted: boolean } {
    const [blockIndex] = position;
    const currentBlock = blocks[blockIndex];

    // Solo convertir si estamos en un párrafo
    if (!currentBlock || currentBlock.type !== 'paragraph') {
        return { blocks, newPosition: position, converted: false };
    }

    // Detectar encabezados: # Título, ## Subtítulo, etc.
    const headingMatch = text.match(/^(#{1,6})\s(.*)$/);
    if (headingMatch) {
        const level = headingMatch[1].length;
        const content = headingMatch[2];
        const result = convertBlockTo(blocks, position, 'heading', [content], { level: level.toString() });
        return { ...result, converted: true };
    }

    // Detectar lista no ordenada: - elemento, * elemento, + elemento
    const unorderedListMatch = text.match(/^[-*+]\s(.*)$/);
    if (unorderedListMatch) {
        const content = unorderedListMatch[1];
        const result = convertBlockTo(blocks, position, 'list-item', [content], { listType: 'unordered' });
        return { ...result, converted: true };
    }

    // Detectar lista ordenada: 1. elemento, 2. elemento, etc.
    const orderedListMatch = text.match(/^\d+\.\s(.*)$/);
    if (orderedListMatch) {
        const content = orderedListMatch[1];
        const result = convertBlockTo(blocks, position, 'list-item', [content], { listType: 'ordered' });
        return { ...result, converted: true };
    }

    // Detectar cita: > texto citado
    const quoteMatch = text.match(/^>\s(.*)$/);
    if (quoteMatch) {
        const content = quoteMatch[1];
        const result = convertBlockTo(blocks, position, 'quote', [content]);
        return { ...result, converted: true };
    }

    // Detectar bloque de código: ```lenguaje
    const codeBlockMatch = text.match(/^```(.*)$/);
    if (codeBlockMatch) {
        const language = codeBlockMatch[1].trim();
        const result = convertBlockTo(blocks, position, 'code-block', [''], { language });
        return { ...result, converted: true };
    }

    return { blocks, newPosition: position, converted: false };
}
