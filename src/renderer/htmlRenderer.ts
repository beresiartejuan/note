import type { Block } from '../types.js';

/**
 * Renderizador HTML para bloques de markdown
 * Convierte la estructura de bloques en HTML válido
 */

/**
 * Renderiza un bloque individual y todo su contenido anidado
 * 
 * @param block - Bloque a renderizar
 * @returns HTML string del bloque renderizado
 */
export function renderBlock(block: Block): string {
    const contentHtml = processContent(block.content);

    switch (block.type) {
        case 'paragraph':
            return `<p>${contentHtml}</p>`;

        case 'heading':
            const level = block.attrs.level || '1';
            return `<h${level}>${contentHtml}</h${level}>`;

        case 'bold':
            return `<strong>${contentHtml}</strong>`;

        case 'italic':
            return `<em>${contentHtml}</em>`;

        case 'code':
            return `<code>${contentHtml}</code>`;

        case 'code-block':
            const language = block.attrs.language || '';
            return `<pre><code class="language-${language}">${contentHtml}</code></pre>`;

        case 'link':
            const href = block.attrs.href || '#';
            return `<a href="${href}" target="_blank">${contentHtml}</a>`;

        case 'image':
            const src = block.attrs.src || '';
            const alt = block.attrs.alt || contentHtml;
            const width = block.attrs.width;
            const height = block.attrs.height;

            let styleAttr = '';
            let classAttr = 'class="editor-image"';

            if (width && height) {
                styleAttr = `style="width: ${width}px; height: ${height}px;"`;
                classAttr = 'class="editor-image editor-image-sized"';
            } else {
                // Sin dimensiones: imagen centrada con ancho mínimo 100px
                classAttr = 'class="editor-image editor-image-auto"';
            }

            return `<img src="${src}" alt="${alt}" ${classAttr} ${styleAttr} />`;

        case 'list-item':
            return `<li>${contentHtml}</li>`;

        case 'quote':
            return `<blockquote>${contentHtml}</blockquote>`;

        case 'line-break':
            // Renderizar salto de línea como párrafo vacío con altura mínima
            return `<p class="line-break">&nbsp;</p>`;

        default:
            return contentHtml;
    }
}

/**
 * Procesa el contenido de un bloque, que puede ser una mezcla de strings e bloques anidados
 * 
 * @param content - Array de contenido mixto (strings y bloques)
 * @returns HTML string del contenido procesado
 */
function processContent(content: (string | Block)[]): string {
    return content.map(item => {
        if (typeof item === 'string') {
            // Convertir saltos de línea en <br> tags para HTML
            return item.replace(/\n/g, '<br>');
        } else {
            // Renderizar bloques anidados recursivamente
            return renderBlock(item);
        }
    }).join('');
}

/**
 * Renderiza una lista completa de bloques
 * 
 * @param blocks - Array de bloques a renderizar
 * @returns HTML string completo
 */
export function renderBlocks(blocks: Block[]): string {
    return blocks.map(block => renderBlock(block)).join('');
}
