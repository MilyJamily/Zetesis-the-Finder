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