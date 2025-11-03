/**
 * Editor de texto plano para markdown
 * Proporciona una vista accesible usando contenteditable
 */

export class PlainTextEditor {
    private container: HTMLElement;
    private editor!: HTMLDivElement;
    private onContentChangeCallback?: (content: string) => void;

    constructor(container: HTMLElement) {
        this.container = container;
        this.createEditor();
    }

    /**
     * Crea el elemento editor de texto plano
     */
    private createEditor(): void {
        this.editor = document.createElement('div');
        this.editor.className = 'plain-text-editor';
        this.editor.contentEditable = 'true';
        this.editor.spellcheck = true;
        this.editor.setAttribute('role', 'textbox');
        this.editor.setAttribute('aria-label', 'Editor de texto plano para markdown');
        this.editor.setAttribute('aria-multiline', 'true');

        // Placeholder visual
        this.editor.setAttribute('data-placeholder', 'Escribe tu markdown aquí...');

        // Event listeners
        this.setupEventListeners();

        // Insertar en el DOM (inicialmente oculto)
        this.editor.style.display = 'none';
        this.container.appendChild(this.editor);
    }

    /**
     * Configura los event listeners del editor
     */
    private setupEventListeners(): void {
        // Detectar cambios de contenido
        this.editor.addEventListener('input', () => {
            this.handleContentChange();
        });

        // Detectar paste
        this.editor.addEventListener('paste', (e) => {
            this.handlePaste(e);
        });

        // Prevenir algunos atajos de teclado problemáticos y permitir los útiles
        this.editor.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        // Manejar el placeholder
        this.editor.addEventListener('focus', () => {
            this.editor.classList.add('focused');
        });

        this.editor.addEventListener('blur', () => {
            this.editor.classList.remove('focused');
        });
    }

    /**
     * Maneja cambios en el contenido del editor
     */
    private handleContentChange(): void {
        if (this.onContentChangeCallback) {
            const content = this.getContent();
            this.onContentChangeCallback(content);
        }
    }

    /**
     * Maneja el evento paste para limpiar contenido HTML pegado
     */
    private handlePaste(e: ClipboardEvent): void {
        e.preventDefault();

        const paste = e.clipboardData?.getData('text/plain') || '';

        // Insertar texto plano en la posición del cursor
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(paste));

            // Mover cursor al final del texto pegado
            range.setStartAfter(range.endContainer);
            range.setEndAfter(range.endContainer);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        this.handleContentChange();
    }

    /**
     * Maneja teclas especiales
     */
    private handleKeyDown(e: KeyboardEvent): void {
        // Tab: insertar 4 espacios en lugar de cambiar foco
        if (e.key === 'Tab') {
            e.preventDefault();
            this.insertText('    ');
            return;
        }

        // Permitir Ctrl+A (seleccionar todo)
        if (e.ctrlKey && e.key === 'a') {
            return;
        }

        // Permitir Ctrl+C (copiar)
        if (e.ctrlKey && e.key === 'c') {
            return;
        }

        // Permitir Ctrl+X (cortar)
        if (e.ctrlKey && e.key === 'x') {
            return;
        }

        // Permitir Ctrl+V (pegar - manejado por handlePaste)
        if (e.ctrlKey && e.key === 'v') {
            return;
        }

        // Permitir Ctrl+Z (deshacer)
        if (e.ctrlKey && e.key === 'z') {
            return;
        }

        // Permitir Ctrl+Y (rehacer)
        if (e.ctrlKey && e.key === 'y') {
            return;
        }

        // Prevenir otros Ctrl+ comandos que puedan interferir
        if (e.ctrlKey && !e.shiftKey && !e.altKey) {
            if (['s', 'o', 'n', 'p'].includes(e.key)) {
                e.preventDefault();
                return;
            }
        }
    }

    /**
     * Inserta texto en la posición actual del cursor
     */
    private insertText(text: string): void {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(text));

            // Mover cursor al final del texto insertado
            range.setStartAfter(range.endContainer);
            range.setEndAfter(range.endContainer);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        this.handleContentChange();
    }

    /**
     * Obtiene el contenido actual como texto plano
     */
    public getContent(): string {
        return this.editor.innerText || '';
    }

    /**
     * Establece el contenido del editor
     */
    public setContent(content: string): void {
        this.editor.innerText = content;
    }

    /**
     * Muestra el editor de texto plano
     */
    public show(): void {
        this.editor.style.display = 'block';
        // Dar foco automáticamente cuando se muestra
        setTimeout(() => {
            this.editor.focus();
        }, 100);
    }

    /**
     * Oculta el editor de texto plano
     */
    public hide(): void {
        this.editor.style.display = 'none';
    }

    /**
     * Establece el callback para cambios de contenido
     */
    public onContentChange(callback: (content: string) => void): void {
        this.onContentChangeCallback = callback;
    }

    /**
     * Da foco al editor
     */
    public focus(): void {
        this.editor.focus();
    }

    /**
     * Verifica si el editor está visible
     */
    public isVisible(): boolean {
        return this.editor.style.display !== 'none';
    }
}
