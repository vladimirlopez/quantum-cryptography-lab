// --- State ---
let config = {
    length: 12,
    evePresent: false
};

// --- Constants ---
const BASES = {
    RECT: '+',
    DIAG: 'x'
};

const STATES = {
    H: { name: 'H', angle: 0, bit: 0, basis: '+' },
    V: { name: 'V', angle: 90, bit: 1, basis: '+' },
    P45: { name: '+45', angle: 45, bit: 0, basis: 'x' },
    M45: { name: '-45', angle: -45, bit: 1, basis: 'x' }
};

// Helper to get random bit (0 or 1)
const randomBit = () => Math.random() < 0.5 ? 0 : 1;

// Helper to get random basis ('+' or 'x')
const randomBasis = () => Math.random() < 0.5 ? BASES.RECT : BASES.DIAG;

// --- Core Logic ---

function toggleEve() {
    config.evePresent = !config.evePresent;
    const btn = document.getElementById('eveToggle');
    const ind = document.getElementById('eveIndicator');
    const status = document.getElementById('eveStatus');
    const avatar = document.getElementById('eveAvatar');

    if (config.evePresent) {
        btn.classList.replace('bg-slate-700', 'bg-red-600');
        ind.classList.replace('left-1', 'translate-x-7');
        status.innerText = "ACTIVE";
        status.classList.replace('text-slate-500', 'text-red-500');
        avatar.classList.remove('grayscale', 'opacity-50');
    } else {
        btn.classList.replace('bg-red-600', 'bg-slate-700');
        ind.classList.remove('translate-x-7');
        ind.classList.add('left-1');
        status.innerText = "ABSENT";
        status.classList.replace('text-red-500', 'text-slate-500');
        avatar.classList.add('grayscale', 'opacity-50');
    }
}

function getPhotonState(bit, basis) {
    if (basis === BASES.RECT) return bit === 0 ? STATES.H : STATES.V;
    if (basis === BASES.DIAG) return bit === 0 ? STATES.P45 : STATES.M45;
}

// Simulates measurement of an incoming state by a specific basis
function measurePhoton(incomingState, measureBasis) {
    // Case 1: Matching Bases (Deterministic)
    if (incomingState.basis === measureBasis) {
        return incomingState; // State is preserved
    }

    // Case 2: Mismatching Bases (Probabilistic collapse)
    // If measuring RECT (+), result is H or V (50/50)
    if (measureBasis === BASES.RECT) {
        return Math.random() < 0.5 ? STATES.H : STATES.V;
    }
    // If measuring DIAG (x), result is +45 or -45 (50/50)
    return Math.random() < 0.5 ? STATES.P45 : STATES.M45;
}

function runSimulation() {
    config.length = parseInt(document.getElementById('lengthSlider').value);
    const container = document.getElementById('sim-container');
    container.innerHTML = ''; // Clear previous

    // Data Arrays
    let aliceData = [];
    let eveData = [];
    let bobData = [];
    let siftedData = []; // { bit: number | null, isError: boolean }

    // 1. Generate Alice's Data
    for (let i = 0; i < config.length; i++) {
        const bit = randomBit();
        const basis = randomBasis();
        const state = getPhotonState(bit, basis);
        aliceData.push({ id: i, bit, basis, state });
    }

    // 2. Simulate Channel (Eve)
    let currentPhotons = aliceData.map(d => d.state); // What travels to Bob

    if (config.evePresent) {
        for (let i = 0; i < config.length; i++) {
            const eveBasis = randomBasis();
            const measuredState = measurePhoton(currentPhotons[i], eveBasis);
            eveData.push({ basis: eveBasis, measuredState: measuredState });
            currentPhotons[i] = measuredState; // Eve resends the measured state
        }
    } else {
        // If Eve absent, fill with nulls for visual alignment
        for (let i = 0; i < config.length; i++) eveData.push(null);
    }

    // 3. Bob Measures
    for (let i = 0; i < config.length; i++) {
        const bobBasis = randomBasis();
        const resultState = measurePhoton(currentPhotons[i], bobBasis);
        bobData.push({ basis: bobBasis, resultBit: resultState.bit });
    }

    // 4. Sifting & Error Check
    let totalSifted = 0;
    let totalErrors = 0;
    let siftedString = "";

    for (let i = 0; i < config.length; i++) {
        const basisMatch = aliceData[i].basis === bobData[i].basis;

        if (basisMatch) {
            totalSifted++;
            const isError = aliceData[i].bit !== bobData[i].resultBit;
            if (isError) totalErrors++;

            siftedData.push({
                bit: bobData[i].resultBit,
                isError: isError,
                kept: true
            });
            siftedString += isError ? `<span class="text-red-500">${bobData[i].resultBit}</span>` : bobData[i].resultBit;
        } else {
            siftedData.push({ kept: false });
        }
    }

    // 5. Render UI
    renderTrack(aliceData, eveData, bobData, siftedData);
    updateAnalysis(totalSifted, totalErrors, siftedString);
}

function renderTrack(alice, eve, bob, sifted) {
    const container = document.getElementById('sim-container');

    // Grid layout configuration
    const cellClass = "w-16 flex flex-col items-center justify-center p-2 border-r border-slate-700/50 flex-shrink-0";
    const rowClass = "flex border-b border-slate-700/50 min-w-max";
    const labelClass = "w-32 flex-shrink-0 p-4 font-bold text-slate-400 bg-slate-900/80 sticky left-0 z-10 flex items-center border-r border-slate-700 backdrop-blur";

    // Helper to draw arrow SVG based on state
    const drawArrow = (state, color = "text-blue-400") => {
        let rot = 0;
        if (state.name === 'H') rot = 0;
        else if (state.name === 'V') rot = 90;
        else if (state.name === '+45') rot = -45; // SVG coord system
        else if (state.name === '-45') rot = 45;

        return `
                <div class="relative w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center bg-slate-800 shadow-inner">
                    <span class="material-symbols-outlined ${color} text-xl" style="transform: rotate(${rot}deg)">arrow_right_alt</span>
                </div>`;
    };

    // Helper for Film Graphic
    const drawFilm = (basis, active = true) => {
        if (!active) return `<div class="w-10 h-10"></div>`;
        const icon = basis === '+' ? 'add' : 'close';
        const color = basis === '+' ? 'text-blue-400' : 'text-purple-400';
        return `
                <div class="polaroid-film w-10 h-10 rounded flex items-center justify-center mb-1">
                    <span class="material-symbols-outlined ${color} text-2xl drop-shadow-md">${icon}</span>
                </div>`;
    };

    // Row 1: Alice
    let html = `<div class="${rowClass} bg-blue-900/10">
                <div class="${labelClass}">
                    <div class="flex flex-col">
                        <span class="text-blue-400">Alice</span>
                        <span class="text-[10px] font-normal text-slate-500">Preparation</span>
                    </div>
                </div>`;

    alice.forEach(d => {
        html += `<div class="${cellClass}">
                    <div class="text-xs font-mono text-slate-400 mb-1">Bit:${d.bit}</div>
                    ${drawFilm(d.basis)}
                    <div class="mt-1">${drawArrow(d.state)}</div>
                </div>`;
    });
    html += `</div>`;

    // Row 2: Eve (Optional)
    if (config.evePresent) {
        html += `<div class="${rowClass} bg-red-900/10">
                    <div class="${labelClass}">
                        <div class="flex flex-col">
                            <span class="text-red-400">Eve</span>
                            <span class="text-[10px] font-normal text-slate-500">Interception</span>
                        </div>
                    </div>`;

        eve.forEach(d => {
            html += `<div class="${cellClass}">
                         <div class="text-[10px] text-red-500/70 font-bold mb-1">INTERCEPT</div>
                         ${drawFilm(d.basis)}
                         <div class="mt-1 opacity-70">${drawArrow(d.measuredState, "text-red-400")}</div>
                    </div>`;
        });
        html += `</div>`;
    }

    // Row 3: Bob
    html += `<div class="${rowClass} bg-green-900/10">
                <div class="${labelClass}">
                    <div class="flex flex-col">
                        <span class="text-green-400">Bob</span>
                        <span class="text-[10px] font-normal text-slate-500">Measurement</span>
                    </div>
                </div>`;

    bob.forEach((d, i) => {
        html += `<div class="${cellClass}">
                    ${drawFilm(d.basis)}
                    <div class="text-xs font-mono text-slate-300 mt-2">Res:${d.resultBit}</div>
                </div>`;
    });
    html += `</div>`;

    // Row 4: Comparison (Sifting)
    html += `<div class="${rowClass} bg-slate-900/30">
                <div class="${labelClass}">
                    <div class="flex flex-col">
                        <span class="text-yellow-400">Sifting</span>
                        <span class="text-[10px] font-normal text-slate-500">Public Check</span>
                    </div>
                </div>`;

    sifted.forEach((d, i) => {
        const aliceB = alice[i].basis;
        const bobB = bob[i].basis;
        const match = aliceB === bobB;

        let content = '';
        if (match) {
            content = `<div class="w-full h-full bg-green-500/10 border border-green-500/30 rounded flex flex-col items-center justify-center">
                        <span class="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                        <span class="text-[10px] text-green-300 mt-1">MATCH</span>
                    </div>`;
        } else {
            content = `<div class="opacity-30 flex flex-col items-center">
                        <span class="text-xs text-slate-500">${aliceB} vs ${bobB}</span>
                        <span class="material-symbols-outlined text-slate-600 text-sm">cancel</span>
                    </div>`;
        }

        html += `<div class="${cellClass} h-20">${content}</div>`;
    });
    html += `</div>`;

    // Row 5: Final Key
    html += `<div class="${rowClass}">
                <div class="${labelClass}">
                    <div class="flex flex-col">
                        <span class="text-white">Final Key</span>
                        <span class="text-[10px] font-normal text-slate-500">Sifted Bits</span>
                    </div>
                </div>`;

    sifted.forEach(d => {
        let content = '';
        if (d.kept) {
            const color = d.isError ? "text-red-500 font-bold bg-red-900/20 border-red-500" : "text-green-400 font-bold bg-green-900/20 border-green-500";
            content = `<div class="w-8 h-8 rounded border ${color} flex items-center justify-center">${d.bit}</div>`;
        } else {
            content = `<span class="text-slate-700 text-xl">·</span>`;
        }
        html += `<div class="${cellClass}">${content}</div>`;
    });
    html += `</div>`;

    container.innerHTML = html;
}

function updateAnalysis(totalSifted, totalErrors, siftedString) {
    const panel = document.getElementById('analysis-panel');
    panel.classList.remove('hidden');
    setTimeout(() => panel.classList.remove('opacity-0'), 100);

    // Sifted Key
    document.getElementById('siftedKeyDisplay').innerHTML = siftedString || '<span class="text-slate-600 italic">No matching bases found</span>';

    // Error Rate
    const errorRate = totalSifted > 0 ? (totalErrors / totalSifted) * 100 : 0;
    document.getElementById('errorRateDisplay').innerText = errorRate.toFixed(1) + '%';

    // Animate Bar
    const bar = document.getElementById('errorFill');
    bar.style.width = `${Math.min(errorRate, 100)}%`;
    if (errorRate > 0) bar.classList.replace('bg-green-500', 'bg-red-500');
    else bar.classList.replace('bg-red-500', 'bg-green-500');

    // Security Check
    const statusEl = document.getElementById('securityStatus');
    const msgEl = document.getElementById('securityMsg');
    const light = document.getElementById('statusLight');

    if (totalSifted === 0) {
        statusEl.innerText = "INSUFFICIENT DATA";
        statusEl.className = "font-bold text-lg text-yellow-500";
        msgEl.innerText = "Increase sequence length to generate a key.";
        light.className = "absolute -right-4 -top-4 w-20 h-20 bg-yellow-500/10 rounded-full blur-xl";
    } else if (errorRate === 0) {
        statusEl.innerText = "SECURE";
        statusEl.className = "font-bold text-lg text-green-400";
        msgEl.innerText = "No errors detected. Safe to use key.";
        light.className = "absolute -right-4 -top-4 w-20 h-20 bg-green-500/20 rounded-full blur-xl";
    } else {
        statusEl.innerText = "COMPROMISED";
        statusEl.className = "font-bold text-lg text-red-500";
        msgEl.innerText = `Eve detected! Error rate (${errorRate.toFixed(1)}%) exceeds threshold.`;
        light.className = "absolute -right-4 -top-4 w-20 h-20 bg-red-500/20 rounded-full blur-xl";
    }
}

// --- Improved Download Functionality ---
async function downloadPage() {
    const btn = document.getElementById('downloadBtn');
    const originalContent = btn.innerHTML;

    // 1. Show Loading State
    btn.innerHTML = `
                <span class="material-symbols-outlined animate-spin">refresh</span>
                Processing Images...
            `;
    btn.disabled = true;

    try {
        // 2. Clone the current document to avoid messing with the live view
        const docClone = document.documentElement.cloneNode(true);

        // 3. Sync dynamic inputs to the clone (inputs/sliders don't always clone their current values to attributes)
        const inputs = document.querySelectorAll('input');
        const clonedInputs = docClone.querySelectorAll('input');
        inputs.forEach((input, index) => {
            clonedInputs[index].setAttribute('value', input.value);
        });

        // 4. Find all images in the clone
        const images = docClone.querySelectorAll('img');

        // 5. Convert images to Base64 (Data URIs)
        const imagePromises = Array.from(images).map(async (img) => {
            // Skip if it's already a data URI
            if (img.src.startsWith('data:')) return;

            try {
                // Attempt to fetch the image data. 
                // Note: This works if the server supports CORS or if it's same-origin. 
                const response = await fetch(img.src);
                const blob = await response.blob();

                // Convert Blob to Data URL
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });

                img.src = base64; // Replace the URL with the Base64 string
            } catch (error) {
                console.warn('Could not embed image:', img.src, error);
                // If fetching fails (e.g., CORS), we leave the original URL.
            }
        });

        // Wait for all image processing to finish
        await Promise.all(imagePromises);

        // 6. Generate the HTML Blob
        const htmlContent = "<!DOCTYPE html>\n" + docClone.outerHTML;
        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);

        // 7. Trigger Download
        const a = document.createElement("a");
        a.href = url;
        a.download = "quantum-bb84-lab-full.html";
        document.body.appendChild(a);
        a.click();

        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (err) {
        console.error("Download failed:", err);
        alert("Could not generate download. Check console for details.");
    } finally {
        // Restore button state
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
}
