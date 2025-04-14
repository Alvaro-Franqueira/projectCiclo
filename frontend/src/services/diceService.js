import axios from './api';

// The base URL is already set in the api.js file as 'http://localhost:8080/api'
// So we need to use the path relative to that base URL
// Let's try with '/dados' as the API path since that might be what the backend is currently using
// (The server needs to be restarted to pick up the new controller mapping)
const API_URL = '/dados';

const diceService = {
    jugar: (betData) => {
        console.log('Sending dice bet to backend with params:', betData);

        if (!betData.usuarioId || betData.cantidad == null || !betData.tipo || !betData.valorApostado) {
            console.error('Missing required bet data fields:', betData);
            return Promise.reject(new Error('Missing required bet data fields'));
        }

        // Log the full URL being used
        const fullUrl = `${axios.defaults.baseURL}${API_URL}/jugar`;
        console.log('Full URL being called:', fullUrl);
        console.log('Request data:', JSON.stringify(betData));
        
        return axios.post(`${API_URL}/jugar`, betData)
            .then(response => {
                console.log('Backend response:', response.data); // Should be DiceGameResponseDTO

                // **Directly use the structured response**
                const gameResult = response.data;

                // Basic validation of the expected structure
                if (!gameResult || typeof gameResult !== 'object' ||
                    !Array.isArray(gameResult.diceResults) || gameResult.diceResults.length !== 2 ||
                    !gameResult.resolvedBet || typeof gameResult.resolvedBet !== 'object') {
                    console.error('Invalid response structure received from backend:', gameResult);
                    throw new Error('Invalid response structure from server.');
                }

                // The backend should now return a complete response with all necessary fields
                const resolvedBet = gameResult.resolvedBet;
                
                // Basic validation of important fields
                if (!resolvedBet.fechaApuesta) {
                    console.warn('Backend did not return fechaApuesta, adding default value.');
                    resolvedBet.fechaApuesta = new Date().toISOString();
                }
                
                // Check for user balance information
                if (resolvedBet.userBalance === undefined || resolvedBet.userBalance === null) {
                    console.error('Backend response DTO is missing user balance!', resolvedBet);
                    throw new Error('Backend response structure error: Cannot find user balance.');
                }

                console.log('Dice results:', gameResult.diceResults);
                console.log('Resolved bet:', resolvedBet);

                // Return the structured data
                return {
                    diceResults: gameResult.diceResults,
                    resolvedBet: resolvedBet // Already a clean DTO object
                };
            })
            .catch(error => {
                console.error('Error in dice service jugar:', error);
                // Log more specific backend error message if available
                if (error.response && error.response.data) {
                     console.error('Backend error message:', error.response.data);
                     // Rethrow with a potentially more informative message
                     if (typeof error.response.data === 'string') {
                         throw new Error(error.response.data);
                     } else if (error.response.data.message) {
                         throw new Error(error.response.data.message);
                     }
                }
                throw error; // Re-throw the original AxiosError
            });
    },

};

export default diceService;