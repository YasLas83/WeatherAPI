// index.js
var express = require('express');
var router = express.Router();
const weatherApi = require('../services/weatherApi');
const db = require('../database');

// GET home page
router.get('/', function(req, res) {
  res.redirect('/city');
});

// Afficher le formulaire pour entrer la ville
router.get('/city', (req, res) => {
  res.render('city');
});

// Traiter le formulaire
router.get('/city-weather', async (req, res) => {
  const lat = req.query.lat;
  const lon = req.query.lon;

  try {
    const weatherData = await weatherApi.getWeatherForecast(lat, lon);
    const instantDetails = weatherData.properties.timeseries[0].data.instant.details;

    res.render('city-weather', {
      weather: {
        temperature: instantDetails.air_temperature,
        windSpeed: instantDetails.wind_speed,
        windDirection: instantDetails.wind_from_direction,
        cloudiness: instantDetails.cloud_area_fraction,
      }
    });
  } catch (error) {
    res.status(500).send('Erreur lors de la récupération des données météo');
  }
});

// Ajouter une ville à la base de données
router.post('/add-city', async (req, res) => {
  const { cityName, latitude, longitude } = req.body;

  // Rechercher si la ville existe déjà par nom ou par coordonnées
  const searchQuery = 'SELECT * FROM cities WHERE name = ? OR (latitude = ? AND longitude = ?)';
  db.get(searchQuery, [cityName, latitude, longitude], function(err, row) {
    if (err) {
      return console.error(err.message);
    }
    // Si la ville n'existe pas, l'ajouter à la base de données
    if (!row) {
      const insert = 'INSERT INTO cities (name, latitude, longitude) VALUES (?, ?, ?)';
      db.run(insert, [cityName, latitude, longitude], function(insertErr) {
        if (insertErr) {
          return console.error(insertErr.message);
        }
        console.log(`A row has been inserted with rowid ${this.lastID}`);
        req.flash('success_msg', 'Ville ajoutée avec succès');
        res.redirect('/city');
      });
    } else {
      // Si la ville existe déjà afficher un message
      console.log('City already exists');
      req.flash('error_msg', 'La ville existe déjà');
      res.redirect('/city'); 
    }
  });
});


router.post('/delete-city', async (req, res) => {
  const { cityName, latitude, longitude } = req.body; // Récupérez le nom, la latitude et la longitude de la ville à supprimer

  // Requête SQL pour supprimer la ville
  const deleteQuery = 'DELETE FROM cities WHERE name = ? AND latitude = ? AND longitude = ?';

  db.run(deleteQuery, [cityName, latitude, longitude], function(err) {
    if (err) {
      return console.error(err.message);
    }
    console.log(`City ${cityName} at (${latitude}, ${longitude}) has been deleted`);
    res.redirect('/cities'); // Rediriger vers la liste des villes après la suppression
  });
});


router.get('/cities', async (req, res) => {
  db.all('SELECT * FROM cities', [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    res.render('cities', { cities: rows });
  });
});


router.post('/search-city', async (req, res) => {
  const searchTerm = req.body.searchTerm;
  const searchQuery = "SELECT * FROM cities WHERE name = ?";

  console.log("Recherche effectuée avec le terme : ", searchTerm); 

  db.all(searchQuery, [searchTerm], (err, rows) => {
    if (err) {
      console.error("Erreur lors de la recherche : ", err.message); 
      return res.status(500).send("Erreur lors de la recherche");
    }

    console.log("Résultats de la recherche : ", rows); 

    if (rows.length > 0) {
      res.render('cities', { cities: rows });
    } else {
      res.render('cities', { cities: [], noResults: true });
    }
  });
});

router.get('/city-weather/:id', async (req, res) => {
  const id = req.params.id;

  db.get('SELECT * FROM cities WHERE id = ?', [id], async (err, row) => {
    if (err) {
      console.error("Erreur DB: ", err.message);
      return res.status(500).send('Erreur serveur');
    }

    if (row) {
      try {
        const weatherData = await weatherApi.getWeatherForecast(row.latitude, row.longitude);

        const instantDetails = weatherData.properties.timeseries[0].data.instant.details;
        const nextHoursDetails = weatherData.properties.timeseries[0].data.next_6_hours.details;
        
        const symbolCode = weatherData.properties.timeseries[0].data.next_1_hours.summary.symbol_code;
          console.log("Code de symbole: ", symbolCode);
        const weatherTemplateData = {
          updated_at: weatherData.properties.meta.updated_at,
          instant: instantDetails,
          next_6_hours: nextHoursDetails
        };

        res.render('city-weather', {
          city: row,
          weather: weatherTemplateData,
          symbolCode: symbolCode
        });
      } catch (error) {
        console.error("Erreur API météo: ", error);
        res.status(500).send('Erreur lors de la récupération des données météo');
      }
    } else {
      res.status(404).send('Ville non trouvée');
    }
  });
});

router.get('/home', function(req, res) {
  res.redirect('/city');
});



module.exports = router;


