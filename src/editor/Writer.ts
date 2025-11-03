import type { Block, CursorPosition } from '../types.js';
import { createEmptyParagraph } from '../utils/blockUtils.js';
import {
    moveCursorLeft,
    moveCursorRight,
    moveCursorUp,
    moveCursorDown,
    getCurrentContent
} from './cursor.js';
import {
    insertCharacter,
    deleteCharacterBackward,
    deleteCharacterForward,
    createNewBlock
} from './textOperations.js';
import { tryAutoConvertMarkdown } from './blockConverter.js';
import { updateDisplay } from './display.js';
import { ViewManager, type ViewMode } from '../ui/ViewManager.js';
import { PlainTextEditor } from '../ui/PlainTextEditor.js';
import { blocksToMarkdown, markdownToBlocks } from '../utils/markdownConverter.js';

/**
 * Clase principal del editor de markdown
 * Coordina todas las operaciones de edición y mantiene el estado del documento
 */
export class Writer {
    /** Posición actual del cursor [blockIndex, contentIndex, charIndex] */
    private pointer: CursorPosition = [0, 0, 0];

    /** Array de bloques que representan el documento */
    private content: Block[] = [];

    /** Elemento HTML donde se renderiza el editor */
    private container: HTMLElement;

    /** Clipboard interno para copiar/pegar */
    private clipboard: string = '';

    /** Gestor de vistas del editor */
    private viewManager!: ViewManager;

    /** Editor de texto plano */
    private plainTextEditor!: PlainTextEditor;

    /** Contenedor específico para la vista renderizada */
    private renderedContainer!: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;
        this.setupContainers();
        this.setupViewManager();
        this.setupPlainTextEditor();
        this.initializeWithEmptyParagraph();
        this.setupDragAndDrop();
        this.setupClickableBlocks();
    }

    /**
     * Configura los contenedores para las diferentes vistas
     */
    private setupContainers(): void {
        this.container.innerHTML = "";

        // Crear contenedor específico para la vista renderizada
        this.renderedContainer = document.createElement('div');
        this.renderedContainer.className = 'rendered-editor-container';
        this.container.appendChild(this.renderedContainer);
    }

    /**
     * Configura el gestor de vistas
     */
    private setupViewManager(): void {
        this.viewManager = new ViewManager();
        this.viewManager.onViewChange((mode: ViewMode) => {
            this.handleViewChange(mode);
        });
        this.viewManager.show();
    }

    /**
     * Configura el editor de texto plano
     */
    private setupPlainTextEditor(): void {
        this.plainTextEditor = new PlainTextEditor(this.container);
        this.plainTextEditor.onContentChange((markdown: string) => {
            this.handlePlainTextChange(markdown);
        });
    }

    /**
     * Maneja el cambio entre vistas
     */
    private handleViewChange(mode: ViewMode): void {
        if (mode === 'plain') {
            // Cambiar a vista de texto plano
            const currentMarkdown = blocksToMarkdown(this.content);
            this.plainTextEditor.setContent(currentMarkdown);
            this.renderedContainer.style.display = 'none';
            this.plainTextEditor.show();
        } else {
            // Cambiar a vista renderizada
            const plainText = this.plainTextEditor.getContent();
            if (plainText.trim()) {
                this.content = markdownToBlocks(plainText);
                this.updateDisplay();
            }
            this.plainTextEditor.hide();
            this.renderedContainer.style.display = 'block';
        }
    }

    /**
     * Maneja cambios en el editor de texto plano
     */
    private handlePlainTextChange(markdown: string): void {
        // Actualizar la estructura de bloques en segundo plano
        // pero no cambiar la vista hasta que el usuario cambie de vista
        this.content = markdownToBlocks(markdown);
    }

    /**
     * Inicializa el editor con un párrafo vacío
     * Estado inicial básico para comenzar a escribir
     */
    private initializeWithEmptyParagraph(): void {
        this.content = [createEmptyParagraph()];
        this.updateDisplay();
    }

    /**
     * Configura la funcionalidad de arrastrar y soltar para imágenes
     * Permite insertar imágenes arrastrándolas desde el explorador de archivos
     */
    private setupDragAndDrop(): void {
        // Prevenir el comportamiento por defecto en toda el área del editor renderizado
        this.renderedContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.renderedContainer.style.backgroundColor = '#4a4d5a';
        });

        this.renderedContainer.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.renderedContainer.style.backgroundColor = '';
        });

        this.renderedContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.renderedContainer.style.backgroundColor = '';

            const files = Array.from(e.dataTransfer?.files || []);
            const imageFiles = files.filter(file => file.type.startsWith('image/'));

            imageFiles.forEach(file => {
                this.insertImageFromFile(file);
            });
        });
    }

    /**
     * Configura la funcionalidad de bloques clickeables
     * Permite al usuario posicionar el cursor haciendo click en cualquier parte del contenido
     */
    private setupClickableBlocks(): void {
        this.renderedContainer.addEventListener('click', (e) => {
            // No prevenir el comportamiento por defecto inmediatamente
            // para permitir que el click funcione en todos los elementos
            this.handleClick(e);
        });
    }

    /**
     * Maneja el evento de click para posicionar el cursor
     * Convierte la posición del click en una posición válida del cursor
     */
    private handleClick(event: MouseEvent): void {
        // Obtener el elemento clickeado
        const target = event.target as HTMLElement;
        if (!target) return;

        // Buscar el elemento de bloque más cercano (p, h1-h6, li, blockquote, etc.)
        const blockElement = this.findBlockElement(target);
        if (!blockElement) return;

        // Obtener todos los elementos de bloque del contenedor
        const blockElements = this.renderedContainer.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre');
        const blockIndex = Array.from(blockElements).indexOf(blockElement);

        if (blockIndex === -1) return;

        // Validar que el índice del bloque corresponda con nuestro array de contenido
        if (blockIndex >= this.content.length) {
            console.warn('Índice de bloque fuera de rango:', blockIndex, 'contenido length:', this.content.length);
            return;
        }

        // Obtener el bloque actual del contenido
        const currentBlock = this.content[blockIndex];

        // Si es un line-break, convertirlo a párrafo normal para permitir edición
        if (currentBlock && currentBlock.type === 'line-break') {
            currentBlock.type = 'paragraph';
            currentBlock.content = [''];
        }

        // Calcular la posición del carácter dentro del bloque
        const charPosition = this.getCharacterPositionFromClick(blockElement, event);

        // Establecer nueva posición del cursor
        this.pointer = [blockIndex, 0, charPosition];
        this.updateDisplay();
    }

    /**
     * Encuentra el elemento de bloque más cercano al elemento clickeado
     */
    private findBlockElement(element: HTMLElement): HTMLElement | null {
        let current = element;

        while (current && current !== this.renderedContainer) {
            // Verificar si es un elemento de bloque que reconocemos
            if (current.matches('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre')) {
                return current;
            }
            current = current.parentElement as HTMLElement;
        }

        // Si no encontramos un bloque, pero el click fue directamente en el contenedor,
        // buscar el bloque más cercano al punto de click
        if (current === this.renderedContainer) {
            return this.findNearestBlockElement(element);
        }

        return null;
    }

    /**
     * Encuentra el bloque más cercano al elemento clickeado cuando el click fue en el contenedor
     */
    private findNearestBlockElement(clickedElement: HTMLElement): HTMLElement | null {
        const blockElements = this.renderedContainer.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre');

        // Si el elemento clickeado es directamente un bloque, devolverlo
        if (clickedElement.matches('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre')) {
            return clickedElement;
        }

        // Si hay bloques disponibles, devolver el primero como fallback
        if (blockElements.length > 0) {
            return blockElements[0] as HTMLElement;
        }

        return null;
    }

    /**
     * Calcula la posición del carácter basada en la posición del click
     * Utiliza Range API para determinar el índice exacto del carácter
     */
    private getCharacterPositionFromClick(blockElement: HTMLElement, event: MouseEvent): number {
        // Si el bloque es un line-break o está vacío, siempre posición 0
        // (los line-breaks ya se habrán convertido a párrafos en handleClick)
        if (blockElement.classList.contains('line-break')) {
            return 0;
        }

        // Obtener el texto limpio (sin elementos como cursor)
        const cleanText = this.getCleanTextContent(blockElement);

        // Si el texto está vacío (párrafo vacío), posición 0
        if (cleanText.length === 0 || cleanText.trim() === '' || cleanText === '\u00A0') {
            return 0;
        }

        // Usar caretPositionFromPoint si está disponible (más preciso)
        if (document.caretPositionFromPoint) {
            try {
                const caretPosition = document.caretPositionFromPoint(event.clientX, event.clientY);
                if (caretPosition && caretPosition.offsetNode) {
                    return this.calculateOffsetInCleanText(blockElement, caretPosition.offsetNode, caretPosition.offset);
                }
            } catch (error) {
                // Continuar con método alternativo
            }
        }

        // Método alternativo: usar caretRangeFromPoint (WebKit)
        if ((document as any).caretRangeFromPoint) {
            try {
                const range = (document as any).caretRangeFromPoint(event.clientX, event.clientY);
                if (range && range.startContainer) {
                    return this.calculateOffsetInCleanText(blockElement, range.startContainer, range.startOffset);
                }
            } catch (error) {
                // Continuar con método de fallback
            }
        }

        // Método de fallback: aproximación por distancia
        return this.approximateCharacterPosition(blockElement, event, cleanText);
    }

    /**
     * Obtiene el contenido de texto limpio, excluyendo elementos de cursor y otros markup
     */
    private getCleanTextContent(element: HTMLElement): string {
        // Clonar el elemento para no modificar el original
        const clone = element.cloneNode(true) as HTMLElement;

        // Remover elementos de cursor y otros elementos que no son contenido real
        const cursors = clone.querySelectorAll('.cursor');
        cursors.forEach(cursor => cursor.remove());

        const textContent = clone.textContent || '';

        // Convertir &nbsp; (espacio no rompible) a string vacío para line-breaks
        if (textContent === '\u00A0') {
            return '';
        }

        return textContent;
    }

    /**
     * Calcula el offset en el texto limpio basado en un nodo y offset del DOM
     */
    private calculateOffsetInCleanText(blockElement: HTMLElement, node: Node, offset: number): number {
        // Crear un walker para obtener todos los nodos de texto
        const walker = document.createTreeWalker(
            blockElement,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Excluir nodos dentro de elementos cursor
                    const parent = node.parentElement;
                    if (parent && parent.classList.contains('cursor')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let currentLength = 0;
        let currentNode;

        while (currentNode = walker.nextNode()) {
            if (currentNode === node) {
                return currentLength + offset;
            }
            currentLength += currentNode.textContent?.length || 0;
        }

        // Si no se encuentra el nodo, retornar la longitud total
        return currentLength;
    }

    /**
     * Método de aproximación por distancia cuando la API de caret no está disponible
     */
    private approximateCharacterPosition(blockElement: HTMLElement, event: MouseEvent, cleanText: string): number {
        const range = document.createRange();
        let bestPosition = 0;
        let minDistance = Infinity;

        // Obtener el primer nodo de texto válido
        const textNode = this.getFirstValidTextNode(blockElement);
        if (!textNode) return 0;

        // Recorrer cada posición de carácter
        for (let i = 0; i <= cleanText.length; i++) {
            try {
                const safeOffset = Math.min(i, textNode.textContent?.length || 0);
                range.setStart(textNode, safeOffset);
                range.setEnd(textNode, safeOffset);

                const rect = range.getBoundingClientRect();
                const distance = Math.abs(event.clientX - rect.left);

                if (distance < minDistance) {
                    minDistance = distance;
                    bestPosition = i;
                }
            } catch (error) {
                continue;
            }
        }

        return bestPosition;
    }

    /**
     * Obtiene el primer nodo de texto válido (excluyendo cursors)
     */
    private getFirstValidTextNode(element: HTMLElement): Text | null {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    const parent = node.parentElement;
                    if (parent && parent.classList.contains('cursor')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        return walker.nextNode() as Text;
    }

    /**
     * Inserta una imagen desde un archivo
     * Convierte el archivo a URL y crea el bloque de imagen correspondiente
     */
    private insertImageFromFile(file: File): void {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            if (imageUrl) {
                this.insertImageAtCursor(file.name, imageUrl);
            }
        };
        reader.readAsDataURL(file);
    }

    /**
     * Inserta una imagen en la posición actual del cursor
     */
    private insertImageAtCursor(altText: string, imageUrl: string, dimensions?: string): void {
        // Crear el texto markdown para la imagen
        let imageMarkdown = `![${altText}](${imageUrl})`;

        // Añadir dimensiones si están especificadas y son válidas
        if (dimensions && dimensions.match(/^\d+x\d+$/)) {
            imageMarkdown += `{${dimensions}}`;
        }

        // Insertar cada carácter del markdown
        for (const char of imageMarkdown) {
            const result = insertCharacter(this.content, this.pointer, char);
            this.content = result.blocks;
            this.pointer = result.newPosition;
        }

        this.updateDisplay();
    }    /**
     * Solicita al usuario la URL de una imagen para insertar
     * Atajo de teclado: Ctrl+I
     */
    private promptForImage(): void {
        const imageUrl = prompt('Ingresa la URL de la imagen:');
        if (imageUrl && imageUrl.trim()) {
            const altText = prompt('Texto alternativo para la imagen (opcional):') || 'Imagen';
            const dimensions = prompt('Dimensiones (opcional, formato: 100x200):');

            let imageMarkdown = `![${altText}](${imageUrl.trim()})`;

            // Verificar si las dimensiones tienen el formato correcto
            if (dimensions && dimensions.match(/^\d+x\d+$/)) {
                imageMarkdown += `{${dimensions}}`;
            }

            this.insertImageAtCursor(altText, imageUrl.trim(), dimensions || undefined);
        }
    }

    /**
     * Manejador principal de eventos de teclado
     * Coordina todas las operaciones de edición basadas en la tecla presionada
     */
    onPressKey = (event: KeyboardEvent): void => {
        // Solo procesar eventos de teclado en la vista renderizada
        if (this.viewManager.getCurrentMode() !== 'rendered') {
            return;
        }

        // Prevenir comportamiento por defecto del navegador
        event.preventDefault();

        // Manejar atajos de teclado con Ctrl
        if (event.ctrlKey) {
            switch (event.key) {
                case 'i':
                case 'I':
                    this.promptForImage();
                    return;
                case 'c':
                case 'C':
                    this.copyToClipboard();
                    return;
                case 'v':
                case 'V':
                    this.pasteFromClipboard();
                    return;
                case 'x':
                case 'X':
                    this.cutToClipboard();
                    return;
                case 'a':
                case 'A':
                    this.selectAll();
                    return;
            }
        }

        // Manejar teclas especiales de navegación y edición
        switch (event.key) {
            case 'Backspace':
                this.handleBackspace();
                break;

            case 'Delete':
                this.handleDelete();
                break;

            case 'ArrowLeft':
                this.handleArrowLeft();
                break;

            case 'ArrowRight':
                this.handleArrowRight();
                break;

            case 'ArrowUp':
                this.handleArrowUp();
                break;

            case 'ArrowDown':
                this.handleArrowDown();
                break;

            case 'Enter':
                this.handleEnter();
                break;

            default:
                // Manejar caracteres imprimibles
                if (event.key.length === 1) {
                    this.handleCharacterInput(event.key);
                }
                break;
        }

        // Actualizar la visualización después de cada operación
        this.updateDisplay();
    }

    /**
     * Maneja la eliminación hacia atrás (Backspace)
     */
    private handleBackspace(): void {
        const result = deleteCharacterBackward(this.content, this.pointer);
        this.content = result.blocks;
        this.pointer = result.newPosition;

        // Verificar si el bloque actual se quedó vacío y debe convertirse a párrafo
        this.checkAndConvertEmptySpecialBlocks();
    }

    /**
     * Maneja la eliminación hacia adelante (Delete)
     */
    private handleDelete(): void {
        const result = deleteCharacterForward(this.content, this.pointer);
        this.content = result.blocks;
        this.pointer = result.newPosition;

        // Verificar si el bloque actual se quedó vacío y debe convertirse a párrafo
        this.checkAndConvertEmptySpecialBlocks();
    }

    /**
     * Maneja navegación hacia la izquierda
     */
    private handleArrowLeft(): void {
        this.pointer = moveCursorLeft(this.content, this.pointer);
    }

    /**
     * Maneja navegación hacia la derecha
     */
    private handleArrowRight(): void {
        this.pointer = moveCursorRight(this.content, this.pointer);
    }

    /**
     * Maneja navegación hacia arriba
     */
    private handleArrowUp(): void {
        this.pointer = moveCursorUp(this.content, this.pointer);
    }

    /**
     * Maneja navegación hacia abajo
     */
    private handleArrowDown(): void {
        this.pointer = moveCursorDown(this.content, this.pointer);
    }

    /**
     * Maneja la creación de nuevos bloques (Enter)
     */
    private handleEnter(): void {
        const result = createNewBlock(this.content, this.pointer);
        this.content = result.blocks;
        this.pointer = result.newPosition;
    }

    /**
     * Maneja la entrada de caracteres regulares
     * Incluye lógica para autoconversión de markdown
     */
    private handleCharacterInput(char: string): void {
        // Insertar el carácter
        const insertResult = insertCharacter(this.content, this.pointer, char);
        this.content = insertResult.blocks;
        this.pointer = insertResult.newPosition;

        // Si se escribió un espacio, intentar autoconversión de markdown
        if (char === ' ') {
            const currentBlock = this.content[this.pointer[0]];
            if (currentBlock && currentBlock.type === 'paragraph') {
                const newContent = getCurrentContent(this.content, this.pointer);
                const conversionResult = tryAutoConvertMarkdown(this.content, this.pointer, newContent);

                if (conversionResult.converted) {
                    this.content = conversionResult.blocks;
                    this.pointer = conversionResult.newPosition;
                }
            }
        }
    }

    /**
     * Verifica si el bloque actual está vacío y debe convertirse de vuelta a párrafo
     * Esto previene que encabezados, listas, etc. mantengan su formato cuando están vacíos
     */
    private checkAndConvertEmptySpecialBlocks(): void {
        const [blockIndex] = this.pointer;
        const currentBlock = this.content[blockIndex];

        if (!currentBlock) return;

        // Verificar si el bloque está vacío
        const isEmpty = currentBlock.content.length === 0 ||
            (currentBlock.content.length === 1 &&
                typeof currentBlock.content[0] === 'string' &&
                currentBlock.content[0].trim() === '');

        if (isEmpty) {
            // Convertir bloques especiales vacíos de vuelta a párrafos
            const specialTypes = ['heading', 'list-item', 'quote', 'code-block'];

            if (specialTypes.includes(currentBlock.type)) {
                currentBlock.type = 'paragraph';
                currentBlock.content = [''];
                currentBlock.attrs = {};

                // Asegurar que el cursor esté en posición válida
                this.pointer = [blockIndex, 0, 0];
            }
        }
    }

    /**
     * Actualiza la visualización del editor
     * Renderiza todo el contenido con el cursor en la posición correcta
     */
    private updateDisplay(): void {
        updateDisplay(this.renderedContainer, this.content, this.pointer);
    }

    /**
     * Copia el contenido actual al clipboard del sistema y interno
     */
    private async copyToClipboard(): Promise<void> {
        const textToCopy = this.getDocumentAsText();

        try {
            // Intentar usar la API moderna del clipboard
            await navigator.clipboard.writeText(textToCopy);
        } catch (error) {
            // Fallback: usar el clipboard interno
            console.warn('No se pudo acceder al clipboard del sistema, usando clipboard interno');
        }

        // Siempre actualizar el clipboard interno
        this.clipboard = textToCopy;

        // Mostrar feedback visual
        this.showToast('Copiado al portapapeles');
    }

    /**
     * Pega contenido desde el clipboard del sistema o interno
     */
    private async pasteFromClipboard(): Promise<void> {
        let textToPaste = '';

        try {
            // Intentar leer del clipboard del sistema
            textToPaste = await navigator.clipboard.readText();
        } catch (error) {
            // Fallback: usar clipboard interno
            textToPaste = this.clipboard;
            console.warn('No se pudo acceder al clipboard del sistema, usando clipboard interno');
        }

        if (textToPaste) {
            this.insertTextAtCursor(textToPaste);
            this.showToast('Pegado desde portapapeles');
        }
    }

    /**
     * Corta el contenido actual (copia y luego elimina)
     */
    private async cutToClipboard(): Promise<void> {
        await this.copyToClipboard();
        // Por simplicidad, vamos a limpiar todo el documento
        this.content = [createEmptyParagraph()];
        this.pointer = [0, 0, 0];
        this.updateDisplay();
        this.showToast('Cortado al portapapeles');
    }

    /**
     * Selecciona todo el contenido del documento
     */
    private selectAll(): void {
        // Por simplicidad, vamos a mostrar el contenido completo
        const allText = this.getDocumentAsText();
        this.showToast(`Documento: ${allText.length} caracteres`);
    }

    /**
     * Convierte todo el documento a texto plano markdown
     */
    public getDocumentAsText(): string {
        // Si estamos en vista de texto plano, usar el contenido del editor plano
        if (this.viewManager.getCurrentMode() === 'plain') {
            return this.plainTextEditor.getContent();
        }
        // Si estamos en vista renderizada, convertir los bloques a markdown
        return blocksToMarkdown(this.content);
    }

    /**
     * Convierte un bloque a su representación markdown
     */
    private blockToMarkdown(block: Block): string {
        const content = block.content.map(item =>
            typeof item === 'string' ? item : this.blockToMarkdown(item)
        ).join('');

        switch (block.type) {
            case 'heading':
                const level = parseInt(block.attrs.level || '1');
                return '#'.repeat(level) + ' ' + content;
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
                return `[${content}](${block.attrs.href || ''})`;
            case 'image':
                const dimensions = block.attrs.width && block.attrs.height
                    ? `{${block.attrs.width}x${block.attrs.height}}`
                    : '';
                return `![${block.attrs.alt || content}](${block.attrs.src || ''})${dimensions}`;
            case 'list-item':
                const listType = block.attrs.listType === 'ordered' ? '1.' : '-';
                return `${listType} ${content}`;
            case 'quote':
                return `> ${content}`;
            case 'line-break':
                return '';
            case 'paragraph':
            default:
                return content;
        }
    }

    /**
     * Inserta texto en la posición actual del cursor
     */
    private insertTextAtCursor(text: string): void {
        // Insertar cada carácter del texto
        for (const char of text) {
            if (char === '\n') {
                // Manejar saltos de línea como Enter
                const result = createNewBlock(this.content, this.pointer);
                this.content = result.blocks;
                this.pointer = result.newPosition;
            } else {
                // Insertar carácter normal
                const result = insertCharacter(this.content, this.pointer, char);
                this.content = result.blocks;
                this.pointer = result.newPosition;
            }
        }
        this.updateDisplay();
    }

    /**
     * Muestra un mensaje toast temporal
     */
    private showToast(message: string): void {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4a4d5a;
            color: #FDFFFC;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        document.body.appendChild(toast);

        // Animar entrada
        setTimeout(() => toast.style.opacity = '1', 10);

        // Eliminar después de 2 segundos
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 2000);
    }

    /**
     * Obtiene el contenido actual del documento como array de bloques
     * Útil para serialización o debugging
     */
    public getContent(): Block[] {
        return [...this.content];
    }

    /**
     * Establece nuevo contenido en el editor
     * Útil para cargar documentos existentes
     */
    public setContent(newContent: Block[]): void {
        this.content = [...newContent];
        this.pointer = [0, 0, 0]; // Resetear cursor al inicio
        this.updateDisplay();
    }
}
