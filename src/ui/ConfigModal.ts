/**
 * Modal de configuración del editor
 * Permite descargar archivos y cambiar temas
 */

import { ThemeManager, type ThemeName } from './ThemeManager.js';
import { downloadMarkdownFile, downloadPDF } from '../utils/fileDownload.js';

export class ConfigModal {
    private modal!: HTMLDivElement;
    private overlay!: HTMLDivElement;
    private content!: HTMLDivElement;
    private isVisible: boolean = false;
    private themeManager: ThemeManager;
    private onGetContentCallback?: () => string;

    constructor(themeManager: ThemeManager) {
        this.themeManager = themeManager;
        this.createModal();
        this.attachEventListeners();
    }

    /**
     * Crea la estructura HTML del modal
     */
    private createModal(): void {
        // Crear overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'config-modal-overlay';

        // Crear contenedor del modal
        this.modal = document.createElement('div');
        this.modal.className = 'config-modal';
        this.modal.setAttribute('role', 'dialog');
        this.modal.setAttribute('aria-labelledby', 'config-modal-title');
        this.modal.setAttribute('aria-modal', 'true');

        // Crear contenido del modal
        this.content = document.createElement('div');
        this.content.className = 'config-modal-content';
        this.content.innerHTML = this.createModalHTML();

        // Ensamblar estructura
        this.modal.appendChild(this.content);
        this.overlay.appendChild(this.modal);
    }

    /**
     * Genera el HTML interno del modal
     */
    private createModalHTML(): string {
        const themes = this.themeManager.getAvailableThemes();
        const currentTheme = this.themeManager.getCurrentTheme();

        return `
            <header class="config-modal-header">
                <h2 id="config-modal-title">⚙️ Configuración</h2>
                <button type="button" class="config-modal-close" aria-label="Cerrar configuración">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </header>

            <div class="config-modal-body">
                <section class="config-section">
                    <h3>📥 Descargar Archivo</h3>
                    <p>Descarga tu documento en diferentes formatos</p>
                    <div class="download-buttons">
                        <button type="button" class="config-button-primary" id="download-md-btn">
                            📄 Descargar Markdown
                        </button>
                        <button type="button" class="config-button-primary" id="download-pdf-btn">
                            📕 Descargar PDF
                        </button>
                    </div>
                </section>

                <section class="config-section">
                    <h3>🎨 Tema de Colores</h3>
                    <p>Selecciona la paleta de colores del editor</p>
                    <div class="theme-selector">
                        ${themes.map(theme => `
                            <label class="theme-option">
                                <input 
                                    type="radio" 
                                    name="theme" 
                                    value="${theme.name}"
                                    ${theme.name === currentTheme ? 'checked' : ''}
                                >
                                <span class="theme-label">
                                    <span class="theme-name">${theme.displayName}</span>
                                    <span class="theme-description">${theme.description}</span>
                                </span>
                            </label>
                        `).join('')}
                    </div>
                </section>
            </div>

            <footer class="config-modal-footer">
                <button type="button" class="config-button-secondary" id="cancel-btn">
                    Cerrar
                </button>
            </footer>
        `;
    }

    /**
     * Configura todos los event listeners del modal
     */
    private attachEventListeners(): void {
        // Click en overlay para cerrar
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });

        // Prevenir que clicks en el modal cierren el overlay
        this.modal.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Tecla ESC para cerrar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });

        // Event delegation para botones del modal (se configura cuando se muestra)
        this.content.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;

            // Botón cerrar
            if (target.closest('.config-modal-close') || target.closest('#cancel-btn')) {
                this.hide();
            }

            // Botón descargar Markdown
            if (target.closest('#download-md-btn')) {
                this.handleDownloadMarkdown();
            }

            // Botón descargar PDF
            if (target.closest('#download-pdf-btn')) {
                this.handleDownloadPDF();
            }
        });

        // Cambios de tema
        this.content.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.name === 'theme') {
                this.handleThemeChange(target.value as ThemeName);
            }
        });
    }

    /**
     * Maneja la descarga del archivo markdown
     */
    private handleDownloadMarkdown(): void {
        if (this.onGetContentCallback) {
            const content = this.onGetContentCallback();
            downloadMarkdownFile(content);
        } else {
            console.warn('No se configuró callback para obtener contenido');
        }
    }

    /**
     * Maneja la descarga del archivo PDF
     */
    private async handleDownloadPDF(): Promise<void> {
        try {
            // Mostrar indicador de carga
            const pdfButton = this.content.querySelector('#download-pdf-btn') as HTMLButtonElement;
            const originalText = pdfButton.textContent;
            pdfButton.textContent = '⏳ Generando PDF...';
            pdfButton.disabled = true;

            // Generar y descargar PDF (la función maneja todo internamente)
            await downloadPDF();

            // Restaurar botón
            pdfButton.textContent = originalText;
            pdfButton.disabled = false;

        } catch (error) {
            console.error('Error al generar PDF:', error);

            // Restaurar botón en caso de error
            const pdfButton = this.content.querySelector('#download-pdf-btn') as HTMLButtonElement;
            pdfButton.textContent = '📕 Descargar PDF';
            pdfButton.disabled = false;

            // Mostrar error al usuario
            this.showErrorMessage('Error al generar el archivo PDF. Inténtalo de nuevo.');
        }
    }

    /**
     * Muestra un mensaje de error temporal
     */
    private showErrorMessage(message: string): void {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent-secondary);
            color: var(--text-primary);
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 1010;
            opacity: 0;
            transition: opacity 0.3s ease;
            box-shadow: 0 4px 12px var(--shadow-color);
        `;

        document.body.appendChild(toast);

        // Animar entrada
        setTimeout(() => toast.style.opacity = '1', 10);

        // Eliminar después de 4 segundos
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }

    /**
     * Maneja el cambio de tema
     */
    private handleThemeChange(themeName: ThemeName): void {
        this.themeManager.setTheme(themeName);
    }

    /**
     * Muestra el modal
     */
    show(): void {
        if (this.isVisible) return;

        // Añadir al DOM
        document.body.appendChild(this.overlay);

        // Actualizar contenido con tema actual
        this.updateThemeSelection();

        // Forzar reflow antes de animar
        this.overlay.offsetHeight;

        // Mostrar con animación
        this.overlay.classList.add('show');
        this.modal.classList.add('show');

        this.isVisible = true;

        // Focus management
        const firstFocusable = this.content.querySelector('button, input') as HTMLElement;
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }

    /**
     * Oculta el modal
     */
    hide(): void {
        if (!this.isVisible) return;

        // Animar salida
        this.overlay.classList.remove('show');
        this.modal.classList.remove('show');

        // Remover del DOM después de la animación
        setTimeout(() => {
            if (this.overlay.parentNode) {
                document.body.removeChild(this.overlay);
            }
        }, 300);

        this.isVisible = false;
    }

    /**
     * Actualiza la selección de tema en el modal
     */
    private updateThemeSelection(): void {
        const currentTheme = this.themeManager.getCurrentTheme();
        const radioButtons = this.content.querySelectorAll('input[name="theme"]') as NodeListOf<HTMLInputElement>;

        radioButtons.forEach(radio => {
            radio.checked = radio.value === currentTheme;
        });
    }

    /**
     * Configura el callback para obtener contenido
     */
    onGetContent(callback: () => string): void {
        this.onGetContentCallback = callback;
    }

    /**
     * Verifica si el modal está visible
     */
    isOpen(): boolean {
        return this.isVisible;
    }

    /**
     * Destruye el modal y limpia recursos
     */
    destroy(): void {
        if (this.overlay.parentNode) {
            document.body.removeChild(this.overlay);
        }
        this.isVisible = false;
    }
}
