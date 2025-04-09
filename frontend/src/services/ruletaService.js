import axios from './api'; // Use the configured axios instance

const API_URL = '/juegos/ruleta'; // Base path for roulette API

// Service functions for the Roulette game
const ruletaService = {
    /**
     * Calls the backend to place a bet and process it based on a frontend-generated winning number.
     * Assumes backend endpoint is POST /api/juegos/ruleta/jugar
     *
     * @param {object} betData - { usuarioId, cantidad, tipo, valorApostado, numeroGanador }
     * @returns {Promise<object>} - Promise resolving to { winningNumber (echoed from backend), resolvedBet (processed bet details) }
     */
    jugar: (betData) => {
        // Log the bet data being sent, now including the winning number
        console.log('Sending bet to backend with params (including numeroGanador):', betData);

        // Ensure numeroGanador is provided
        if (betData.numeroGanador === undefined || betData.numeroGanador === null) {
             console.error('Error: numeroGanador is missing in betData for ruletaService.jugar');
             return Promise.reject(new Error('El número ganador generado en el frontend no fue proporcionado al servicio.'));
        }

        // Backend expects request parameters, not a JSON body
        const params = new URLSearchParams();
        params.append('usuarioId', betData.usuarioId);
        params.append('cantidad', betData.cantidad);
        params.append('tipoApuesta', betData.tipo); // Match backend @RequestParam name
        params.append('valorApuesta', betData.valorApostado); // Match backend @RequestParam name
        params.append('numeroGanador', betData.numeroGanador); // *** ADDED WINNING NUMBER ***

        return axios.post(`${API_URL}/jugar`, params, { // Assumes axios instance has baseURL '/api' or similar
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(response => {
            // Log the raw response for debugging
            console.log('Raw backend response:', response.data);

            // Expecting a structured response from the backend, like:
            // { winningNumber: (the number used, should match numeroGanador sent), resolvedBet: { ...bet details... } }
            if (response.data && typeof response.data === 'object' && response.data.resolvedBet) {
                console.log('Backend processed bet successfully with winning number:', response.data.winningNumber);

                // Sanitize the received resolvedBet object if necessary (e.g., handle circular refs)
                const sanitizedBet = sanitizeApuesta(response.data.resolvedBet);

                return {
                    winningNumber: response.data.winningNumber, // Use the number confirmed by the backend
                    resolvedBet: sanitizedBet
                };
            } else {
                // If the response is not in the expected format
                console.warn('Backend response not in expected format { winningNumber, resolvedBet }:', response.data);

                // Optional: Try fallback parsing ONLY if backend might send inconsistent formats
                // but avoid determining the winning number here.
                let fallbackBet = {};
                if (typeof response.data === 'string') {
                     try {
                         fallbackBet = extractApuestaFromString(response.data);
                     } catch (e) {
                         console.error("Fallback string parsing failed:", e);
                     }
                } else if (typeof response.data === 'object') {
                     fallbackBet = response.data; // Maybe it's just the ApuestaDTO without the wrapper
                }

                const sanitizedFallback = sanitizeApuesta(fallbackBet);

                 // Return the number we *sent* and the potentially incomplete/sanitized bet data
                 // This indicates a potential issue with the backend response structure.
                 return {
                     winningNumber: betData.numeroGanador, // Use the number we sent as winningNumber wasn't returned
                     resolvedBet: sanitizedFallback
                 };

                // Or simply throw an error if strict format is required:
                // throw new Error('Respuesta inesperada del backend al procesar la apuesta.');
            }
        }).catch(error => {
            console.error('Error in ruletaService.jugar API call:', error);
            // Log detailed error info if available
            if (error.response) {
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
                // Propagate a more specific error message if possible
                throw new Error(error.response.data?.message || error.response.data || `Error ${error.response.status}`);
            } else if (error.request) {
                console.error('Error request:', error.request);
                throw new Error('No se recibió respuesta del servidor.');
            } else {
                console.error('Error message:', error.message);
                throw error; // Re-throw original error
            }
        });
    }
    // Add other roulette-related API calls if needed (e.g., get history, game info)
};


// --- Helper Functions ---
// These might still be useful for handling potentially inconsistent backend responses,
// but they are NO LONGER used to determine the winning number itself.

/**
 * Extracts the important parts of an apuesta from a string representation.
 * Useful ONLY as a fallback if the backend sends a malformed string instead of JSON.
 * @param {string} dataString - The string representation of the apuesta
 * @returns {object} - A simplified apuesta object
 */
function extractApuestaFromString(dataString) {
    // (Implementation remains the same as provided before)
     const apuesta = { id: 0, cantidad: 0, fechaApuesta: new Date().toISOString(), estado: 'PERDIDA', winloss: 0, tipo: '', valorApostado: '', usuario: { id: 0, username: '', balance: 0 } };
     try {
         console.log('Attempting fallback extraction from string...');
         const truncatedString = dataString.substring(0, 1000); // Limit length
         const idMatch = truncatedString.match(/"id"\s*:\s*(\d+)/); if (idMatch) apuesta.id = parseInt(idMatch[1]);
         const cantidadMatch = truncatedString.match(/"cantidad"\s*:\s*(\d+\.?\d*)/); if (cantidadMatch) apuesta.cantidad = parseFloat(cantidadMatch[1]);
         const fechaMatch = truncatedString.match(/"fechaApuesta"\s*:\s*"([^"]+)"/); if (fechaMatch) apuesta.fechaApuesta = fechaMatch[1];
         const estadoMatch = truncatedString.match(/"estado"\s*:\s*"([^"]+)"/); if (estadoMatch) apuesta.estado = estadoMatch[1];
         const winlossMatch = truncatedString.match(/"winloss"\s*:\s*(-?\d+\.?\d*)/); if (winlossMatch) apuesta.winloss = parseFloat(winlossMatch[1]);
         const tipoMatch = truncatedString.match(/"tipo"\s*:\s*"([^"]+)"/); if (tipoMatch) apuesta.tipo = tipoMatch[1];
         const valorMatch = truncatedString.match(/"valorApostado"\s*:\s*"([^"]+)"/); if (valorMatch) apuesta.valorApostado = valorMatch[1];
         const userIdMatch = truncatedString.match(/"usuario"\s*:\s*\{\s*"id"\s*:\s*(\d+)/); if (userIdMatch) apuesta.usuario.id = parseInt(userIdMatch[1]);
         const usernameMatch = truncatedString.match(/"username"\s*:\s*"([^"]+)"/); if (usernameMatch) apuesta.usuario.username = usernameMatch[1];
         const balanceMatch = truncatedString.match(/"balance"\s*:\s*(\d+\.?\d*)/); if (balanceMatch) apuesta.usuario.balance = parseFloat(balanceMatch[1]);
         console.log('Fallback extraction result:', apuesta);
     } catch (e) { console.error('Error during fallback string extraction:', e); }
     return apuesta;
}

/**
 * Sanitizes an apuesta object, cleaning potential issues like circular references
 * or missing properties from the backend response.
 * @param {object} apuesta - The raw apuesta object from the backend response
 * @returns {object} - A sanitized, safe-to-use apuesta object
 */
function sanitizeApuesta(apuesta) {
    // (Implementation remains the same as provided before)
    if (!apuesta) return { id: 0, cantidad: 0, fechaApuesta: new Date().toISOString(), estado: 'DESCONOCIDO', winloss: 0, tipo: '', valorApostado: '', cantidadGanada: 0, saldoActual: 0, usuario: null };
    const sanitized = {
        id: apuesta.id ?? 0,
        cantidad: typeof apuesta.cantidad === 'number' ? apuesta.cantidad : parseFloat(apuesta.cantidad ?? 0),
        fechaApuesta: apuesta.fechaApuesta ?? new Date().toISOString(),
        estado: apuesta.estado ?? 'DESCONOCIDO',
        winloss: typeof apuesta.winloss === 'number' ? apuesta.winloss : parseFloat(apuesta.winloss ?? 0),
        tipo: apuesta.tipo ?? '',
        valorApostado: apuesta.valorApostado ?? '',
        cantidadGanada: 0, // Recalculate based on winloss
        saldoActual: 0 // Will be updated from usuario if present
    };
    sanitized.cantidadGanada = sanitized.winloss > 0 ? sanitized.winloss : 0;

    if (apuesta.usuario && typeof apuesta.usuario === 'object') {
        try {
            sanitized.usuario = {
                id: apuesta.usuario.id ?? 0,
                username: apuesta.usuario.username ?? '',
                balance: typeof apuesta.usuario.balance === 'number' ? apuesta.usuario.balance : parseFloat(apuesta.usuario.balance ?? 0)
            };
            sanitized.saldoActual = sanitized.usuario.balance;
        } catch (e) {
            console.warn('Error sanitizing usuario properties:', e);
            sanitized.usuario = { id: 0, username: '', balance: 0 };
            sanitized.saldoActual = 0; // Unknown balance
        }
    } else {
        sanitized.usuario = null;
        sanitized.saldoActual = 0; // Unknown balance
    }
    return sanitized;
}


/* // --- REMOVED/COMMENTED OUT ---
// These functions are no longer needed as the winning number is generated 
// in the frontend component *before* calling the service.

function determineWinningNumber(apuesta, originalBet) {
    // ... (implementation removed) ...
    console.warn("determineWinningNumber should no longer be called.");
    return Math.floor(Math.random() * 37); // Fallback if called unexpectedly
}

function getPossibleWinningNumbers(apuesta, originalBet) {
    // ... (implementation removed) ...
    console.warn("getPossibleWinningNumbers should no longer be called.");
    return [...Array(37).keys()]; // Fallback if called unexpectedly
}
*/

export default ruletaService;