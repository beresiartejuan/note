import type { Block, BlockType } from '../types.js';
import { createBlock } from '../utils/blockUtils.js';

/**
 * Procesador de sintaxis markdown
 * Se encarga de detectar y convertir patrones de markdown en bloques
 */

/**
 * Detecta si el texto contiene sintaxis markdown de nivel de bloque
 * y convierte el texto en el tipo de bloque correspondiente
 * 
 * @param text - Texto a analizar
 * @returns Objeto con información del bloque detectado o null si no hay coincidencia
 */
export function detectBlockMarkdown(text: string): {
    type: BlockType;
    content: string;
    attrs: { [key: string]: string };
} | null {

    // Detectar encabezados: # Título, ## Subtítulo, etc.
    // Los encabezados pueden tener de 1 a 6 # seguidos de un espacio
    const headingMatch = text.match(/^(#{1,6})\s(.*)$/);
    if (headingMatch) {
        const level = headingMatch[1].length;
        const content = headingMatch[2];
        return {
            type: 'heading',
            content,
            attrs: { level: level.toString() }
        };
    }

    // Detectar lista no ordenada: - elemento, * elemento, + elemento
    const unorderedListMatch = text.match(/^[-*+]\s(.*)$/);
    if (unorderedListMatch) {
        return {
            type: 'list-item',
            content: unorderedListMatch[1],
            attrs: { listType: 'unordered' }
        };
    }

    // Detectar lista ordenada: 1. elemento, 2. elemento, etc.
    const orderedListMatch = text.match(/^\d+\.\s(.*)$/);
    if (orderedListMatch) {
        return {
            type: 'list-item',
            content: orderedListMatch[1],
            attrs: { listType: 'ordered' }
        };
    }

    // Detectar cita: > texto citado
    const quoteMatch = text.match(/^>\s(.*)$/);
    if (quoteMatch) {
        return {
            type: 'quote',
            content: quoteMatch[1],
            attrs: {}
        };
    }

    // Detectar bloque de código: ```lenguaje
    const codeBlockMatch = text.match(/^```(.*)$/);
    if (codeBlockMatch) {
        return {
            type: 'code-block',
            content: '',
            attrs: { language: codeBlockMatch[1].trim() }
        };
    }

    return null;
}

/**
 * Procesa texto para detectar y convertir markdown inline en bloques anidados
 * Maneja: **negrita**, *cursiva*, `código`, [enlaces](url)
 * 
 * @param text - Texto a procesar
 * @returns Array de strings y bloques que representan el texto procesado
 */
export function processInlineMarkdown(text: string): (string | Block)[] {
    const result: (string | Block)[] = [];
    let currentText = '';
    let i = 0;

    while (i < text.length) {
        const char = text[i];
        const nextChar = text[i + 1];

        // Procesar negrita: **texto**
        // Necesitamos dos asteriscos seguidos
        if (char === '*' && nextChar === '*') {
            // Guardar texto acumulado antes del markdown
            if (currentText) {
                result.push(currentText);
                currentText = '';
            }

            // Buscar el cierre del markdown en negrita
            const endIndex = text.indexOf('**', i + 2);
            if (endIndex !== -1) {
                const boldText = text.substring(i + 2, endIndex);
                result.push(createBlock('bold', [boldText]));
                i = endIndex + 2;
                continue;
            }
        }

        // Procesar cursiva: *texto* (pero no confundir con negrita)
        if (char === '*' && nextChar !== '*') {
            if (currentText) {
                result.push(currentText);
                currentText = '';
            }

            const endIndex = text.indexOf('*', i + 1);
            if (endIndex !== -1) {
                const italicText = text.substring(i + 1, endIndex);
                result.push(createBlock('italic', [italicText]));
                i = endIndex + 1;
                continue;
            }
        }

        // Procesar código inline: `código`
        if (char === '`') {
            if (currentText) {
                result.push(currentText);
                currentText = '';
            }

            const endIndex = text.indexOf('`', i + 1);
            if (endIndex !== -1) {
                const codeText = text.substring(i + 1, endIndex);
                result.push(createBlock('code', [codeText]));
                i = endIndex + 1;
                continue;
            }
        }

        // Procesar imágenes: ![alt text](url){WIDTHxHEIGHT}
        // Las imágenes son como enlaces pero empiezan con ! y pueden tener dimensiones opcionales
        if (char === '!' && nextChar === '[') {
            const closeBracket = text.indexOf(']', i + 2);
            const openParen = text.indexOf('(', closeBracket);
            const closeParen = text.indexOf(')', openParen);

            // Verificar que la secuencia esté completa y sea válida
            if (closeBracket !== -1 &&
                openParen === closeBracket + 1 &&
                closeParen !== -1) {

                if (currentText) {
                    result.push(currentText);
                    currentText = '';
                }

                const altText = text.substring(i + 2, closeBracket);
                const imageUrl = text.substring(openParen + 1, closeParen);

                let nextIndex = closeParen + 1;
                let width = '';
                let height = '';

                // Buscar dimensiones opcionales {WIDTHxHEIGHT}
                if (text[closeParen + 1] === '{') {
                    const closeBrace = text.indexOf('}', closeParen + 2);
                    if (closeBrace !== -1) {
                        const dimensionsText = text.substring(closeParen + 2, closeBrace);
                        const dimensionsMatch = dimensionsText.match(/^(\d+)x(\d+)$/);

                        if (dimensionsMatch) {
                            width = dimensionsMatch[1];
                            height = dimensionsMatch[2];
                            nextIndex = closeBrace + 1;
                        }
                    }
                }

                const attrs: { [key: string]: string } = {
                    src: imageUrl,
                    alt: altText
                };

                if (width && height) {
                    attrs.width = width;
                    attrs.height = height;
                }

                result.push(createBlock('image', [altText], attrs));
                i = nextIndex;
                continue;
            }
        }

        // Procesar enlaces: [texto](url)
        // Necesitamos encontrar la secuencia completa [texto](url)
        if (char === '[') {
            const closeBracket = text.indexOf(']', i);
            const openParen = text.indexOf('(', closeBracket);
            const closeParen = text.indexOf(')', openParen);

            // Verificar que la secuencia esté completa y sea válida
            if (closeBracket !== -1 &&
                openParen === closeBracket + 1 &&
                closeParen !== -1) {

                if (currentText) {
                    result.push(currentText);
                    currentText = '';
                }

                const linkText = text.substring(i + 1, closeBracket);
                const linkUrl = text.substring(openParen + 1, closeParen);
                result.push(createBlock('link', [linkText], { href: linkUrl }));
                i = closeParen + 1;
                continue;
            }
        }

        // Si no se encontró ningún patrón markdown, acumular el carácter
        currentText += char;
        i++;
    }

    // Añadir texto restante si lo hay
    if (currentText) {
        result.push(currentText);
    }

    // Asegurar que siempre devolvemos al menos un elemento
    return result.length > 0 ? result : [''];
}
