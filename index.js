require('dotenv').config();
const express = require('express');
// const multer = require('multer');
// const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const { marked } = require('marked');

const app = express();
const port = process.env.PORT || 3000;

console.time('Inicialización del servidor');

// Cargar el archivo de categorías de IVA
const leyIVA = require('./ley-iva.json');

// // Configuración de multer para guardar archivos temporalmente
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         const dir = './temp';
//         if (!fs.existsSync(dir)) {
//             console.log('Creando directorio temporal:', dir);
//             fs.mkdirSync(dir);
//         }
//         cb(null, dir);
//     },
//     filename: function (req, file, cb) {
//         const filename = Date.now() + path.extname(file.originalname);
//         console.log('Generando nombre de archivo temporal:', filename);
//         cb(null, filename);
//     }
// });

// const upload = multer({ storage: storage });

// Configuración del cliente de OpenAI (Deepseek)
const openai = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL
});

// console.log('Cliente Deepseek configurado con base URL:', process.env.DEEPSEEK_BASE_URL);
// console.timeEnd('Inicialización del servidor');

// Middleware para procesar JSON
app.use(express.json());

// Función para obtener el IVA correspondiente a una categoría
function obtenerIVA(categoria) {
    // console.time('Búsqueda de IVA');
    // console.log('Buscando IVA para categoría:', categoria);
    for (const grupo of leyIVA.IVA_Categories) {
        if (grupo.categories.includes(categoria)) {
            // console.log(`Categoría encontrada en grupo de ${grupo.IVA} IVA`);
            // console.timeEnd('Búsqueda de IVA');
            return parseFloat(grupo.IVA) / 100;
        }
    }
    // console.log('Categoría no encontrada, usando IVA por defecto (16%)');
    // console.timeEnd('Búsqueda de IVA');
    return 0.16;
}

// Función para obtener todas las categorías disponibles
function obtenerTodasLasCategorias() {
    // console.time('Obtención de categorías');
    const categorias = leyIVA.IVA_Categories.reduce((acc, grupo) => {
        return acc.concat(grupo.categories);
    }, []);
    // console.log(`Total de categorías disponibles: ${categorias.length}`);
    // console.timeEnd('Obtención de categorías');
    return categorias;
}

// // Función para descargar la imagen
// async function descargarImagen(url, rutaDestino) {
//     console.time('Descarga de imagen');
//     console.log('Iniciando descarga de imagen:', url);
//     try {
//         const response = await axios({
//             url,
//             responseType: 'arraybuffer'
//         });
//         console.log('Imagen descargada, tamaño:', response.data.length, 'bytes');
//         fs.writeFileSync(rutaDestino, response.data);
//         console.log('Imagen guardada en:', rutaDestino);
//         console.timeEnd('Descarga de imagen');
//         return rutaDestino;
//     } catch (error) {
//         console.error('Error al descargar la imagen:', error.message);
//         console.timeEnd('Descarga de imagen');
//         throw error;
//     }
// }

// Endpoint para clasificar productos
app.post('/clasificar-producto', async (req, res) => {
    // console.time('Procesamiento total');
    // console.log('\n=== Nueva solicitud de clasificación ===');
    // console.log('Datos recibidos:', {
    //     nombre: req.body.nombre,
    //     descripcion: req.body.descripcion,
    //     // urlImagen: req.body.urlImagen
    // });

    try {
        const { nombre, descripcion } = req.body;

        // if (!urlImagen) {
        //     console.log('Error: URL de imagen no proporcionada');
        //     console.timeEnd('Procesamiento total');
        //     return res.status(400).json({ error: 'Se requiere una URL de imagen' });
        // }

        // // Descargar la imagen
        // const rutaImagen = path.join('./temp', Date.now() + '.jpg');
        // await descargarImagen(urlImagen, rutaImagen);

        // Obtener todas las categorías disponibles
        const categoriasDisponibles = obtenerTodasLasCategorias();

        // Preparar el prompt para Deepseek
        const prompt = `Analiza y clasifica el producto en una de estas categorías de la ley del IVA en Venezuela: ${categoriasDisponibles.join(', ')}. 
        Nombre del producto: ${nombre}
        Descripción: ${descripcion}
        IMPORTANTE: Responde únicamente con el nombre exacto de una de las categorías listadas, sin texto adicional.
        Si no estás seguro, elige la categoría más general que se ajuste al producto.`;

        // console.log('Enviando solicitud a Deepseek...');
        // console.log('Prompt:', prompt);

        // Realizar la consulta a Deepseek
        // console.time('Consulta a Deepseek');
        const completion = await openai.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
        });
        // console.timeEnd('Consulta a Deepseek');

        const categoria = completion.choices[0].message.content.trim();
        // console.log('Respuesta de Deepseek:', categoria);

        const iva = obtenerIVA(categoria);
        // console.log('IVA calculado:', iva);

        // // Limpiar archivo temporal
        // console.time('Limpieza de archivos');
        // fs.unlinkSync(rutaImagen);
        // console.log('Archivo temporal eliminado:', rutaImagen);
        // console.timeEnd('Limpieza de archivos');

        const respuesta = {
            producto: nombre,
            categoria: categoria,
            iva: iva,
            porcentajeIVA: `${(iva * 100).toFixed(0)}%`
        };

        // console.log('Respuesta final:', respuesta);
        // console.log('=== Fin de la solicitud ===\n');
        // console.timeEnd('Procesamiento total');

        res.json(respuesta);

    } catch (error) {
        // console.error('Error en el procesamiento:', error);
        // console.error('Stack trace:', error.stack);
        // console.timeEnd('Procesamiento total');
        res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
});

// Endpoint para la documentación en HTML
app.get('/doc', (req, res) => {
    try {
        const readmePath = path.join(__dirname, 'README.md');
        const readmeContent = fs.readFileSync(readmePath, 'utf8');
        
        // Convertir Markdown a HTML
        const htmlContent = marked(readmeContent);
        
        // Crear una página HTML completa con estilos
        const htmlPage = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Documentación - Clasificador de IVA</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                        line-height: 1.6;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                        color: #333;
                    }
                    h1 {
                        color: #2c3e50;
                        border-bottom: 2px solid #eee;
                        padding-bottom: 10px;
                        text-align: center;
                    }
                    h2 {
                        color: #34495e;
                        margin-top: 30px;
                    }
                    h3 {
                        color: #7f8c8d;
                        text-align: center;
                    }
                    .code-block {
                        position: relative;
                        background-color: #f8f9fa;
                        padding: 15px;
                        border-radius: 5px;
                        overflow-x: auto;
                        margin: 15px 0;
                    }
                    .code-block pre {
                        margin: 0;
                        padding: 0;
                        background: none;
                    }
                    .copy-button {
                        position: absolute;
                        top: 5px;
                        right: 5px;
                        padding: 5px 10px;
                        background-color: #3498db;
                        color: white;
                        border: none;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 12px;
                        opacity: 0;
                        transition: opacity 0.3s;
                    }
                    .code-block:hover .copy-button {
                        opacity: 1;
                    }
                    .copy-button:hover {
                        background-color: #2980b9;
                    }
                    .copy-button.copied {
                        background-color: #27ae60;
                    }
                    code {
                        background-color: #f8f9fa;
                        padding: 2px 5px;
                        border-radius: 3px;
                        font-family: 'Courier New', Courier, monospace;
                    }
                    a {
                        color: #3498db;
                        text-decoration: none;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                    ul, ol {
                        padding-left: 20px;
                    }
                    blockquote {
                        border-left: 4px solid #ddd;
                        margin: 0;
                        padding-left: 15px;
                        color: #666;
                    }
                    .center {
                        text-align: center;
                    }
                    .badges {
                        margin: 20px 0;
                        text-align: center;
                    }
                    .badges img {
                        margin: 0 5px;
                    }
                    .logo {
                        margin: 20px auto;
                        display: block;
                    }
                    hr {
                        border: none;
                        border-top: 1px solid #eee;
                        margin: 30px 0;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                    }
                    .footer p {
                        margin: 5px 0;
                    }
                    .footer a {
                        color: #3498db;
                        text-decoration: none;
                        margin: 0 10px;
                    }
                    .footer a:hover {
                        text-decoration: underline;
                    }
                    .info-section {
                        background-color: #f8f9fa;
                        padding: 20px;
                        border-radius: 5px;
                        margin: 20px 0;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                ${htmlContent}
                <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        // Encontrar todos los bloques de código
                        document.querySelectorAll('pre code').forEach(function(block) {
                            // Crear el botón de copiar
                            const button = document.createElement('button');
                            button.className = 'copy-button';
                            button.textContent = 'Copiar';
                            
                            // Agregar el botón al bloque de código
                            const codeBlock = block.parentNode;
                            codeBlock.classList.add('code-block');
                            codeBlock.appendChild(button);
                            
                            // Agregar el evento de copiar
                            button.addEventListener('click', async function() {
                                try {
                                    await navigator.clipboard.writeText(block.textContent);
                                    button.textContent = '¡Copiado!';
                                    button.classList.add('copied');
                                    
                                    // Restaurar el botón después de 2 segundos
                                    setTimeout(() => {
                                        button.textContent = 'Copiar';
                                        button.classList.remove('copied');
                                    }, 2000);
                                } catch (err) {
                                    console.error('Error al copiar:', err);
                                    button.textContent = 'Error';
                                }
                            });
                        });
                    });
                </script>
            </body>
            </html>
        `;

        res.send(htmlPage);
    } catch (error) {
        console.error('Error al leer el README:', error);
        res.status(500).json({ error: 'Error al cargar la documentación' });
    }
});

// Endpoint principal para verificar el estado de la API
app.get('/', (req, res) => {
    const estadoAPI = {
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: {
            clasificarProducto: {
                ruta: '/clasificar-producto',
                metodo: 'POST',
                descripcion: 'Clasifica un producto y determina su IVA',
                parametros: {
                    nombre: 'string',
                    descripcion: 'string'
                }
            }
        },
        estadisticas: {
            totalCategorias: leyIVA.IVA_Categories.reduce((acc, grupo) => acc + grupo.categories.length, 0),
            categoriasPorIVA: leyIVA.IVA_Categories.map(g => ({
                iva: g.IVA,
                cantidad: g.categories.length
            }))
        }
    };
    res.json(estadoAPI);
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);

}); 