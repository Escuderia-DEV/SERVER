const express = require('express');
const axios = require('axios');
const cors = require('cors');
const externalKeys = require('./apiKeys.js');
const mysqlCredentials = require('./mysqlCredentials.js');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const host = '0.0.0.0'; // Esto escuchará en todas las interfaces de red
const path = require('path');

// Usa cors en todos los directorios 
app.use(cors());
app.use(bodyParser.json());

// Configura express para servir archivos estáticos desde el directorio "public"
app.use(express.static('public'));
app.use(express.json()); // Agrega este middleware para analizar el cuerpo de la solicitud en formato JSON
app.use(express.urlencoded({ extended: true }));

// Conexion base de datos
const connection = mysql.createConnection({
    host: mysqlCredentials.host, // Cambia esto por tu host si es diferente
    user: mysqlCredentials.user, // Cambia esto por el nombre de usuario de tu base de datos
    password: mysqlCredentials.password, // Cambia esto por la contraseña de tu base de datos
    database: mysqlCredentials.database // Cambia esto por el nombre de tu base de datos
});
// API key configuration
const apiKeys = {
    movie: externalKeys.movie,
    tv: externalKeys.tv,
    games: externalKeys.games
};

app.post('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/index', (req, res) => {
         res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/search', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'search.html'));
});

app.get('/login', (req, res) => {
         res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
         res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.post('/viewUserLists', (req, res) => {
    const userMail = req.headers['user_mail'];
    const userId = req.headers['user_id'];

    connection.connect((err) => {
        if (err) {
            console.error('Error al conectar a la base de datos:', err);
            return;
        }
        console.log('Conexión establecida correctamente.');

        // Ejecutar consultas u otras operaciones aquí 
        connection.query('SELECT * FROM lists WHERE creator_id = ?', [userId], (err, results, fields) => {
            if (err) {
                console.error('Error al ejecutar la consulta:', err);
                return;
            }
            console.log('Resultados de la consulta:', results);
            res.json(results);
        });
    });
});

// Search route
app.get('/api/search', (req, res) => {
    const { category, query } = req.query;
    const apiKey = apiKeys[category];
    const searchURLs = {
        movie: 'https://api.themoviedb.org/3/search/movie',
        tv: 'https://api.themoviedb.org/3/search/tv',
        books: 'https://www.googleapis.com/books/v1/volumes',
        games: 'https://www.gamespot.com/api/games/'
    };

    let params = {};

    if (category === 'movie' || category === 'tv') {
        params = {
            api_key: apiKey,
            query: query
        };
    } else if (category === 'books') {
        params = {
            q: query
        };
    } else if (category === 'games') {
        params = {
            api_key: apiKey,
            filter: `name:${query}`,
            format: 'json'
        };
    }

    // Construye la URL de búsqueda usando la categoría proporcionada en la solicitud
    const searchURL = searchURLs[category];
    //console.log('Search URL:', searchURL);
    //console.log('Params:', params);

    axios.get(searchURL, {
        params: params
    })
        .then(response => {
            let resultsWithImages = [];

            if (category === 'books') {
                // Para la categoría de libros, la estructura de respuesta es diferente
                resultsWithImages = response.data.items.map(item => {
                    const volumeInfo = item.volumeInfo;
                    return {
                        id: item.id,
                        label: volumeInfo.title,
                        image: volumeInfo.imageLinks ? volumeInfo.imageLinks.thumbnail : null
                    };
                });
            } else if (category === 'games') {
                // Aquí se debe manejar la respuesta de búsqueda de juegos para incluir las imágenes correctamente
                resultsWithImages = response.data.results.map(result => {
                    //console.log('Result:', result.image); // Agrega un console.log para mostrar las imágenes de los juegos
                    return {
                        id: result.id,
                        label: result.name,
                        image: result.image ? result.image.original : null // Ajusta aquí según la estructura real de los datos de respuesta
                    };
                });
            } else {
                // Mapea los resultados para incluir la URL de la imagen
                resultsWithImages = response.data.results.map(result => {
                    //console.log('Result:', result.poster_path);     // Agrega un console.log para mostrar los resultados
                    return {
                        id: result.id,
                        label: result.title || result.name,
                        image: result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : null
                    };
                });
            }

            // Envia la respuesta con los resultados modificados
            res.json({ results: resultsWithImages });
        })
        .catch(error => {
            console.error('Search Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
});


// Detalles de ruta
app.get('/api/details', (req, res) => {
         const { category, id } = req.query;
         const apiKey = apiKeys[category];
         const detailsURLs = {
                  movie: `https://api.themoviedb.org/3/${category}/${id}`,
                  tv: `https://api.themoviedb.org/3/${category}/${id}`,
                  games: `https://www.gamespot.com/api/games/`,
                  books: `https://www.googleapis.com/books/v1/volumes?q=${id}`
         };

    let params = {};

         if (category === 'movie' || category === 'tv') {
                  params = {
                           api_key: apiKey
                  };
         } else if (category === 'games') {
                  params = {
                           api_key: apiKey,
                           filter: `id:${id}`,
                           format: 'json',
                  };
         }
         axios.get(detailsURLs[category], {
                  params: params
         })
                  .then(response => {
                           let responseData = response.data;

                           if (category === 'games' || category === 'books') {
                                    responseData = responseData.items[0]; // Aquí se selecciona el primer elemento del arreglo
                           }
                           // Incluye la URL de la imagen grande en la respuesta JSON
                           let imageUrl = null;
                           if (category === 'movie' || category === 'tv') {
                                    imageUrl = responseData.poster_path ? `https://image.tmdb.org/t/p/w500${responseData.poster_path}` : null;
                           } else if (category === 'games') {
                                    // Verifica si la propiedad 'original' está presente en el objeto de imagen
                                    imageUrl = responseData.image && responseData.image.original ? responseData.image.original : null;
                           } else if (category === 'books') {
                                    imageUrl = responseData.volumeInfo.imageLinks ? responseData.volumeInfo.imageLinks.thumbnail : null;
                           }
                           responseData.imageUrl = imageUrl;
                           console.log('Response Data:', responseData); // Agrega un console.log para mostrar la respuesta de los detalles
                           res.json(responseData);
                  })
                  .catch(error => {
                           res.status(500).json({ error: 'Internal server error' });
                  });


         // Agrega un console.log para mostrar la URL completa de la consulta
         //console.log('Detalles URL:', detailsURLs[category]);
});

app.post('/login', (req, res) => {
         const { email, password } = req.body;
         connection.query(
                  'SELECT * FROM users WHERE user_mail = ? AND user_password = ?',
                  [email, password],
                  (error, results) => {
                           if (error) {
                                    res.status(500).json({ error: 'Internal server error' });
                           } else {
                                    if (results.length > 0) {
                                             res.json({ success: true, userData: results });
                                             //console.log(results)
                                    } else {
                                             res.json({ success: false });
                                    }
                           }
                  }
         );
});

app.post('/register', (req, res) => {
    const { email, user, password } = req.body;
    connection.query(
        'SELECT * FROM users WHERE user_mail = ?', [email],
        (error, results) => {
            if (error) {
                res.status(500).json({ error: 'Internal server error' });
            } else {
                if (results.length > 0) {
                    res.json({ success: false, message: 'User already exists' });
                } else {
                    connection.query(
                        'INSERT INTO users (user_mail, user_name, user_password) VALUES (? , ? , ?)',
                        [email, user, password],
                        (error, results) => {
                            if (error) {
                                res.status(500).json({ error: 'Internal server error' });
                            } else {
                                res.json({ success: true });
                            }
                        }
                    );
                }
            }
        }

    );
});

app.post('/viewUserLists', (req, res) => {
         const userMail = req.headers['user_mail'];
         const userId = req.headers['user_id'];

         connection.connect((err) => {
                  if (err) {
                           console.error('Error al conectar a la base de datos:', err);
                           return;
                  }
                  console.log('Conexión establecida correctamente.');

                  // Ejecutar consultas u otras operaciones aquí 
                  connection.query('SELECT * FROM lists WHERE creator_id = ?', [userId], (err, results, fields) => {
                           if (err) {
                                    console.error('Error al ejecutar la consulta:', err);
                                    return;
                           }
                           //console.log('Resultados de la consulta:', results);
                           res.json(results);
                  });
         });
});

app.post('/addMediaToList', (req, res) => {
         const { list_id, category, item_id } = req.body;

         // Verificar si ya existe el item_id en la lista para la categoría dada
         connection.query(
                  `SELECT ${category} FROM lists WHERE list_id = ?`,
                  [list_id],
                  (error, results) => {
                           if (error) {
                                    res.status(500).json({ error: 'Internal server error' });
                           } else {
                                    // Si la consulta no devuelve resultados o la categoría es nula, significa que el item_id no existe
                                    if (results.length === 0 || results[0][category] === null || !results[0][category].includes(item_id)) {
                                             // No existe el item_id en la lista, proceder con la actualización
                                             if (results.length === 0 || results[0][category] === null) {
                                                      // No hay elementos en la categoría, insertar el nuevo elemento simplemente
                                                      connection.query(
                                                               `UPDATE lists SET ${category} = ? WHERE list_id = ?`,
                                                               [item_id, list_id],
                                                               (error, results) => {
                                                                        if (error) {
                                                                                 res.status(500).json({ error: 'Internal server error' });
                                                                        } else {
                                                                                 res.json({ success: true });
                                                                        }
                                                               }
                                                      );
                                             } else {
                                                      // Hay elementos en la categoría, concatenar el nuevo elemento con comas
                                                      const existingItems = results[0][category];
                                                      const updatedItems = `${existingItems},${item_id}`;

                                                      connection.query(
                                                               `UPDATE lists SET ${category} = ? WHERE list_id = ?`,
                                                               [updatedItems, list_id],
                                                               (error, results) => {
                                                                        if (error) {
                                                                                 res.status(500).json({ error: 'Internal server error' });
                                                                        } else {
                                                                                 res.json({ success: true });
                                                                        }
                                                               }
                                                      );
                                             }
                                    } else {
                                             // El item_id ya existe en la lista, enviar una respuesta indicando que no se realizó ninguna acción
                                             res.json({ success: false, message: 'El item_id ya existe en la lista.' });
                                    }
                           }
                  }
         );
});


app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
