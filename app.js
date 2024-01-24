const express = require('express');
const crypto = require('node:crypto');
const path = require('path');

const { validateMovie, validatePartialMovie } = require('./movies.js');
const movies = require('./movies.json');

const app = express();

app.disable('x-powered-by');

app.use(express.json());

const ACCEPTED_ORIGINS = [
    'http://localhost:8080',
    'http://localhost:3000'
]

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/movies', (req, res) => {
    const origin = req.header('origin');
    if (ACCEPTED_ORIGINS.includes(origin) || !origin){
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    const { genre } = req.query;
    if (genre) {
        const filteredMovies = movies.filter(
            movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
        );
        return res.json(filteredMovies);
    }
    res.json(movies);
});

app.get('/movies/:id', (req, res) => {
    const { id } = req.params;
    const movie = movies.find(movie => movie.id === id);
    if (movie) return res.json(movie);

    res.status(404).json({message: 'Movie not found'});
});

app.post('/movies', (req, res) => {
    const result = validateMovie(req.body);

    if (result.error) {
        return res.status(400).json({ error: JSON.parse(result.error.message) });
    }

    const newMovie = {
        id: crypto.randomUUID(),
        ...result.data
    }

    movies.push(newMovie);
    res.status(201).json(newMovie);
});

app.patch('/movies/:id', (req, res) => {
    const result = validatePartialMovie(req.body);
    if (!result.success) return res.status(400).json({ error: JSON.parse(result.error.message) });
    
    const { id } = req.params

    const movieIndex = movies.findIndex(movie => movie.id === id);
    if (movieIndex === -1) return res.status(404).json({ message: 'Movie not found' });

    const updateMovie = {
        ...movies[movieIndex],
        ...result.data
    }

   movies[movieIndex] = updateMovie;
   return res.json(updateMovie);
});

app.delete('/movies/:id', (req, res) => {
    const { id } = req.params;

    const movieIndex = movies.findIndex(movie => movie.id === id);
    if (movieIndex === -1) return res.status(404).json({ message: 'Movie not found' });

    movies.splice(movieIndex, 1);

    return res.json({ message: 'Movie deleted '});
});

app.listen(port=3000, () => {
    console.log(`server listening on port: ${port}`);
});