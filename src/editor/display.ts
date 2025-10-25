import type { Block, CursorPosition } from '../types.js';
import { renderBlocks } from '../renderer/htmlRenderer.js';
import { processInlineMarkdown } from '../markdown/parser.js';

/**
 * Manejador de visualización del editor
 * Se encarga de renderizar los bloques con el cursor visible
 */

/**
 * Renderiza todos los bloques del documento con el cursor en la posición correcta
 * Procesa markdown inline para bloques que lo soportan
 * 
 * @param blocks - Array de bloques del documento
 * @param cursorPosition - Posición actual del cursor
 * @returns HTML string completo con cursor incluido
 */
export function renderWithCursor(blocks: Block[], cursorPosition: CursorPosition): string {
    const [blockIndex, contentIndex, charIndex] = cursorPosition;

    // Crear una copia de los bloques para procesar sin modificar el original
    const processedBlocks = blocks.map((block, bIndex) => {
        // Determinar si este bloque debe procesar markdown inline
        const shouldProcessInline = ['paragraph', 'heading', 'list-item', 'quote'].includes(block.type);

        // Los line-breaks necesitan manejo especial para mostrar el cursor
        if (block.type === 'line-break') {
            // Si el cursor está en este bloque, mostrar cursor en el line-break
            if (bIndex === blockIndex) {
                return { ...block, content: ['<span class="cursor">|</span>'] };
            }
            return block;
        }

        if (shouldProcessInline) {
            // Procesar contenido con markdown inline y cursor
            const processedContent = block.content.map((item, cIndex) => {
                if (typeof item === 'string') {
                    // Si este es el bloque y contenido donde está el cursor
                    if (bIndex === blockIndex && cIndex === contentIndex) {
                        // Insertar cursor visual en la posición correcta
                        const beforeCursor = item.slice(0, charIndex);
                        const afterCursor = item.slice(charIndex);
                        const textWithCursor = beforeCursor + '<span class="cursor">|</span>' + afterCursor;

                        // Procesar markdown inline en el texto con cursor
                        // Nota: Esto es complejo porque el cursor puede estar en medio de markdown
                        // Por simplicidad, no procesamos markdown inline cuando hay cursor
                        return textWithCursor;
                    } else {
                        // Procesar markdown inline normalmente
                        const processed = processInlineMarkdown(item);
                        return processed.map(p =>
                            typeof p === 'string' ? p : renderBlocks([p])
                        ).join('');
                    }
                }
                return item; // Si es un bloque, mantenerlo como está
            });

            return { ...block, content: processedContent };
        } else {
            // Para bloques que no procesan markdown inline (como code-block)
            const processedContent = block.content.map((item, cIndex) => {
                if (typeof item === 'string' && bIndex === blockIndex && cIndex === contentIndex) {
                    // Insertar cursor sin procesar markdown
                    const beforeCursor = item.slice(0, charIndex);
                    const afterCursor = item.slice(charIndex);
                    return beforeCursor + '<span class="cursor">|</span>' + afterCursor;
                }
                return item;
            });

            return { ...block, content: processedContent };
        }
    });

    // Renderizar todos los bloques procesados
    return renderBlocks(processedBlocks);
}

/**
 * Actualiza el contenido HTML del contenedor con el estado actual del editor
 * 
 * @param container - Elemento HTML donde mostrar el contenido
 * @param blocks - Array de bloques del documento
 * @param cursorPosition - Posición actual del cursor
 */
export function updateDisplay(
    container: HTMLElement,
    blocks: Block[],
    cursorPosition: CursorPosition
): void {
    const html = renderWithCursor(blocks, cursorPosition);
    container.innerHTML = html;
}
