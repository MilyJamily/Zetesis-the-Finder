// --- 1. EFEITO DE LUPA NA GRADE (Canvas) ---
const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let mouse = { x: -1000, y: -1000 };

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

resize();

const gridSize = 40;
const radius = 130;
const maxDistortion = 25;

function drawGrid() {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(0, 255, 240, 0.12)';
    ctx.lineWidth = 1;

    // Linhas Verticais
    for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        for (let y = 0; y <= height; y += 10) {
            let dx = x - mouse.x;
            let dy = y - mouse.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            let newX = x;
            if (dist < radius) {
                let factor = Math.sin((dist / radius) * Math.PI / 2);
                let shift = (1 - factor) * maxDistortion;
                newX += dx > 0 ? shift : -shift;
            }

            if (y === 0) ctx.moveTo(newX, y);
            else ctx.lineTo(newX, y);
        }
        ctx.stroke();
    }

    // Linhas Horizontais
    for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        for (let x = 0; x <= width; x += 10) {
            let dx = x - mouse.x;
            let dy = y - mouse.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            let newY = y;
            if (dist < radius) {
                let factor = Math.sin((dist / radius) * Math.PI / 2);
                let shift = (1 - factor) * maxDistortion;
                newY += dy > 0 ? shift : -shift;
            }

            if (x === 0) ctx.moveTo(x, newY);
            else ctx.lineTo(x, newY);
        }
        ctx.stroke();
    }

    requestAnimationFrame(drawGrid);
}

drawGrid();

// Pesquisa e controle das telas
const searchScreen = document.getElementById('searchScreen');
const resltsSection = document.getElementById('resultsSection');
const closeBtn = document.getElementById('closeBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

function showResults() {
    const query = searchInput.value.trim();

    if (query === "") {
        searchInput.focus();
        return;
    }

    searchScreen.style.opacity = '0';
    searchScreen.style.pointerEvents = 'none';

    // Página de results
    resultsSection.classList.add('active');

    // Restuls page elements

    // Back to homepage
    closeBtn.focus();
}

function hideResults() {
    resultsSection.classList.remove('active');

    searchInput.value = '';

    setTimeout(function () {
        searchScreen.style.opacity = '1';
        searchScreen.style.pointerEvents = 'auto';
        searchInput.focus();
    }, 400);
}

// Clique na lupa
searchBtn.addEventListener('click', showResults);

// Enter
searchInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        showResults();
    }
});

// X Button
closeBtn.addEventListener('click', hideResults);

// Esc
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && resultsSection.classList.contains('active')) {
        hideResults();
    }
});