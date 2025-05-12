import axios from './api';

const API_URL = '/games/roulette';

const rouletteService = {
    play: async (betData) => {
        try {
            const params = new URLSearchParams();
            params.append('userId', betData.userId);
            params.append('amount', betData.amount);
            params.append('betType', betData.betType);
            params.append('betValue', betData.betValue);

            const response = await axios.post(`${API_URL}/play`, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const { winningNumber, resolvedBet } = response.data || {};
            const bet = sanitizeBet(resolvedBet || response.data);

            return { winningNumber, resolvedBet: bet };
        } catch (error) {
            const msg = error.response?.data?.message || 'Error processing the bet.';
            throw new Error(msg);
        }
    },


    playMultibet: async (betsArray) => {
    // Input: Array of { userId, amount, betType, betValue }
    if (!Array.isArray(betsArray) || betsArray.length === 0) {
         throw new Error("An array of bets is required for play-multibet.");
    }

    // Basic validation for each bet object in the array
    for (const bet of betsArray) {
        if (bet.userId == null || bet.amount == null || !bet.betType || bet.betValue == null) {
            console.error("Invalid bet object in multi-bet array:", bet);
            throw new Error('Required data is missing in one or more multiple bets.');
        }
    }

    try {
        console.log("Calling /play-multibet with JSON payload:", betsArray);

        // Backend endpoint is /play-multibet and expects JSON array
        const response = await axios.post(`${API_URL}/play-multibet`, betsArray, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log("Response from /play-multibet:", response.data);

        // Backend returns: List<RouletteResponse>, where RouletteResponse is { winningNumber, resolvedBet: BetDTO }
        // All items in the list will have the SAME winningNumber.
        if (!Array.isArray(response.data) || response.data.length === 0) {
             throw new Error("Invalid server response from /play-multibet. An array was expected.");
        }

        const resultsList = response.data;
        const winningNumber = resultsList[0].winningNumber; // Get winning number from the first item

        let totalWinLoss = 0;
        const resolvedBets = [];

        for (const resultItem of resultsList) {
             if (resultItem.resolvedBet) {
                 const sanitizedBet = sanitizeBet(resultItem.resolvedBet);
                 resolvedBets.push(sanitizedBet);
                 totalWinLoss += sanitizedBet.winloss; // Accumulate win/loss
             } else {
                 console.warn("Item in multi-bet response did not contain 'resolvedBet':", resultItem);
             }
        }

         // Return a structure similar to the single bet, but with aggregated results
        return {
            winningNumber: winningNumber,
            resolvedBets: resolvedBets, // Return array of sanitized results
            totalWinLoss: totalWinLoss   // Return the calculated total win/loss
        };

    } catch (error) {
        console.error("Error in rouletteService.playMultibet:", error);
        const msg = error.response?.data?.message || error.response?.data || error.message || 'Error processing multiple bets.';
        throw new Error(msg);
    }
}}
// --- Utils ---

function sanitizeBet(bet) {
    if (!bet) {
        return {
            id: 0, amount: 0, betDate: new Date().toISOString(),
            status: 'UNKNOWN', winloss: 0, type: '', betValue: '',
            amountWon: 0, currentBalance: 0, user: null
        };
    }

    const amount = parseFloat(bet.amount ?? 0);
    const winloss = parseFloat(bet.winloss ?? 0);
    const user = bet.user ? {
        id: bet.user.id ?? 0,
        username: bet.user.username ?? '',
        balance: parseFloat(bet.user.balance ?? 0)
    } : null;

    return {
        id: bet.id ?? 0,
        amount,
        betDate: bet.betDate ?? new Date().toISOString(),
        status: bet.status ?? 'UNKNOWN',
        winloss,
        type: bet.betType ?? bet.type ?? '',
        betValue: bet.betValue ?? '',
        winningValue: bet.winningValue ?? '',
        amountWon: winloss > 0 ? winloss : 0,
        currentBalance: user?.balance ?? bet.userBalance ?? 0,
        user
    };
}

export default rouletteService;
