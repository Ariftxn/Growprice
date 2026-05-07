const { createCanvas } = require('canvas');

function drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

async function renderCrashGame(userTag, betAmount, currency, multiplier, payout) {
    const width = 800, height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0B0D10';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1E2128';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ SCALPER MARKET CRASH ⚡', width / 2, 60);

    const isWin = multiplier >= 1.0;
    const themeColor = isWin ? '#4ade80' : '#f87171'; 
    const statusText = isWin ? 'MARKET PUMPED AT' : 'MARKET CRASHED AT';

    ctx.fillStyle = '#A0A0A0';
    ctx.font = '20px sans-serif';
    ctx.fillText(statusText, width / 2, height / 2 - 60);

    ctx.fillStyle = themeColor;
    ctx.font = 'bold 110px sans-serif';
    ctx.fillText(`${multiplier.toFixed(2)}x`, width / 2, height / 2 + 30);

    ctx.fillStyle = '#1A1C23';
    drawRoundRect(ctx, 40, height - 100, width - 80, 70, 15);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`👤 ${userTag}`, 70, height - 58);

    ctx.textAlign = 'center';
    ctx.fillText(`💰 Bet: ${betAmount} ${currency.toUpperCase()}`, width / 2, height - 58);

    ctx.textAlign = 'right';
    ctx.fillStyle = themeColor;
    const resultText = isWin 
        ? `+${(payout - betAmount).toFixed(2)} ${currency.toUpperCase()} Profit` 
        : `-${betAmount} ${currency.toUpperCase()} Loss`;
    ctx.fillText(resultText, width - 70, height - 58);

    return canvas.toBuffer();
}

module.exports = { renderCrashGame };