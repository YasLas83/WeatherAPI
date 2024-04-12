// weatherApi.js
const axios = require('axios');

async function getWeatherForecast(lat, lon) {
  try {
    const response = await axios.get(`https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${lat}&lon=${lon}`, {
      headers: {
        'User-Agent': 'VotreNomApplication / votre.email@example.com'
      }
    });

    console.log(response.data); // Afficher les données brutes de l'API dans la console

    return response.data; // Renvoyer directement les données JSON
  } catch (error) {
    console.error('Erreur lors de la récupération des prévisions météo:', error);
    throw error; // Propager l'erreur pour la gérer plus loin dans l'appelant
  }
}

module.exports = {
  getWeatherForecast
};
