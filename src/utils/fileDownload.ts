/**
 * Utilidades para descargar archivos desde el navegador
 */

/**
 * Descarga un archivo de texto con el contenido especificado
 * @param content - Contenido del archivo
 * @param filename - Nombre del archivo (con extensión)
 * @param mimeType - Tipo MIME del archivo
 */
export function downloadTextFile(
    content: string,
    filename: string,
    mimeType: string = 'text/plain'
): void {
    // Crear un blob con el contenido
    const blob = new Blob([content], { type: mimeType });

    // Crear URL temporal para el blob
    const url = URL.createObjectURL(blob);

    // Crear elemento de descarga temporal
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.style.display = 'none';

    // Añadir al DOM, hacer click y remover
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Limpiar la URL temporal
    URL.revokeObjectURL(url);
}

/**
 * Genera un nombre de archivo con timestamp
 * @param baseName - Nombre base del archivo
 * @param extension - Extensión del archivo (sin punto)
 * @returns Nombre de archivo con timestamp
 */
export function generateTimestampFilename(baseName: string, extension: string): string {
    const now = new Date();
    const timestamp = now.toISOString()
        .replace(/:/g, '-')
        .replace(/\..+/, '')
        .replace('T', '_');

    return `${baseName}_${timestamp}.${extension}`;
}

/**
 * Descarga el contenido como archivo markdown
 * @param content - Contenido markdown
 * @param customName - Nombre personalizado (opcional)
 */
export function downloadMarkdownFile(content: string, customName?: string): void {
    const filename = customName || generateTimestampFilename('documento', 'md');
    downloadTextFile(content, filename, 'text/markdown');
}

/**
 * Descarga el contenido HTML como archivo PDF usando html2pdf.js
 * @param customName - Nombre personalizado (opcional)
 */
export async function downloadPDF(customName?: string): Promise<void> {
    // Importar html2pdf dinámicamente
    const { default: html2pdf } = await import("html2pdf.js");

    const filename = customName || generateTimestampFilename('documento', 'pdf');

    // Detectar el color de fondo actual del tema
    const backgroundColor = getCurrentBackgroundColor();
    console.log({ id: crypto.randomUUID(), backgroundColor });

    // Obtener el elemento #app para aplicar/quitar la clase
    const appElement = document.querySelector<HTMLDivElement>("#app");

    try {
        // Ocultar el cursor temporalmente
        if (appElement) {
            appElement.classList.add('hide-cursor');
        }

        // Generar y descargar PDF usando html2pdf.js directamente del div #app
        await html2pdf().set({
            margin: 0,
            filename: filename,
            image: { type: "png", quality: 0.9 },
            html2canvas: {
                scales: 2,
                backgroundColor: backgroundColor
            },
            jsPDF: {
                unit: 'mm',
                format: "a4",
                orientation: "portrait",
            },
            enableLinks: true
        }).from(appElement!).save();

    } catch (error) {
        console.error('Error al generar PDF:', error);
        throw new Error('No se pudo generar el archivo PDF');
    } finally {
        // Asegurar que el cursor se vuelva a mostrar, incluso si hay error
        if (appElement) {
            appElement.classList.remove('hide-cursor');
        }
    }
}

/**
 * Obtiene el color de fondo actual del tema activo
 * @returns Color de fondo en formato hexadecimal (ej: "#1a1a1a")
 */
function getCurrentBackgroundColor(): string {
    // Obtener el color de fondo del elemento #app o del body
    const appElement = document.querySelector<HTMLDivElement>("#app");
    const bodyElement = document.body;
    let colorValue = '';

    // Intentar obtener el color del #app primero
    if (appElement) {
        const appStyle = getComputedStyle(appElement);
        const appBgColor = appStyle.backgroundColor;

        // Si #app tiene un color de fondo válido (no transparente), usarlo
        if (appBgColor && appBgColor !== 'rgba(0, 0, 0, 0)' && appBgColor !== 'transparent') {
            colorValue = appBgColor;
        }
    }

    // Si no se encontró color en #app, usar el color del body
    if (!colorValue) {
        const bodyStyle = getComputedStyle(bodyElement);
        const bodyBgColor = bodyStyle.backgroundColor;

        if (bodyBgColor && bodyBgColor !== 'rgba(0, 0, 0, 0)' && bodyBgColor !== 'transparent') {
            colorValue = bodyBgColor;
        }
    }

    // Si no se encontró color en body, usar la variable CSS
    if (!colorValue) {
        const rootStyle = getComputedStyle(document.documentElement);
        const cssVarColor = rootStyle.getPropertyValue('--bg-primary').trim();
        colorValue = cssVarColor || '#1a1a1a'; // Fallback al color oscuro por defecto
    }

    // Convertir el color a formato hexadecimal si es necesario
    return convertColorToHex(colorValue);
}

/**
 * Convierte un color CSS a formato hexadecimal
 * @param color - Color en cualquier formato CSS (rgb, rgba, hex, etc.)
 * @returns Color en formato hexadecimal (ej: "#1a1a1a")
 */
function convertColorToHex(color: string): string {
    // Si ya es hexadecimal, devolverlo tal como está
    if (color.startsWith('#')) {
        return color;
    }

    // Si es formato rgb() o rgba()
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);

        // Convertir cada componente a hexadecimal
        const toHex = (n: number) => {
            const hex = n.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    // Para nombres de colores CSS o otros formatos, usar un canvas temporal
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = color;
            const computedColor = ctx.fillStyle;

            // Si el resultado es hexadecimal, devolverlo
            if (computedColor.startsWith('#')) {
                return computedColor;
            }

            // Si es RGB, convertir recursivamente
            if (computedColor.startsWith('rgb')) {
                return convertColorToHex(computedColor);
            }
        }
    } catch (error) {
        console.warn('Error al convertir color:', error);
    }

    // Fallback si no se pudo convertir
    return '#1a1a1a';
}

