/**
 * Gestor de temas del editor
 * Maneja el cambio de paletas de colores y persistencia en localStorage
 */

export type ThemeName = 'dark' | 'light' | 'sepia' | 'high-contrast';

export interface Theme {
    name: ThemeName;
    displayName: string;
    description: string;
    className: string;
}

/**
 * Temas disponibles en el editor
 */
export const AVAILABLE_THEMES: Theme[] = [
    {
        name: 'dark',
        displayName: 'Oscuro',
        description: 'Tema oscuro con acentos naranjas',
        className: '' // Tema por defecto, sin clase adicional
    },
    {
        name: 'light',
        displayName: 'Claro',
        description: 'Tema claro con acentos azules',
        className: 'theme-light'
    },
    {
        name: 'sepia',
        displayName: 'Sepia',
        description: 'Tema sepia suave para lectura',
        className: 'theme-sepia'
    },
    {
        name: 'high-contrast',
        displayName: 'Alto Contraste',
        description: 'Tema de alto contraste para accesibilidad',
        className: 'theme-high-contrast'
    }
];

/**
 * Clase para gestionar temas del editor
 */
export class ThemeManager {
    private static readonly STORAGE_KEY = 'editor-theme';
    private currentTheme: ThemeName = 'dark';

    constructor() {
        this.loadThemeFromStorage();
        this.applyTheme(this.currentTheme);
    }

    /**
     * Obtiene el tema actual
     */
    getCurrentTheme(): ThemeName {
        return this.currentTheme;
    }

    /**
     * Obtiene todos los temas disponibles
     */
    getAvailableThemes(): Theme[] {
        return [...AVAILABLE_THEMES];
    }

    /**
     * Obtiene información del tema actual
     */
    getCurrentThemeInfo(): Theme {
        return AVAILABLE_THEMES.find(theme => theme.name === this.currentTheme) || AVAILABLE_THEMES[0];
    }

    /**
     * Cambia el tema activo
     * @param themeName - Nombre del tema a aplicar
     */
    setTheme(themeName: ThemeName): void {
        if (!AVAILABLE_THEMES.find(theme => theme.name === themeName)) {
            console.warn(`Tema '${themeName}' no encontrado, usando tema por defecto`);
            return;
        }

        this.currentTheme = themeName;
        this.applyTheme(themeName);
        this.saveThemeToStorage();
    }

    /**
     * Aplica el tema al DOM
     * @param themeName - Nombre del tema a aplicar
     */
    private applyTheme(themeName: ThemeName): void {
        const theme = AVAILABLE_THEMES.find(t => t.name === themeName);
        if (!theme) return;

        // Remover todas las clases de tema del body
        AVAILABLE_THEMES.forEach(t => {
            if (t.className) {
                document.body.classList.remove(t.className);
            }
        });

        // Añadir la clase del tema actual (si la tiene)
        if (theme.className) {
            document.body.classList.add(theme.className);
        }
    }

    /**
     * Carga el tema guardado desde localStorage
     */
    private loadThemeFromStorage(): void {
        try {
            const savedTheme = localStorage.getItem(ThemeManager.STORAGE_KEY) as ThemeName;
            if (savedTheme && AVAILABLE_THEMES.find(theme => theme.name === savedTheme)) {
                this.currentTheme = savedTheme;
            }
        } catch (error) {
            console.warn('Error al cargar tema desde localStorage:', error);
        }
    }

    /**
     * Guarda el tema actual en localStorage
     */
    private saveThemeToStorage(): void {
        try {
            localStorage.setItem(ThemeManager.STORAGE_KEY, this.currentTheme);
        } catch (error) {
            console.warn('Error al guardar tema en localStorage:', error);
        }
    }

    /**
     * Cambia al siguiente tema en la lista
     */
    nextTheme(): void {
        const currentIndex = AVAILABLE_THEMES.findIndex(theme => theme.name === this.currentTheme);
        const nextIndex = (currentIndex + 1) % AVAILABLE_THEMES.length;
        this.setTheme(AVAILABLE_THEMES[nextIndex].name);
    }

    /**
     * Reinicia al tema por defecto
     */
    resetToDefault(): void {
        this.setTheme('dark');
    }
}
