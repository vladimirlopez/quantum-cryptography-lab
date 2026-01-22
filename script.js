/**
 * Quantum Cryptography (BB84) Simulation Logic
 * Refactored for modularity and clarity.
 */

class BB84Simulation {
    constructor() {
        this.bitLength = 10; // Number of bits to simulate per batch
        this.aliceBits = [];
        this.aliceBases = []; // 0 for Rectilinear (+), 1 for Diagonal (x)
        this.bobBases = [];
        this.bobResults = [];
        this.siftedKey = [];
        this.isEvePresent = false;

        // DOM Elements
        this.elements = {
            controls: {
                generateSender: document.getElementById('gen-sender-btn'),
                sendPhotons: document.getElementById('send-photons-btn'),
                measureReceiver: document.getElementById('measure-receiver-btn'),
                compareBases: document.getElementById('compare-bases-btn'),
                toggleEve: document.getElementById('toggle-eve-btn'),
                reset: document.getElementById('reset-btn')
            },
            displays: {
                aliceTable: document.getElementById('alice-table-body'),
                bobTable: document.getElementById('bob-table-body'),
                siftedKeyDisplay: document.getElementById('sifted-key-display'),
                stepIndicator: document.getElementById('current-step'),
                photonTrack: document.getElementById('photon-track')
            }
        };

        this.step = 0; // 0: Init, 1: Generated, 2: Sent, 3: Measured, 4: Sifted
        this.bindEvents();
    }

    bindEvents() {
        this.elements.controls.generateSender.addEventListener('click', () => this.generateAliceData());
        this.elements.controls.sendPhotons.addEventListener('click', () => this.transmitPhotons());
        this.elements.controls.measureReceiver.addEventListener('click', () => this.bobMeasure());
        this.elements.controls.compareBases.addEventListener('click', () => this.siftKey());
        this.elements.controls.toggleEve.addEventListener('click', () => this.toggleEve());
        this.elements.controls.reset.addEventListener('click', () => this.reset());
    }

    // Helper: Random Bit (0 or 1)
    randomBit() {
        return Math.round(Math.random());
    }

    // Helper: Random Basis (0: +, 1: x)
    randomBasis() {
        return Math.random() < 0.5 ? '+' : 'x';
    }

    // Step 1: Alice generates random bits and bases
    generateAliceData() {
        this.aliceBits = Array.from({ length: this.bitLength }, () => this.randomBit());
        this.aliceBases = Array.from({ length: this.bitLength }, () => this.randomBasis());

        this.renderAliceTable();
        this.updateStep(1, "Alice has prepared her qubits.");
        this.elements.controls.generateSender.disabled = true;
        this.elements.controls.sendPhotons.disabled = false;
    }

    renderAliceTable() {
        const tbody = this.elements.displays.aliceTable;
        tbody.innerHTML = '';
        this.aliceBits.forEach((bit, i) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${i + 1}</td>
                <td class="font-mono text-accent-cyan">${bit}</td>
                <td class="font-mono text-accent-purple">${this.aliceBases[i]}</td>
                <td class="text-secondary">-</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Step 2: Transmission Animation
    transmitPhotons() {
        this.updateStep(2, "Photons are traveling through the quantum channel...");
        this.elements.controls.sendPhotons.disabled = true;

        const track = this.elements.displays.photonTrack;
        track.innerHTML = '';

        let completedAnimations = 0;

        this.aliceBits.forEach((bit, i) => {
            setTimeout(() => {
                const photon = document.createElement('div');
                photon.className = 'photon';
                // Visual representation of polarization
                const basis = this.aliceBases[i];
                let rotation = 0;
                if (basis === '+') rotation = bit === 0 ? 0 : 90; // 0=H, 1=V
                else rotation = bit === 0 ? 45 : 135; // 0=45, 1=135

                photon.innerHTML = basis === '+' ? (bit === 0 ? '&rarr;' : '&uarr;') : (bit === 0 ? '&nearr;' : '&nwarr;');

                track.appendChild(photon);

                // If Eve is present, she intercepts!
                if (this.isEvePresent) {
                    photon.style.backgroundColor = 'var(--danger)';
                    photon.style.boxShadow = '0 0 10px var(--danger)';
                }

                photon.addEventListener('animationend', () => {
                    photon.remove();
                    completedAnimations++;
                    if (completedAnimations === this.bitLength) {
                        this.updateStep(2.5, "Photons received. Bob needs to measure.");
                        this.elements.controls.measureReceiver.disabled = false;
                    }
                });

            }, i * 300); // Stagger animations
        });
    }

    // Step 3: Bob Measures
    bobMeasure() {
        this.bobBases = Array.from({ length: this.bitLength }, () => this.randomBasis());
        this.bobResults = [];

        for (let i = 0; i < this.bitLength; i++) {
            let bit = this.aliceBits[i];
            let basisAlice = this.aliceBases[i];
            let basisBob = this.bobBases[i];

            // If bases match, Bob gets the correct bit (100% probability in ideal scenario)
            if (basisAlice === basisBob) {
                this.bobResults.push(bit);
            } else {
                // Bases differ: 50% chance of random result
                this.bobResults.push(this.randomBit());
            }

            // Eavesdropper Logic (Simplified Intercept-Resend)
            if (this.isEvePresent) {
                // Eve measures with random basis
                const eveBasis = this.randomBasis();
                if (eveBasis !== basisAlice) {
                    // Eve chose wrong basis, she might disturb the photon
                    if (Math.random() < 0.5) {
                        // 50% chance the bit flips even if Bob guesses basis right later
                        // For simulation simplicity, we just say if Eve is wrong, state is randomized
                        // But strictly, if Alice=+, Eve=x, Bob=+, result is random.
                        // If this simplified logic runs, we can simulate error introduction.
                        // Let's keep it consistent with the standard BB84 error rate introduction.
                        if (basisAlice === basisBob && Math.random() < 0.5) {
                            // Introduce error!
                            this.bobResults[i] = 1 - this.bobResults[i];
                        }
                    }
                }
            }
        }

        this.renderBobTable();
        this.updateStep(3, "Bob has measured the photons.");
        this.elements.controls.measureReceiver.disabled = true;
        this.elements.controls.compareBases.disabled = false;
    }

    renderBobTable() {
        const tbody = this.elements.displays.bobTable;
        tbody.innerHTML = '';
        this.bobResults.forEach((bit, i) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${i + 1}</td>
                <td class="font-mono text-accent-cyan">${this.bobBases[i]}</td>
                <td class="font-mono text-white">${bit}</td>
                <td class="text-secondary status-cell">?</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Step 4: Sift Key (Compare Bases)
    siftKey() {
        this.siftedKey = [];
        const bobRows = this.elements.displays.bobTable.querySelectorAll('tr');
        const aliceRows = this.elements.displays.aliceTable.querySelectorAll('tr');

        let matchCount = 0;
        let errorCount = 0;

        for (let i = 0; i < this.bitLength; i++) {
            const cell = bobRows[i].querySelector('.status-cell');
            const aliceStatus = aliceRows[i].lastElementChild;

            if (this.aliceBases[i] === this.bobBases[i]) {
                // Bases Matched!
                this.siftedKey.push(this.bobResults[i]);
                cell.innerHTML = '<span class="status-badge status-match">Match</span>';
                aliceStatus.innerHTML = '<span class="status-badge status-match">Match</span>';

                // Check for errors (Eve detection)
                if (this.aliceBits[i] !== this.bobResults[i]) {
                    cell.innerHTML += ' <span class="text-danger">(Error!)</span>';
                    aliceStatus.innerHTML += ' <span class="text-danger">(Error!)</span>';
                    errorCount++;
                }
                matchCount++;
            } else {
                cell.innerHTML = '<span class="status-badge status-mismatch">Discard</span>';
                aliceStatus.innerHTML = '<span class="status-badge status-mismatch">Discard</span>';
                cell.style.opacity = '0.5';
                aliceStatus.style.opacity = '0.5';
            }
        }

        this.elements.displays.siftedKeyDisplay.textContent = this.siftedKey.join('');
        this.elements.controls.compareBases.disabled = true;

        let msg = `Sifting complete. Key length: ${this.siftedKey.length}.`;
        if (errorCount > 0) {
            msg += ` WARNING: ${errorCount} errors detected in matching bases! Eve might be listening.`;
            this.elements.displays.stepIndicator.style.color = 'var(--danger)';
        } else {
            msg += " No errors detected. Channel secure.";
            this.elements.displays.stepIndicator.style.color = 'var(--success)';
        }
        this.updateStep(4, msg);
    }

    toggleEve() {
        this.isEvePresent = !this.isEvePresent;
        const btn = this.elements.controls.toggleEve;
        if (this.isEvePresent) {
            btn.textContent = "Disable Eve (Spy)";
            btn.classList.add('btn-danger'); // Assuming you add a cleaner class for red buttons
            btn.style.backgroundColor = 'var(--danger)';
            btn.style.borderColor = 'var(--danger)';
        } else {
            btn.textContent = "Enable Eve (Spy)";
            btn.style.backgroundColor = '';
            btn.style.borderColor = '';
        }
        this.reset();
        this.updateStep(0, `Simulation reset. Eve is now ${this.isEvePresent ? 'ACTIVE' : 'INACTIVE'}.`);
    }

    reset() {
        this.aliceBits = [];
        this.aliceBases = [];
        this.bobBases = [];
        this.bobResults = [];
        this.siftedKey = [];
        this.step = 0;

        this.elements.displays.aliceTable.innerHTML = '';
        this.elements.displays.bobTable.innerHTML = '';
        this.elements.displays.siftedKeyDisplay.textContent = '-';
        this.elements.displays.photonTrack.innerHTML = '';

        this.elements.controls.generateSender.disabled = false;
        this.elements.controls.sendPhotons.disabled = true;
        this.elements.controls.measureReceiver.disabled = true;
        this.elements.controls.compareBases.disabled = true;

        this.elements.displays.stepIndicator.style.color = 'var(--text-primary)';
        this.updateStep(0, "Ready to start.");
    }

    updateStep(num, text) {
        this.step = num;
        this.elements.displays.stepIndicator.textContent = text;
    }
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    window.simulation = new BB84Simulation();
});
