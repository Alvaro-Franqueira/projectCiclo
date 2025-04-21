import axios from './api';

const API_URL = '/juegos/ruleta';

const ruletaService = {
    jugar: async (betData) => {
        try {
            const params = new URLSearchParams();
            params.append('usuarioId', betData.usuarioId);
            params.append('cantidad', betData.cantidad);
            params.append('tipoApuesta', betData.tipoApuesta);
            params.append('valorApuesta', betData.valorApuesta);

            const response = await axios.post(`${API_URL}/jugar`, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const { winningNumber, resolvedBet } = response.data || {};
            const apuesta = sanitizeApuesta(resolvedBet || response.data);

            return { winningNumber, resolvedBet: apuesta };
        } catch (error) {
            const msg = error.response?.data?.message || 'Error al procesar la apuesta.';
            throw new Error(msg);
        }
    },


    jugarMultibet: async (betsArray) => {
    // Input: Array of { usuarioId, cantidad, tipoApuesta, valorApuesta }
    if (!Array.isArray(betsArray) || betsArray.length === 0) {
         throw new Error("Se requiere un array de apuestas para jugar-multibet.");
    }

    // Basic validation for each bet object in the array
    for (const bet of betsArray) {
        if (bet.usuarioId == null || bet.cantidad == null || !bet.tipoApuesta || bet.valorApuesta == null) {
            console.error("Invalid bet object in multi-bet array:", bet);
            throw new Error('Faltan datos requeridos en una o más apuestas múltiples.');
        }
    }

    try {
        console.log("Calling /jugar/multi with JSON payload:", betsArray);

        // Backend endpoint is /jugar/multi and expects JSON array
        const response = await axios.post(`${API_URL}/jugar/multi`, betsArray, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log("Response from /jugar/multi:", response.data);

        // Backend returns: List<RuletaResponse>, where RuletaResponse is { winningNumber, resolvedBet: ApuestaDTO }
        // All items in the list will have the SAME winningNumber.
        if (!Array.isArray(response.data) || response.data.length === 0) {
             throw new Error("Respuesta inválida del servidor en /jugar/multi. Se esperaba un array.");
        }

        const resultsList = response.data;
        const winningNumber = resultsList[0].winningNumber; // Get winning number from the first item

        let totalWinLoss = 0;
        const resolvedBets = [];

        for (const resultItem of resultsList) {
             if (resultItem.resolvedBet) {
                 const sanitizedBet = sanitizeApuesta(resultItem.resolvedBet);
                 resolvedBets.push(sanitizedBet);
                 totalWinLoss += sanitizedBet.winloss; // Accumulate win/loss
             } else {
                 console.warn("Item en la respuesta de multi-bet no contenía 'resolvedBet':", resultItem);
             }
        }

         // Return a structure similar to the single bet, but with aggregated results
        return {
            winningNumber: winningNumber,
            resolvedBets: resolvedBets, // Return array of sanitized results
            totalWinLoss: totalWinLoss   // Return the calculated total win/loss
        };

    } catch (error) {
        console.error("Error in ruletaService.jugarMultibet:", error);
        const msg = error.response?.data?.message || error.response?.data || error.message || 'Error al procesar las apuestas múltiples.';
        throw new Error(msg);
    }
}}
// --- Utils ---

function sanitizeApuesta(apuesta) {
    if (!apuesta) {
        return {
            id: 0, cantidad: 0, fechaApuesta: new Date().toISOString(),
            estado: 'DESCONOCIDO', winloss: 0, tipo: '', valorApostado: '',
            cantidadGanada: 0, saldoActual: 0, usuario: null
        };
    }

    const cantidad = parseFloat(apuesta.cantidad ?? 0);
    const winloss = parseFloat(apuesta.winloss ?? 0);
    const usuario = apuesta.usuario ? {
        id: apuesta.usuario.id ?? 0,
        username: apuesta.usuario.username ?? '',
        balance: parseFloat(apuesta.usuario.balance ?? 0)
    } : null;

    return {
        id: apuesta.id ?? 0,
        cantidad,
        fechaApuesta: apuesta.fechaApuesta ?? new Date().toISOString(),
        estado: apuesta.estado ?? 'DESCONOCIDO',
        winloss,
        tipo: apuesta.tipo ?? '',
        valorApostado: apuesta.valorApostado ?? '',
        cantidadGanada: winloss > 0 ? winloss : 0,
        saldoActual: usuario?.balance ?? 0,
        usuario
    };
}

export default ruletaService;
