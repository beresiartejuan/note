/**
 * Botón flotante de configuración
 * Se posiciona en la esquina inferior derecha y permite abrir el modal de configuración
 */

export class ConfigButton {
    private button: HTMLButtonElement;
    private onClickCallback?: () => void;

    constructor() {
        this.button = this.createButton();
        this.attachEventListeners();
        this.appendToDOM();
    }

    /**
     * Crea el elemento botón con todos sus estilos y atributos
     */
    private createButton(): HTMLButtonElement {
        const button = document.createElement('button');
        button.className = 'config-button';
        button.type = 'button';
        button.setAttribute('aria-label', 'Abrir configuración');
        button.setAttribute('title', 'Configuración del editor');

        // Añadir ícono de engranaje (usando emoji como fallback, se puede cambiar por SVG)
        button.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
        `;

        return button;
    }

    /**
     * Configura los event listeners del botón
     */
    private attachEventListeners(): void {
        this.button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleClick();
        });

        // Efectos visuales adicionales
        this.button.addEventListener('mouseenter', () => {
            this.button.style.transform = 'scale(1.1)';
        });

        this.button.addEventListener('mouseleave', () => {
            this.button.style.transform = 'scale(1)';
        });

        // Accesibilidad: manejar Enter y Espacio
        this.button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleClick();
            }
        });
    }

    /**
     * Maneja el click en el botón
     */
    private handleClick(): void {
        // Efecto de click
        this.button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.button.style.transform = 'scale(1)';
        }, 150);

        // Ejecutar callback si existe
        if (this.onClickCallback) {
            this.onClickCallback();
        }
    }

    /**
     * Añade el botón al DOM
     */
    private appendToDOM(): void {
        document.body.appendChild(this.button);
    }

    /**
     * Configura el callback que se ejecuta al hacer click
     * @param callback - Función a ejecutar cuando se hace click
     */
    onClick(callback: () => void): void {
        this.onClickCallback = callback;
    }

    /**
     * Muestra el botón
     */
    show(): void {
        this.button.style.display = 'flex';
        // Pequeña animación de entrada
        setTimeout(() => {
            this.button.style.opacity = '1';
            this.button.style.transform = 'scale(1)';
        }, 10);
    }

    /**
     * Oculta el botón
     */
    hide(): void {
        this.button.style.opacity = '0';
        this.button.style.transform = 'scale(0.8)';
        setTimeout(() => {
            this.button.style.display = 'none';
        }, 300);
    }

    /**
     * Elimina el botón del DOM
     */
    destroy(): void {
        if (this.button.parentNode) {
            this.button.parentNode.removeChild(this.button);
        }
    }

    /**
     * Obtiene el elemento botón (para testing o manipulación externa)
     */
    getElement(): HTMLButtonElement {
        return this.button;
    }
}
