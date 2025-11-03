/**
 * Archivo principal del editor de markdown
 * Inicializa el editor y maneja la integración con el DOM
 */

import 'normalize.css';
import './styles/themes.css';
import './style.css';

import { Writer } from './editor/Writer.js';
import { ConfigButton } from './ui/ConfigButton.js';
import { ConfigModal } from './ui/ConfigModal.js';
import { ThemeManager } from './ui/ThemeManager.js';

/**
 * Inicialización de la aplicación
 * 1. Encuentra el elemento contenedor en el DOM
 * 2. Crea una instancia del editor
 * 3. Configura los event listeners
 */

// Obtener el elemento contenedor principal
const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
    throw new Error("No se pudo encontrar el elemento #app en el DOM");
}

// Crear una instancia del editor de markdown
const writer = new Writer(app);

// Configurar el event listener global para el teclado
// Nota: Usamos window para capturar todos los eventos de teclado,
// independientemente de qué elemento tenga el foco
window.addEventListener("keydown", writer.onPressKey);

// Inicializar sistema de configuración
const themeManager = new ThemeManager();
const configModal = new ConfigModal(themeManager);
const configButton = new ConfigButton();

// Configurar callbacks
configModal.onGetContent(() => writer.getDocumentAsText());
configButton.onClick(() => configModal.show());

// Mostrar botón flotante
configButton.show();

/**
 * Opcional: Configurar otros event listeners para funcionalidad adicional
 * Por ejemplo, guardar automático, atajos de teclado especiales, etc.
 */

// Prevenir el comportamiento por defecto de algunas teclas
document.addEventListener("keydown", (event) => {
    // Prevenir Ctrl+S para evitar diálogo de guardado del navegador
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        // Aquí podrías implementar funcionalidad de guardado
        console.log("Guardar documento...");
    }

    // Prevenir Ctrl+O para evitar diálogo de abrir archivo
    if (event.ctrlKey && event.key === 'o') {
        event.preventDefault();
        // Aquí podrías implementar funcionalidad de carga
        console.log("Abrir documento...");
    }
});

// Log de inicialización para debugging
console.log("Editor de markdown inicializado correctamente");