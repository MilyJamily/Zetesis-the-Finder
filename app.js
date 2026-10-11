const button = document.querySelector('button');
const results = document.querySelector('#results');
const input = document.querySelector('input');

// Typewriter effect function
function typeWriter(element, text, speed = 55) {
    let i = 0;
    element.innerHTML = "";
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

button.addEventListener('click', async function() {
    const termInvestigating = input.value.trim();

    if (termInvestigating === '') {
        results.innerHTML = `<p>[ ERROR: SEARCH TERM CANNOT BE EMPTY ]</p>`;
        return;
    }

    results.innerHTML = `
        <h3>[ TARGET: ${termInvestigating} ]</h3>
        <p>Status: Connecting to Wikidata database...</p>
    `;

    try {
        const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(termInvestigating)}&language=en&format=json&origin=*`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (searchData.search && searchData.search.length > 0) {
            const primeiroAlvo = searchData.search[0];
            const entityLabel = primeiroAlvo.label;
            const entityId = primeiroAlvo.id;
            const entityDesc = primeiroAlvo.description || 'No description available.';

            let imageUrl = '';
            let wikiUrl = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(entityLabel)}`;

            try {
                const wikiSummaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(entityLabel)}`;
                const wikiResponse = await fetch(wikiSummaryUrl);
                if (wikiResponse.ok) {
                    const wikiData = await wikiResponse.json();
                    if (wikiData.thumbnail && wikiData.thumbnail.source) {
                        imageUrl = wikiData.thumbnail.source;
                    }
                    if (wikiData.content_urls && wikiData.content_urls.desktop) {
                        wikiUrl = wikiData.content_urls.desktop.page;
                    }
                }
            } catch (wikiError) {
                console.log("Fallback to basic info.");
            }

            results.innerHTML = `
                <div class="dossier-layout">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${entityLabel}" class="dossier-img">` : ''}
                    <div class="dossier-info">
                        <h3>[ TARGET FOUND: ${entityLabel.toUpperCase()} ]</h3>
                        <p><strong>Wikidata ID:</strong> ${entityId}</p>
                        <p><strong>Description:</strong> <span id="typed-desc"></span></p>
                        <p><strong>Status:</strong> File decrypted successfully.</p>
                        <p><a href="${wikiUrl}" target="_blank" style="color: aquamarine; text-decoration: underline;">[ ACCESS FULL WIKI ARCHIVE ]</a></p>
                    </div>
                </div>
            `;

            const descElement = document.getElementById('typed-desc');
            if (descElement) {
                typeWriter(descElement, entityDesc, 20);
            }

        } else {
            results.innerHTML = `
                <h3>[ TARGET: ${termInvestigating.toUpperCase()} ]</h3>
                <p>Status: No records found in the database.</p>
            `;
        }

    } catch (error) {
        results.innerHTML = `
            <p>[ ERROR: CONNECTION FAILED TO DATABASE ]</p>
        `;
        console.error(error);
    }
});

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

// initialize canvas size
resize();

const gridSize = 40;
const radius = 120; // Magnifying effect
const maxDistortion = 25; // Força do efeito de lente

function drawGrid() {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "rgb(0, 255, 240, 0.12)";
    ctx.lineWidth = 1;

    // Vertical Lines
    for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        for (let y = 0; y <= height; y += 10) {
            let dx = x - mouse.x;
            let dy = y - mouse.y;
            let dist = Math.sqrt(dx * dy * dy);

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

    // Horizontal Lines
    for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        for (let x = 0; x <= width; x += 10) {
            let dx = x - mouse.x;
            let dy = y - mouse.y;
            let dist = Math.sqrt(dx * dx + dy * dy)

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
