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

// --- 2. EFEITO TYPEWRITER ---
const typewriterTimeouts = [];

function clearAllTypewriters() {
    typewriterTimeouts.forEach(t => clearTimeout(t));
    typewriterTimeouts.length = 0;
}

function typeWriter(element, text, speed = 15, callback = null) {
    if (!element) return;
    element.textContent = '';
    let i = 0;

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            const t = setTimeout(type, speed);
            typewriterTimeouts.push(t);
        } else if (callback) {
            callback();
        }
    }
    type();
}

// --- 3. CONTROLE DE INTERFACE ---
const searchScreen = document.getElementById('searchScreen');
const resultsSection = document.getElementById('resultsSection');
const closeBtn = document.getElementById('closeBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

const moreBtn = document.getElementById('moreBtn');
const lessBtn = document.getElementById('lessBtn');

const statusCard = document.getElementById('statusCard');
const imagesCard = document.getElementById('imagesCard');
const detailsCard = document.getElementById('detailsCard');
const filesCard = document.getElementById('filesCard');
const detailTabs = document.querySelectorAll('.details-tab');
const detailPanels = document.querySelectorAll('.details-panel');

const statusText = document.getElementById('statusText');
const loadingProgress = document.getElementById('loadingProgress');
const loadingPercentage = document.getElementById('loadingPercentage');

let loadingAnimationId = null;
let loadingStartTime = null;
const loadingDuration = 1500; 
let wikiDataCache = null;

function startLoading() {
    if (loadingAnimationId !== null) {
        cancelAnimationFrame(loadingAnimationId);
    }

    loadingStartTime = null;
    loadingProgress.style.width = '0%';
    loadingPercentage.textContent = '0%';
    statusText.textContent = 'Loading...';
    
    statusCard.classList.add('is-visible');

    function updateLoading(currentTime) {
        if (loadingStartTime === null) {
            loadingStartTime = currentTime;
        }

        const elapsedTime = currentTime - loadingStartTime;
        const progress = Math.min(elapsedTime / loadingDuration, 1);
        const percentage = Math.floor(progress * 100);

        loadingProgress.style.width = `${percentage}%`;
        loadingPercentage.textContent = `${percentage}%`;

        if (progress < 1) {
            loadingAnimationId = requestAnimationFrame(updateLoading);
        } else {
            loadingProgress.style.width = '100%';
            loadingPercentage.textContent = '100%';
            statusText.textContent = 'Complete';
            loadingAnimationId = null;

            imagesCard.classList.add('is-visible');

            setTimeout(() => {
                detailsCard.classList.add('is-visible');
            }, 300);
        }
    }

    loadingAnimationId = requestAnimationFrame(updateLoading);
}

function resetLoading() {
    if (loadingAnimationId !== null) {
        cancelAnimationFrame(loadingAnimationId);
        loadingAnimationId = null;
    }

    loadingStartTime = null;
    loadingProgress.style.width = '0%';
    loadingPercentage.textContent = '0%';
    statusText.textContent = 'Loading...';

    imagesCard.classList.remove('is-visible');
    detailsCard.classList.remove('is-visible');
    statusCard.classList.remove('is-visible');
    filesCard.classList.remove('is-visible');
    
    clearVisualData();
}

function clearVisualData() {
    clearAllTypewriters();
    wikiDataCache = null;
    
    document.querySelector('.profile-info h2').textContent = 'Name';
    document.querySelector('.profile-info p').textContent = 'Occupation';
    document.querySelector('.main-description').textContent = 'Short description about the search';
    document.querySelector('.profile-photo').innerHTML = 'PHOTO';
    
    document.getElementById('overviewText').textContent = '';
    document.querySelector('.facts-list').innerHTML = '';
    document.querySelector('.timeline-panel').innerHTML = '';

    document.querySelector('.landscape-item').innerHTML = '<span>Landscape</span>';
    document.querySelectorAll('.portrait-item').forEach((el, idx) => el.innerHTML = `<span>Portrait ${idx + 1}</span>`);
    document.querySelectorAll('.small-item').forEach((el, idx) => el.innerHTML = `<span>Small ${idx + 1}</span>`);
}

function showResults() {
    const query = searchInput.value.trim();

    if (query === "") {
        searchInput.focus();
        return;
    }

    searchScreen.style.opacity = '0';
    searchScreen.style.pointerEvents = 'none';

    resultsSection.classList.add('active');

    clearVisualData();
    fetchWikipediaData(query);

    closeBtn.focus();
}

function hideResults() {
    resultsSection.classList.remove('active');
    resetLoading();
    searchInput.value = '';

    setTimeout(() => {
        searchScreen.style.opacity = '1';
        searchScreen.style.pointerEvents = 'auto';
        searchInput.focus();
    }, 400);
}

// --- 4. INTEGRAÇÃO WIKIPEDIA API & FILTRAGEM INTELIGENTE ---
async function fetchWikipediaData(query) {
    const encodedQuery = encodeURIComponent(query);

    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedQuery}`;
    const detailsUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|images&exintro=false&explaintext=true&titles=${encodedQuery}&format=json&origin=*`;
    const imagesListUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=imageinfo&generator=images&gimlimit=20&iiprop=url&titles=${encodedQuery}&format=json&origin=*`;

    try {
        const response = await fetch(summaryUrl);
        if (!response.ok) throw new Error('Not found');
        const data = await response.json();

        wikiDataCache = data;

        const profileName = document.querySelector('.profile-info h2');
        const profileOccupation = document.querySelector('.profile-info p');
        const mainDescription = document.querySelector('.main-description');
        const profilePhoto = document.querySelector('.profile-photo');
        const sourceLink = document.querySelector('.details-source a');

        typeWriter(profileName, data.title || query, 25);
        typeWriter(profileOccupation, data.description ? data.description.toUpperCase() : 'SUBJECT OF INTEREST', 20);
        typeWriter(mainDescription, data.extract || 'No description available.', 10);

        let primaryThumbUrl = null;
        if (data.thumbnail && data.thumbnail.source) {
            primaryThumbUrl = data.thumbnail.source;
            profilePhoto.innerHTML = `<img src="${primaryThumbUrl}" alt="${data.title}" style="width:100%; height:100%; object-fit:cover;">`;
        } else {
            profilePhoto.textContent = 'NO PHOTO';
        }

        if (data.content_urls && data.content_urls.desktop) {
            sourceLink.href = data.content_urls.desktop.page;
        }

        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();
        const pages = detailsData.query?.pages;
        if (pages) {
            const pageId = Object.keys(pages)[0];
            wikiDataCache.fullExtract = pages[pageId]?.extract || data.extract;
        }

        fetchAndDistributeImages(imagesListUrl, primaryThumbUrl);

    } catch (error) {
        console.error('API Error:', error);
        typeWriter(document.querySelector('.main-description'), 'Error: Target not found in database.', 20);
        document.querySelector('.profile-info h2').textContent = query;
        document.querySelector('.profile-info p').textContent = 'UNKNOWN';
    }
}

async function fetchAndDistributeImages(imagesListUrl, primaryThumb) {
    try {
        const res = await fetch(imagesListUrl);
        const data = await res.json();
        const pages = data.query?.pages;
        
        if (!pages) return;

        let imageUrls = [];

        for (let id in pages) {
            const imgInfo = pages[id].imageinfo;
            if (imgInfo && imgInfo[0]?.url) {
                const url = imgInfo[0].url;
                const lowerUrl = url.toLowerCase();
                
                // Filtro avançado para bloquear bandeiras, ícones, logos, baterias e símbolos indesejados
                const isInvalid = lowerUrl.endsWith('.svg') || 
                                  lowerUrl.includes('commons-logo') || 
                                  lowerUrl.includes('ambox') || 
                                  lowerUrl.includes('icon') || 
                                  lowerUrl.includes('stub') ||
                                  lowerUrl.includes('lock') ||
                                  lowerUrl.includes('flag') ||
                                  lowerUrl.includes('Bandeira') ||
                                  lowerUrl.includes('coat_of_arms') ||
                                  lowerUrl.includes('symbol') ||
                                  (primaryThumb && url === primaryThumb) ||
                                  imageUrls.includes(url);

                if (!isInvalid) {
                    imageUrls.push(url);
                }
            }
        }

        const landscapeItem = document.querySelector('.landscape-item');
        const portraitItems = document.querySelectorAll('.portrait-item');
        const smallItems = document.querySelectorAll('.small-item');

        if (landscapeItem && imageUrls.length > 0) {
            landscapeItem.innerHTML = `<img src="${imageUrls[0]}" style="width:100%; height:100%; object-fit:cover;">`;
        }

        portraitItems.forEach((item, index) => {
            if (imageUrls[1 + index]) {
                item.innerHTML = `<img src="${imageUrls[1 + index]}" style="width:100%; height:100%; object-fit:cover;">`;
            }
        });

        smallItems.forEach((item, index) => {
            if (imageUrls[3 + index]) {
                item.innerHTML = `<img src="${imageUrls[3 + index]}" style="width:100%; height:100%; object-fit:cover;">`;
            }
        });

    } catch (err) {
        console.error('Gallery Error:', err);
    }
}

// --- 5. NAVEGAÇÃO DE ABAS & CORREÇÃO DA TIMELINE ---
function showDetailsTab(tabName) {
    detailTabs.forEach((tab) => {
        const isSelected = tab.dataset.tab === tabName;
        tab.classList.toggle('is-active', isSelected);
        tab.setAttribute('aria-selected', String(isSelected));
    });

    detailPanels.forEach((panel) => {
        const isSelected = panel.dataset.panel === tabName;
        panel.classList.toggle('is-active', isSelected);
    });

    if (!wikiDataCache) return;

    const fullText = wikiDataCache.fullExtract || wikiDataCache.extract || '';

    // ABA: OVERVIEW
    if (tabName === 'overview') {
        const overviewText = document.getElementById('overviewText');
        typeWriter(overviewText, fullText, 6);
        filesCard.classList.add('is-visible');
    } else {
        filesCard.classList.remove('is-visible');
    }

    // ABA: FACTS
    if (tabName === 'facts') {
        const factsList = document.querySelector('.facts-list');
        factsList.innerHTML = '';
        const sentences = fullText.split('. ').filter(s => s.trim().length > 15);
        
        sentences.slice(0, 5).forEach((sentence, index) => {
            const li = document.createElement('li');
            factsList.appendChild(li);
            setTimeout(() => {
                typeWriter(li, sentence.trim() + '.', 12);
            }, index * 150);
        });
    }

    // ABA: TIMELINE (Extração limpa e sem cortes)
    if (tabName === 'timeline') {
        const timelinePanel = document.querySelector('.timeline-panel');
        timelinePanel.innerHTML = '';

        const yearRegex = /\b(19\d\d|20\d\d)\b/g;
        const matches = [...fullText.matchAll(yearRegex)];
        
        const events = [];
        const usedYears = new Set();

        matches.forEach(match => {
            const year = match[0];
            if (!usedYears.has(year) && events.length < 4) {
                usedYears.add(year);
                
                // Pega a frase inteira onde o ano aparece para não cortar no meio
                const paragraphs = fullText.split('.');
                const targetPara = paragraphs.find(p => p.includes(year));
                
                let snippet = targetPara ? targetPara.trim() + '.' : 'Registro histórico registrado no período.';
                if (snippet.length > 90) {
                    snippet = snippet.substring(0, 87) + '...';
                }

                events.push({ year, snippet });
            }
        });

        if (events.length === 0) {
            const div = document.createElement('div');
            div.className = 'timeline-item';
            div.innerHTML = `<span class="timeline-year">N/A</span><span class="timeline-line"></span><span class="timeline-event"></span>`;
            timelinePanel.appendChild(div);
            typeWriter(div.querySelector('.timeline-event'), 'No specific timeline records found.', 15);
        } else {
            events.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'timeline-item';
                div.innerHTML = `
                    <span class="timeline-year">${item.year}</span>
                    <span class="timeline-line"></span>
                    <span class="timeline-event"></span>
                `;
                timelinePanel.appendChild(div);
                setTimeout(() => {
                    typeWriter(div.querySelector('.timeline-event'), item.snippet, 12);
                }, index * 200);
            });
        }
    }
}

detailTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
        showDetailsTab(tab.dataset.tab);
    });
});

searchBtn.addEventListener('click', showResults);

searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        showResults();
    }
});

closeBtn.addEventListener('click', hideResults);

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && resultsSection.classList.contains('active')) {
        hideResults();
    }
});

moreBtn.addEventListener('click', () => {
    statusCard.classList.add('is-visible');
    startLoading();
});

lessBtn.addEventListener('click', () => {
    imagesCard.classList.remove('is-visible');
    detailsCard.classList.remove('is-visible');
    statusCard.classList.remove('is-visible');
    filesCard.classList.remove('is-visible');

    if (loadingAnimationId !== null) {
        cancelAnimationFrame(loadingAnimationId);
        loadingAnimationId = null;
    }

    moreBtn.setAttribute('aria-expanded', 'false');
});

// --- 6. ARCHIVE FILES INTERACTION ---
const fileModal = document.getElementById('fileModal');
const closeFileModal = document.getElementById('closeFileModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalFooter = document.getElementById('modalFooter');
const fileFolders = document.querySelectorAll('.file-folder');

fileFolders.forEach((folder) => {
    folder.addEventListener('click', () => {
        const query = searchInput.value.trim() || 'SUBJECT';
        const fileType = folder.dataset.file;
        const targetName = document.querySelector('.profile-info h2').textContent || query;
        const occupation = document.querySelector('.profile-info p').textContent || 'CLASSIFIED';
        const description = document.querySelector('.main-description').textContent || '';

        modalFooter.innerHTML = '';

        if (fileType === 'summary') {
            modalTitle.textContent = 'SUMMARY.LOG';
            modalBody.innerHTML = `
                <p><strong>[SYSTEM INTELLIGENCE REPORT]</strong></p><br>
                <p><strong>TARGET:</strong> ${targetName}</p>
                <p><strong>CLASSIFICATION:</strong> ${occupation}</p><br>
                <p><strong>BRIEF:</strong> ${description}</p><br>
                <p style="color: rgba(0, 255, 204, 0.5);">Status: Verified and indexed in Zetesis database.</p>
            `;
            fileModal.classList.add('is-open');

        } else if (fileType === 'sources') {
            modalTitle.textContent = 'SOURCES.SYS';
            modalBody.innerHTML = `
                <p><strong>[EXTERNAL SOURCES NETWORK]</strong></p><br>
                <p>Active references compiled for <strong>${targetName}</strong>:</p><br>
                <ul style="padding-left: 18px;">
                    <li>Wikipedia Knowledge Graph (REST API)</li>
                    <li>Google Search Index</li>
                    <li>Zetesis Neural Archive</li>
                </ul>
            `;
            fileModal.classList.add('is-open');

        } else if (fileType === 'export') {
            modalTitle.textContent = 'EXPORT_DOSSIER.TXT';
            modalBody.innerHTML = `
                <p><strong>[FILE EXPORT CONFIRMATION]</strong></p><br>
                <p>Ready to generate downloadable dossier file for <strong>${targetName}</strong>.</p>
                <p>Click below to download <code>${query.toLowerCase()}_dossier.txt</code> to your local device.</p>
            `;

            const btn = document.createElement('button');
            btn.className = 'download-btn';
            btn.textContent = 'DOWNLOAD DOSSIER';
            btn.addEventListener('click', () => {
                downloadDossierText(targetName, occupation, description);
            });

            modalFooter.appendChild(btn);
            fileModal.classList.add('is-open');
        }
    });
});

function downloadDossierText(name, occupation, description) {
    const timestamp = new Date().toISOString();
    const content = `==================================================
ZETESIS THE FINDER - CONFIDENTIAL DOSSIER
==================================================
Target: ${name}
Role/Status: ${occupation}
Timestamp: ${timestamp}
--------------------------------------------------
SUMMARY:
${description}

==================================================
END OF DOSSIER - ZETESIS ARCHIVE SYSTEM
==================================================`;

    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${name.replace(/\s+/g, '_')}_dossier.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

if (closeFileModal) {
    closeFileModal.addEventListener('click', () => {
        fileModal.classList.remove('is-open');
    });
}

if (fileModal) {
    fileModal.addEventListener('click', (e) => {
        if (e.target === fileModal) {
            fileModal.classList.remove('is-open');
        }
    });
}