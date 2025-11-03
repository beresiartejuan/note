/**
 * Utilidades para convertir entre la estructura de bloques del editor
 * y texto markdown plano
 */

import type { Block } from '../types.js';

/**
 * Convierte una estructura de bloques a texto markdown
 */
export function blocksToMarkdown(blocks: Block[]): string {
    return blocks.map(block => blockToMarkdown(block)).join('\n');
}

/**
 * Convierte un bloque individual a markdown
 */
function blockToMarkdown(block: Block): string {
    const content = contentToMarkdown(block.content);

    switch (block.type) {
        case 'paragraph':
            return content || '';

        case 'heading':
            const level = parseInt(block.attrs.level || '1');
            const hashes = '#'.repeat(Math.max(1, Math.min(6, level)));
            return `${hashes} ${content}`;

        case 'bold':
            return `**${content}**`;

        case 'italic':
            return `*${content}*`;

        case 'code':
            return `\`${content}\``;

        case 'code-block':
            const language = block.attrs.language || '';
            return `\`\`\`${language}\n${content}\n\`\`\``;

        case 'link':
            const href = block.attrs.href || '';
            return `[${content}](${href})`;

        case 'image':
            const src = block.attrs.src || '';
            const alt = block.attrs.alt || content;
            return `![${alt}](${src})`;

        case 'list-item':
            return `- ${content}`;

        case 'quote':
            return `> ${content}`;

        case 'line-break':
            return '';

        default:
            return content;
    }
}

/**
 * Convierte el contenido de un bloque (que puede ser mixto) a markdown
 */
function contentToMarkdown(content: (string | Block)[]): string {
    return content.map(item => {
        if (typeof item === 'string') {
            return item;
        } else {
            return blockToMarkdown(item);
        }
    }).join('');
}

/**
 * Convierte texto markdown a estructura de bloques
 * Esta es una implementación simplificada que maneja los casos más comunes
 */
export function markdownToBlocks(markdown: string): Block[] {
    const lines = markdown.split('\n');
    const blocks: Block[] = [];
    let currentBlockId = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const block = parseMarkdownLine(line, currentBlockId++);
        blocks.push(block);
    }

    // Filtrar bloques vacíos consecutivos, manteniendo solo uno
    return consolidateEmptyBlocks(blocks);
}

/**
 * Parsea una línea individual de markdown
 */
function parseMarkdownLine(line: string, id: number): Block {
    const trimmed = line.trim();

    // Línea vacía
    if (!trimmed) {
        return {
            id: `block-${id}`,
            type: 'line-break',
            content: [''],
            attrs: {}
        };
    }

    // Encabezados
    const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
        return {
            id: `block-${id}`,
            type: 'heading',
            content: [parseInlineMarkdown(headerMatch[2])],
            attrs: { level: headerMatch[1].length.toString() }
        };
    }

    // Bloques de código
    if (trimmed.startsWith('```')) {
        const language = trimmed.slice(3).trim();
        return {
            id: `block-${id}`,
            type: 'code-block',
            content: [''], // El contenido se manejaría en un parser más complejo
            attrs: { language }
        };
    }

    // Lista
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return {
            id: `block-${id}`,
            type: 'list-item',
            content: [parseInlineMarkdown(trimmed.slice(2))],
            attrs: {}
        };
    }

    // Cita
    if (trimmed.startsWith('> ')) {
        return {
            id: `block-${id}`,
            type: 'quote',
            content: [parseInlineMarkdown(trimmed.slice(2))],
            attrs: {}
        };
    }

    // Párrafo normal
    return {
        id: `block-${id}`,
        type: 'paragraph',
        content: [parseInlineMarkdown(trimmed)],
        attrs: {}
    };
}

/**
 * Parsea markdown inline básico (negrita, cursiva, código, enlaces)
 * Esta es una implementación simplificada
 */
function parseInlineMarkdown(text: string): string {
    // Por simplicidad, por ahora solo devolvemos el texto tal como está
    // En una implementación completa, esto parsearía **bold**, *italic*, `code`, [links](url), etc.
    // y devolvería una estructura de bloques anidados
    return text;
}

/**
 * Consolida bloques vacíos consecutivos en uno solo
 */
function consolidateEmptyBlocks(blocks: Block[]): Block[] {
    const result: Block[] = [];
    let lastWasEmpty = false;

    for (const block of blocks) {
        const isEmpty = block.type === 'line-break' ||
            (block.type === 'paragraph' && (!block.content[0] || block.content[0] === ''));

        if (isEmpty && lastWasEmpty) {
            continue; // Skip consecutive empty blocks
        }

        result.push(block);
        lastWasEmpty = isEmpty;
    }

    // Asegurar que siempre hay al menos un bloque
    if (result.length === 0) {
        result.push({
            id: 'block-0',
            type: 'paragraph',
            content: [''],
            attrs: {}
        });
    }

    return result;
}
