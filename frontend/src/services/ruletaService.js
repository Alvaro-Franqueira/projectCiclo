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

            const { winningNumber = 0, resolvedBet } = response.data || {};
            const apuesta = sanitizeApuesta(resolvedBet || response.data);

            return { winningNumber, resolvedBet: apuesta };
        } catch (error) {
            const msg = error.response?.data?.message || 'Error al procesar la apuesta.';
            throw new Error(msg);
        }
    }
};

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
