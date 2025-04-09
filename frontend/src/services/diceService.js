import axios from './api'; // Use the configured axios instance (api.js)

const API_URL = '/dados'; // Base URL for dice endpoints (proxied by vite/webpack)

// Service functions for the Dice game
const diceService = {
    /**
     * Calls the backend to place a bet and play a round of Dice.
     * @param {object} betData - { usuarioId, juegoId, cantidad, tipo, valorApostado }
     * @returns {Promise<object>} - Promise resolving to { diceResults: [num1, num2], resolvedBet: Apuesta }
     */
    jugar: (betData) => {
        console.log('Sending dice bet to backend with params:', betData);
        
        // Ensure all required fields are present
        if (!betData.usuarioId || !betData.juegoId || !betData.cantidad || !betData.tipo || !betData.valorApostado) {
            console.error('Missing required bet data fields:', betData);
            return Promise.reject(new Error('Missing required bet data fields'));
        }
        
        return axios.post(`${API_URL}/jugar`, betData)
            .then(response => {
                console.log('Raw dice backend response:', response.data);
                
                // Handle the response data, which might be a string or an object with circular references
                let apuesta;
                let diceResults = [];
                
                try {
                    // First, try to directly use the response data if it's an object
                    if (typeof response.data === 'object') {
                        console.log('Response is an object, attempting to use directly');
                        
                        // Extract dice results and apuesta from response
                        if (response.data.diceResults) {
                            diceResults = response.data.diceResults;
                        }
                        
                        if (response.data.resolvedBet) {
                            apuesta = response.data.resolvedBet;
                        } else {
                            apuesta = response.data;
                        }
                    } 
                    // If it's a string, try to parse it
                    else if (typeof response.data === 'string') {
                        try {
                            // Try to parse it as JSON
                            const parsedData = JSON.parse(response.data);
                            console.log('Successfully parsed response as JSON');
                            
                            // Extract dice results and apuesta from parsed data
                            if (parsedData.diceResults) {
                                diceResults = parsedData.diceResults;
                            }
                            
                            if (parsedData.resolvedBet) {
                                apuesta = parsedData.resolvedBet;
                            } else {
                                apuesta = parsedData;
                            }
                        } catch (parseError) {
                            console.warn('Error parsing response data as JSON:', parseError);
                            // If parsing fails, extract data using regex
                            console.log('Attempting to extract data from string using regex');
                            const extractedData = diceService.extractDataFromString(response.data);
                            apuesta = extractedData.apuesta;
                            diceResults = extractedData.diceResults;
                        }
                    } else {
                        throw new Error(`Unexpected response type: ${typeof response.data}`);
                    }
                    
                    // Validate that we have a proper apuesta object
                    if (!apuesta || typeof apuesta !== 'object') {
                        throw new Error('Failed to extract a valid apuesta object from response');
                    }
                    
                    // Sanitize the apuesta to remove circular references
                    const sanitizedApuesta = diceService.sanitizeApuesta(apuesta);
                    
                    // Log the final result for debugging
                    console.log('Dice results:', diceResults);
                    console.log('Sanitized apuesta:', sanitizedApuesta);
                    
                    // Ensure the bet is properly formatted for the frontend
                    if (!sanitizedApuesta.id) {
                        console.warn('Bet ID is missing from response, this may cause issues with history tracking');
                    }
                    
                    // Ensure the bet has a fechaApuesta (date) field
                    if (!sanitizedApuesta.fechaApuesta) {
                        sanitizedApuesta.fechaApuesta = new Date().toISOString();
                        console.warn('Added missing fechaApuesta field to bet');
                    }
                    
                    // Ensure the bet has a juegoId field (for filtering in history)
                    if (!sanitizedApuesta.juegoId && betData.juegoId) {
                        sanitizedApuesta.juegoId = betData.juegoId;
                        console.warn('Added missing juegoId field to bet');
                    }
                    
                    return {
                        diceResults: diceResults,
                        resolvedBet: sanitizedApuesta
                    };
                } catch (error) {
                    console.error('Error processing dice game response:', error);
                    throw error;
                }
            })
            .catch(error => {
                console.error('Error in dice service jugar:', error);
                throw error;
            });
    },
    
    /**
     * Extracts the important parts of data from a string representation
     * This is used when JSON.parse fails due to circular references
     * 
     * @param {string} dataString - The string representation of the response
     * @returns {object} - { apuesta, diceResults }
     */
    extractDataFromString: (dataString) => {
        console.log('Extracting dice data from string using regex');
        
        // Initialize empty objects
        const apuesta = {};
        let diceResults = [];
        
        try {
            // Extract apuesta properties
            const idMatch = dataString.match(/"id":(\d+)/);
            if (idMatch) apuesta.id = parseInt(idMatch[1]);
            
            const cantidadMatch = dataString.match(/"cantidad":(\d+\.?\d*)/);
            if (cantidadMatch) apuesta.cantidad = parseFloat(cantidadMatch[1]);
            
            const fechaMatch = dataString.match(/"fechaApuesta":"([^"]+)"/);
            if (fechaMatch) apuesta.fechaApuesta = fechaMatch[1];
            
            const estadoMatch = dataString.match(/"estado":"([^"]+)"/);
            if (estadoMatch) apuesta.estado = estadoMatch[1];
            
            const winlossMatch = dataString.match(/"winloss":([-]?\d+\.?\d*)/);
            if (winlossMatch) apuesta.winloss = parseFloat(winlossMatch[1]);
            
            const tipoMatch = dataString.match(/"tipo":"([^"]+)"/);
            if (tipoMatch) apuesta.tipo = tipoMatch[1];
            
            const valorApostadoMatch = dataString.match(/"valorApostado":"([^"]+)"/);
            if (valorApostadoMatch) apuesta.valorApostado = valorApostadoMatch[1];
            
            // Extract user ID and balance
            const usuarioIdMatch = dataString.match(/"usuario":\s*\{\s*"id":(\d+)/);
            if (usuarioIdMatch) {
                apuesta.usuario = { id: parseInt(usuarioIdMatch[1]) };
                
                const usernameMatch = dataString.match(/"username":"([^"]+)"/);
                if (usernameMatch) apuesta.usuario.username = usernameMatch[1];
                
                const balanceMatch = dataString.match(/"balance":(\d+\.?\d*)/);
                if (balanceMatch) apuesta.usuario.balance = parseFloat(balanceMatch[1]);
            }
            
            // Extract dice results
            const diceResultsMatch = dataString.match(/"diceResults":\s*\[\s*(\d+)\s*,\s*(\d+)\s*\]/);
            if (diceResultsMatch) {
                diceResults = [parseInt(diceResultsMatch[1]), parseInt(diceResultsMatch[2])];
            }
            
            console.log('Extracted apuesta:', apuesta);
            console.log('Extracted dice results:', diceResults);
            
            return { apuesta, diceResults };
        } catch (error) {
            console.error('Error extracting dice data from string:', error);
            return { apuesta: {}, diceResults: [] };
        }
    },
    
    /**
     * Sanitizes an apuesta object to remove circular references
     * 
     * @param {object} apuesta - The apuesta object to sanitize
     * @returns {object} - A sanitized apuesta object
     */
    sanitizeApuesta: (apuesta) => {
        if (!apuesta || typeof apuesta !== 'object') {
            return apuesta;
        }
        
        const sanitized = {};
        
        // Copy only the essential properties
        if (apuesta.id !== undefined) sanitized.id = apuesta.id;
        if (apuesta.cantidad !== undefined) sanitized.cantidad = apuesta.cantidad;
        if (apuesta.fechaApuesta !== undefined) sanitized.fechaApuesta = apuesta.fechaApuesta;
        if (apuesta.estado !== undefined) sanitized.estado = apuesta.estado;
        if (apuesta.winloss !== undefined) sanitized.winloss = apuesta.winloss;
        if (apuesta.tipo !== undefined) sanitized.tipo = apuesta.tipo;
        if (apuesta.valorApostado !== undefined) sanitized.valorApostado = apuesta.valorApostado;
        
        // Sanitize usuario if it exists
        if (apuesta.usuario && typeof apuesta.usuario === 'object') {
            sanitized.usuario = {
                id: apuesta.usuario.id,
                username: apuesta.usuario.username,
                balance: apuesta.usuario.balance
            };
        }
        
        return sanitized;
    }
    // Add other dice-related API calls if needed in the future
};

export default diceService;
