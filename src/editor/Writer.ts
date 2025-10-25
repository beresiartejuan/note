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

    /** Estado de selección [inicio, fin] donde cada posición es [blockIndex, contentIndex, charIndex] */
    private selection: [CursorPosition, CursorPosition] | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
        this.container.innerHTML = "";
        this.initializeWithEmptyParagraph();
        this.setupDragAndDrop();
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
        // Prevenir el comportamiento por defecto en toda el área del editor
        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.container.style.backgroundColor = '#4a4d5a';
        });

        this.container.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.container.style.backgroundColor = '';
        });

        this.container.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.container.style.backgroundColor = '';

            const files = Array.from(e.dataTransfer?.files || []);
            const imageFiles = files.filter(file => file.type.startsWith('image/'));

            imageFiles.forEach(file => {
                this.insertImageFromFile(file);
            });
        });
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
    }

    /**
     * Maneja la eliminación hacia adelante (Delete)
     */
    private handleDelete(): void {
        const result = deleteCharacterForward(this.content, this.pointer);
        this.content = result.blocks;
        this.pointer = result.newPosition;
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
     * Actualiza la visualización del editor
     * Renderiza todo el contenido con el cursor en la posición correcta
     */
    private updateDisplay(): void {
        updateDisplay(this.container, this.content, this.pointer);
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
    private getDocumentAsText(): string {
        return this.content.map(block => this.blockToMarkdown(block)).join('\n');
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
