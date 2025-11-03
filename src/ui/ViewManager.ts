/**
 * Gestor de vistas del editor
 * Maneja el cambio entre vista de texto plano y vista renderizada
 */

export type ViewMode = 'plain' | 'rendered';

export interface ViewChangeCallback {
    (mode: ViewMode): void;
}

export class ViewManager {
    private currentMode: ViewMode = 'rendered';
    private toggleButton!: HTMLButtonElement;
    private onViewChangeCallback?: ViewChangeCallback;

    constructor() {
        this.createToggleButton();
    }

    /**
     * Crea el botón de toggle para cambiar entre vistas
     */
    private createToggleButton(): void {
        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'view-toggle-button';
        this.toggleButton.setAttribute('aria-label', 'Cambiar vista del editor');
        this.toggleButton.title = 'Cambiar entre vista de texto plano y vista renderizada';

        this.updateToggleButton();
        this.toggleButton.addEventListener('click', () => this.toggleView());

        // Insertar el botón en el DOM
        this.insertToggleButton();
    }

    /**
     * Inserta el botón de toggle en la posición correcta del DOM
     */
    private insertToggleButton(): void {
        // Crear un contenedor para el botón si no existe
        let buttonContainer = document.querySelector('.editor-controls');

        if (!buttonContainer) {
            buttonContainer = document.createElement('div');
            buttonContainer.className = 'editor-controls';

            // Insertar antes del contenedor principal del editor
            const app = document.querySelector('#app');
            if (app && app.parentNode) {
                app.parentNode.insertBefore(buttonContainer, app);
            }
        }

        buttonContainer.appendChild(this.toggleButton);
    }

    /**
     * Actualiza el contenido del botón según el modo actual
     */
    private updateToggleButton(): void {
        if (this.currentMode === 'rendered') {
            this.toggleButton.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2A8,8 0 0,0 6,10A8,8 0 0,0 14,18A8,8 0 0,0 22,10H20C20,13.32 17.32,16 14,16A6,6 0 0,1 8,10A6,6 0 0,1 14,4C14.43,4 14.86,4.05 15.27,4.14L16.88,2.53C15.96,2.18 15,2 14,2M20.59,3.58L14,10.17L11.17,7.34L9.76,8.75L14,13L22,5M7,19A2,2 0 0,0 5,17A2,2 0 0,0 3,19A2,2 0 0,0 5,21A2,2 0 0,0 7,19Z"/>
                </svg>
                <span>Texto plano</span>
            `;
            this.toggleButton.title = 'Cambiar a vista de texto plano';
        } else {
            this.toggleButton.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2,3H8V5H4V19H8V21H2V3M22,3V21H16V19H20V5H16V3H22M13,17V15H11V17H13M13,13V11H11V13H13M13,9V7H11V9H13M13,5V3H11V5H13Z"/>
                </svg>
                <span>Vista bonita</span>
            `;
            this.toggleButton.title = 'Cambiar a vista renderizada';
        }
    }

    /**
     * Cambia entre las dos vistas
     */
    private toggleView(): void {
        this.currentMode = this.currentMode === 'rendered' ? 'plain' : 'rendered';
        this.updateToggleButton();

        if (this.onViewChangeCallback) {
            this.onViewChangeCallback(this.currentMode);
        }
    }

    /**
     * Establece el callback que se ejecuta cuando cambia la vista
     */
    public onViewChange(callback: ViewChangeCallback): void {
        this.onViewChangeCallback = callback;
    }

    /**
     * Obtiene el modo de vista actual
     */
    public getCurrentMode(): ViewMode {
        return this.currentMode;
    }

    /**
     * Establece el modo de vista programáticamente
     */
    public setMode(mode: ViewMode): void {
        if (this.currentMode !== mode) {
            this.currentMode = mode;
            this.updateToggleButton();

            if (this.onViewChangeCallback) {
                this.onViewChangeCallback(this.currentMode);
            }
        }
    }

    /**
     * Muestra el botón de toggle
     */
    public show(): void {
        this.toggleButton.style.display = 'flex';
    }

    /**
     * Oculta el botón de toggle
     */
    public hide(): void {
        this.toggleButton.style.display = 'none';
    }
}
