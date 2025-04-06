const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const port = 3000;

const url = 'https://es.wikipedia.org/wiki/Categor%C3%ADa:M%C3%BAsicos_de_rap';

app.get('/', async (req, res) => {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const links = [];

        // Obtener los enlaces dentro del div #mw-pages
        $('#mw-pages a').each((i, el) => {
            const link = 'https://es.wikipedia.org' + $(el).attr('href');
            links.push(link);
        });

        console.log(`🔗 Se encontraron ${links.length} enlaces...`);

        const resultados = [];

        // Recorrer cada enlace y hacer scraping de cada página
        for (const link of links) {
            try {
                const resInterna = await axios.get(link);
                const $interno = cheerio.load(resInterna.data);

                const titulo = $interno('h1').text().trim();
                const imagenes = [];
                const parrafos = [];

                // Extraer imágenes
                $interno('img').each((i, el) => {
                    const src = $interno(el).attr('src');
                    if (src && src.startsWith('//upload.wikimedia')) {
                        imagenes.push('https:' + src);
                    }
                });

                // Extraer textos
                $interno('p').each((i, el) => {
                    const texto = $interno(el).text().trim();
                    if (texto.length > 0) {
                        parrafos.push(texto);
                    }
                });

                resultados.push({
                    titulo,
                    imagenes,
                    parrafos
                });

                console.log(`✅ Scrapeado: ${titulo}`);

            } catch (err) {
                console.error(`❌ Error al entrar en ${link}: ${err.message}`);
            }
        }

        // Mostrar resultado
        res.json(resultados);

    } catch (error) {
        console.error('❌ Error al acceder a la página principal:', error.message);
        res.status(500).send('Error al hacer scraping');
    }
});

app.listen(port, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});
