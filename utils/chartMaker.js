const { createCanvas } = require('canvas');
const config = require('../config.json');

// format dataPoints: [{ label: "05-10", value: 14000 }, ...]
async function generateChart(dataPoints, currency = '') {
    const width = 800, height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#1A1A1D';
    ctx.fillRect(0, 0, width, height);
    if (!dataPoints || dataPoints.length === 0) return canvas.toBuffer();

    if (dataPoints.length === 1) dataPoints.push(dataPoints[0]);

    const padLeft = 80, padBottom = 40, padTop = 30, padRight = 30;
    const graphWidth = width - padLeft - padRight;
    const graphHeight = height - padTop - padBottom;

    let maxPrice = Math.max(...dataPoints.map(d => d.value));
    let minPrice = Math.min(...dataPoints.map(d => d.value));
    if (maxPrice === minPrice) { maxPrice *= 1.1; minPrice *= 0.9; }

    const rangeY = maxPrice - minPrice;
    const stepX = graphWidth / Math.max(1, dataPoints.length - 1);

    // Watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.watermark, padLeft + graphWidth / 2, padTop + graphHeight / 2);

    // Grid Garis & Sumbu Y (Harga)
    ctx.fillStyle = '#A0A0A0';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#2A2A2D';
    ctx.lineWidth = 1;

    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
        const yPos = padTop + (graphHeight / gridLines) * i;
        const priceVal = maxPrice - (rangeY / gridLines) * i;
        
        ctx.beginPath();
        ctx.moveTo(padLeft, yPos);
        ctx.lineTo(width - padRight, yPos);
        ctx.stroke();

        let labelVal = priceVal >= 1000 ? Math.round(priceVal) : priceVal.toFixed(2);
        ctx.fillText(`${currency}${labelVal}`, padLeft - 10, yPos);
    }

    const points = dataPoints.map((d, i) => ({
        x: padLeft + (i * stepX),
        y: height - padBottom - ((d.value - minPrice) / rangeY) * graphHeight
    }));

    // Sumbu X (Tanggal/Label)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    points.forEach((p, i) => {
        // Tampilkan label secukupnya agar tidak numpuk
        if (dataPoints.length <= 15 || i % Math.ceil(dataPoints.length / 10) === 0 || i === points.length - 1) {
            ctx.fillText(dataPoints[i].label, p.x, height - padBottom + 10);
        }
    });

    // Gradient & Garis Utama
    const gradient = ctx.createLinearGradient(0, padTop, 0, height - padBottom);
    gradient.addColorStop(0, 'rgba(74, 222, 128, 0.5)');
    gradient.addColorStop(1, 'rgba(74, 222, 128, 0.0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padBottom);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, height - padBottom);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 3;
    ctx.stroke();

    return canvas.toBuffer();
}

module.exports = { generateChart };