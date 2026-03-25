let polymerData = [];
let viewer = null;
let compareChartInstance = null;
let ashbyChartInstance = null;
let currentFilter = 'All';

// Initialization
document.addEventListener("DOMContentLoaded", async () => {
    await fetchPolymers();
    setupSearch();
    populateDropdowns();
});

// Navigation Logic
function showSection(sectionId) {
    document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    // Fix 3Dmol resize issue & Auto-load first model
    if (sectionId === 'viz') {
        if (viewer) {
            viewer.resize();
        } else {
            load3DModel();
        }
    }

    // Draw the Ashby map only when the user clicks the Map tab
    if (sectionId === 'map' && !ashbyChartInstance) {
        drawAshbyChart();
    }
}

// Fetch Data
async function fetchPolymers() {
    try {
        const response = await fetch('/api/polymers');
        polymerData = await response.json();
    } catch (error) {
        console.error("Error fetching polymer data:", error);
    }
}

// Main Search & Smart Filter
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const dataList = document.getElementById('polymerSuggestions');

    polymerData.forEach(poly => {
        const option = document.createElement('option');
        option.value = poly.polymer_name;
        dataList.appendChild(option);
    });

    searchInput.addEventListener('input', applyFilters);
    displaySearchResults(polymerData);
}

function filterPolymers(type, btnElement) {
    currentFilter = type;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    applyFilters();
}

function applyFilters() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = polymerData.filter(p => {
        const matchesName = p.polymer_name.toLowerCase().includes(query);
        const matchesApp = p.applications.toLowerCase().includes(query);
        const isTextMatch = matchesName || matchesApp;

        const matchesType = (currentFilter === 'All') || (p.type.toLowerCase().includes(currentFilter.toLowerCase()));

        return isTextMatch && matchesType;
    });
    displaySearchResults(filtered);
}

// Display Cards (UPDATED with Quick Profile and YouTube Button)
function displaySearchResults(results) {
    const container = document.getElementById('searchResults');
    container.innerHTML = '';

    results.forEach(poly => {
        const card = document.createElement('div');
        card.className = 'card';

        const tokenClass = `token-${poly.type.toLowerCase().replace(/\s+/g, '')}`;
        const tensile = poly.tensile_strength && poly.tensile_strength !== "N/A" ? poly.tensile_strength : "N/A";
        const elongation = poly.elongation && poly.elongation !== "N/A" ? poly.elongation : "N/A";
        const imageUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${poly.pubchem_cid}/PNG`;

        // Fallbacks for the new columns
        const formula = poly.formula || "Complex Polymer Structure";
        const recyclability = poly.recyclability || "Check local recycling codes";
        const funFact = poly.fun_fact || "A vital material in modern engineering.";

        // YouTube Button logic
        const ytLink = poly.youtube_link ?
            `<a href="${poly.youtube_link}" target="_blank" style="display: block; text-align: center; background-color: #e74c3c; color: white; border: none; text-decoration: none; padding: 10px; border-radius: 6px; font-weight: bold; margin-top: 10px; transition: 0.3s;" onmouseover="this.style.backgroundColor='#c0392b';" onmouseout="this.style.backgroundColor='#e74c3c';">▶️ Watch YouTube Video</a>`
            : '';

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div style="flex: 1; padding-right: 10px;">
                    <h3 style="margin-top: 0; margin-bottom: 8px;">${poly.polymer_name}</h3>
                    <span class="badge ${tokenClass}">${poly.type}</span>
                </div>
                <img src="${imageUrl}" alt="Structure" onerror="this.style.display='none'" style="width: 80px; height: 80px; object-fit: contain; background: white; border-radius: 8px; border: 1px solid #ddd; padding: 4px;">
            </div>
            <p style="font-size: 0.9rem;"><strong>Applications:</strong> ${poly.applications}</p>
            <hr>
            <p style="font-size: 0.9rem;"><strong>Thermal:</strong> Tg: ${poly.glass_transition_temperature} | Tm: ${poly.melting_point}</p>
            <p style="font-size: 0.9rem;"><strong>Mechanical:</strong> Tensile: ${tensile} | Elongation: ${elongation}</p>
            
            <div style="margin-top: 15px; background-color: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid var(--secondary);">
                <h4 style="margin: 0 0 10px 0; color: var(--primary); font-size: 0.95rem;">📌 Quick Profile</h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 0.85rem; color: #444; line-height: 1.6;">
                    <li><strong>Formula:</strong> ${formula}</li>
                    <li><strong>Eco-Status:</strong> ${recyclability}</li>
                    <li><strong>Did you know?</strong> ${funFact}</li>
                </ul>
            </div>

            <div style="margin-top: 15px;">
                <a href="${poly.wiki_link}" target="_blank" style="display: block; text-align: center; background-color: transparent; color: #2c3e50; border: 2px solid #2c3e50; text-decoration: none; padding: 10px; border-radius: 6px; font-weight: bold; transition: all 0.3s ease;" onmouseover="this.style.backgroundColor='#2c3e50'; this.style.color='white';" onmouseout="this.style.backgroundColor='transparent'; this.style.color='#2c3e50';">
                    🔗 Access Literature Reference
                </a>
                ${ytLink}
            </div>
        `;
        container.appendChild(card);
    });
}

// Populate Dropdowns & 3D Datalist
function populateDropdowns() {
    const p1 = document.getElementById('poly1');
    const p2 = document.getElementById('poly2');
    const vizSuggestions = document.getElementById('vizSuggestions');

    polymerData.forEach((poly, index) => {
        const option = new Option(poly.polymer_name, index);
        p1.add(option.cloneNode(true));
        p2.add(option.cloneNode(true));

        if (vizSuggestions) {
            const vizOption = document.createElement('option');
            vizOption.value = poly.polymer_name;
            vizSuggestions.appendChild(vizOption);
        }
    });

    const vizInput = document.getElementById('vizSearchInput');
    if (vizInput && polymerData.length > 0) {
        vizInput.value = polymerData[0].polymer_name;
    }
}

// Compare & Chart Logic
function comparePolymers() {
    const i1 = document.getElementById('poly1').value;
    const i2 = document.getElementById('poly2').value;

    const p1 = polymerData[i1];
    const p2 = polymerData[i2];

    const container = document.getElementById('compareResults');
    container.innerHTML = `
        <table>
            <tr><th>Property</th><th>${p1.polymer_name}</th><th>${p2.polymer_name}</th></tr>
            <tr><td>Type</td><td>${p1.type}</td><td>${p2.type}</td></tr>
            <tr><td>Density</td><td>${p1.density}</td><td>${p2.density}</td></tr>
            <tr><td>Glass Transition (Tg)</td><td>${p1.glass_transition_temperature}</td><td>${p2.glass_transition_temperature}</td></tr>
            <tr><td>Melting Point (Tm)</td><td>${p1.melting_point}</td><td>${p2.melting_point}</td></tr>
            <tr><td>Tensile Strength</td><td>${p1.tensile_strength || "N/A"}</td><td>${p2.tensile_strength || "N/A"}</td></tr>
        </table>
    `;

    drawChart(p1, p2);
    document.getElementById('exportBtn').style.display = 'inline-block';
}

function drawChart(p1, p2) {
    const ctx = document.getElementById('compareChart').getContext('2d');
    document.getElementById('compareChart').style.display = 'block';

    const parseTemp = (str) => {
        if (!str) return 0;
        const match = str.match(/-?\d+/);
        return match ? parseInt(match[0]) : 0;
    };

    if (compareChartInstance) compareChartInstance.destroy();

    compareChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Glass Transition (Tg) °C', 'Melting Point (Tm) °C'],
            datasets: [
                { label: p1.polymer_name, data: [parseTemp(p1.glass_transition_temperature), parseTemp(p1.melting_point)], backgroundColor: '#3498db' },
                { label: p2.polymer_name, data: [parseTemp(p2.glass_transition_temperature), parseTemp(p2.melting_point)], backgroundColor: '#e74c3c' }
            ]
        },
        options: { responsive: true, plugins: { title: { display: true, text: 'Thermal Properties Comparison' } } }
    });
}

// 3D Visualization using 3Dmol.js
async function load3DModel() {
    const errorDiv = document.getElementById('viz-error');
    if (errorDiv) errorDiv.innerText = "";

    const queryInput = document.getElementById('vizSearchInput');
    if (!queryInput) return;

    const query = queryInput.value;
    const poly = polymerData.find(p => p.polymer_name === query);

    if (!poly) {
        if (errorDiv) errorDiv.innerText = "Please select a valid polymer from the search list.";
        if (viewer) viewer.clear();
        return;
    }

    const cid = poly.pubchem_cid;

    if (!cid || cid === "N/A" || cid.trim() === "") {
        if (errorDiv) errorDiv.innerText = `No 3D structure available for ${poly.polymer_name}.`;
        if (viewer) viewer.clear();
        return;
    }

    if (!viewer) {
        viewer = $3Dmol.createViewer("container-01", { backgroundColor: "white" });
    }

    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/record/SDF/?record_type=3d`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("3D model not available");
        const sdfData = await response.text();

        viewer.clear();
        viewer.addModel(sdfData, "sdf");
        viewer.setStyle({}, { stick: { radius: 0.15 }, sphere: { scale: 0.3 } });
        viewer.zoomTo();
        viewer.render();
    } catch (error) {
        console.error("Failed to load 3D model", error);
        viewer.clear();
        if (errorDiv) errorDiv.innerText = `3D Model not found in PubChem for ${poly.polymer_name} (CID: ${cid}).`;
    }
}

// Export to CSV
function exportComparisonCSV() {
    const i1 = document.getElementById('poly1').value;
    const i2 = document.getElementById('poly2').value;

    const p1 = polymerData[i1];
    const p2 = polymerData[i2];

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Property,${p1.polymer_name},${p2.polymer_name}\n`;
    csvContent += `Type,${p1.type},${p2.type}\n`;
    csvContent += `Density,${p1.density},${p2.density}\n`;
    csvContent += `Glass Transition (Tg),${p1.glass_transition_temperature},${p2.glass_transition_temperature}\n`;
    csvContent += `Melting Point (Tm),${p1.melting_point},${p2.melting_point}\n`;
    csvContent += `Tensile Strength,${p1.tensile_strength || "N/A"},${p2.tensile_strength || "N/A"}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Polymer_Comparison_${p1.polymer_name}_vs_${p2.polymer_name}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Interactive Property Map
function drawAshbyChart() {
    const ctx = document.getElementById('ashbyChart').getContext('2d');

    const parseNumber = (str) => {
        if (!str || str.toLowerCase().includes("amorphous") || str === "N/A") return null;
        const match = str.match(/-?\d+(\.\d+)?/);
        return match ? parseFloat(match[0]) : null;
    };

    const datasets = [];
    const colors = {
        "Thermoplastic": "#3498db", "Thermoset": "#e74c3c", "Elastomer": "#2ecc71",
        "Biopolymer": "#9b59b6", "Conductive Polymer": "#f39c12", "Smart Polymer": "#e67e22"
    };

    const groupedData = {};

    polymerData.forEach(poly => {
        const x = parseNumber(poly.density);
        const y = parseNumber(poly.glass_transition_temperature);

        if (x !== null && y !== null) {
            if (!groupedData[poly.type]) groupedData[poly.type] = [];
            groupedData[poly.type].push({ x: x, y: y, name: poly.polymer_name });
        }
    });

    for (const [type, points] of Object.entries(groupedData)) {
        datasets.push({
            label: type, data: points, backgroundColor: colors[type] || "#95a5a6",
            pointRadius: 6, pointHoverRadius: 9
        });
    }

    ashbyChartInstance = new Chart(ctx, {
        type: 'scatter',
        data: { datasets: datasets },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Material Property Map: Density vs. Tg', font: { size: 16 } },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const point = context.raw;
                            return `${point.name} (Density: ${point.x}, Tg: ${point.y}°C)`;
                        }
                    }
                }
            },
            scales: {
                x: { title: { display: true, text: 'Density (g/cm³)', font: { weight: 'bold' } } },
                y: { title: { display: true, text: 'Glass Transition Temp (Tg) °C', font: { weight: 'bold' } } }
            }
        }
    });
}

// ==========================================
// NEW: STRUCTURED 5-QUESTION EXAM ENGINE
// ==========================================

let currentQuestionIndex = 0;
const totalQuestions = 5;
let currentScore = 0;
let quizHistory = [];
let currentCorrectAnswer = "";
let currentQuestionText = "";

function startStructuredQuiz() {
    document.getElementById('quizSetup').style.display = 'none';
    document.getElementById('quizContainer').style.display = 'block';
    document.getElementById('scorecardContainer').style.display = 'none';

    // Reset variables
    currentQuestionIndex = 0;
    currentScore = 0;
    quizHistory = [];

    document.getElementById('quizLiveScore').innerText = `Score: 0`;
    loadQuizQuestion();
}

function loadQuizQuestion() {
    document.getElementById('quizFeedback').innerText = '';
    document.getElementById('nextQuestionBtn').style.display = 'none';
    document.getElementById('finishQuizBtn').style.display = 'none';
    document.getElementById('questionNumberDisplay').innerText = `Question ${currentQuestionIndex + 1} of ${totalQuestions}`;

    const difficulty = document.getElementById('quizDifficulty').value;
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';

    const targetPolymer = polymerData[Math.floor(Math.random() * polymerData.length)];
    let question = "";

    if (difficulty === 'easy') {
        const types = ["applications", "type"];
        const qType = types[Math.floor(Math.random() * types.length)];

        if (qType === "applications" && targetPolymer.applications !== "N/A") {
            question = `Which polymer is primarily used for: "${targetPolymer.applications}"?`;
            currentCorrectAnswer = targetPolymer.polymer_name;
        } else {
            question = `What category of polymer is ${targetPolymer.polymer_name}?`;
            currentCorrectAnswer = targetPolymer.type;
        }
    } else if (difficulty === 'medium') {
        question = `Which polymer has a Glass Transition Temperature (Tg) of roughly ${targetPolymer.glass_transition_temperature}?`;
        currentCorrectAnswer = targetPolymer.polymer_name;
    } else if (difficulty === 'hard') {
        question = `Identify the polymer with a Density of ${targetPolymer.density} and Melting Point of ${targetPolymer.melting_point}:`;
        currentCorrectAnswer = targetPolymer.polymer_name;
    }

    if (!currentCorrectAnswer || currentCorrectAnswer === "N/A") {
        return loadQuizQuestion(); // Retry if we hit bad data
    }

    currentQuestionText = question;
    document.getElementById('questionText').innerText = question;

    let options = [currentCorrectAnswer];
    let attempts = 0;
    while (options.length < 4 && attempts < 50) {
        attempts++;
        const randomPoly = polymerData[Math.floor(Math.random() * polymerData.length)];
        let wrongOption = "";

        if (difficulty === 'easy' && question.includes("category")) {
            wrongOption = randomPoly.type;
        } else {
            wrongOption = randomPoly.polymer_name;
        }

        if (!options.includes(wrongOption) && wrongOption !== "N/A") {
            options.push(wrongOption);
        }
    }

    options.sort(() => Math.random() - 0.5);

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.style.backgroundColor = '#f8f9fa';
        btn.style.color = '#2c3e50';
        btn.style.border = '2px solid #bdc3c7';
        btn.style.textAlign = 'left';
        btn.style.padding = '10px';
        btn.style.borderRadius = '6px';
        btn.style.cursor = 'pointer';

        btn.onmouseover = () => btn.style.backgroundColor = '#ebf5fb';
        btn.onmouseout = () => btn.style.backgroundColor = '#f8f9fa';

        btn.onclick = () => checkQuizAnswer(btn, opt, optionsContainer);
        optionsContainer.appendChild(btn);
    });
}

function checkQuizAnswer(clickedBtn, selectedValue, container) {
    const feedback = document.getElementById('quizFeedback');
    const allButtons = container.querySelectorAll('button');

    allButtons.forEach(b => {
        b.disabled = true;
        b.onmouseover = null;
        b.onmouseout = null;
        b.style.cursor = 'default';
    });

    const isCorrect = (selectedValue === currentCorrectAnswer);

    // Save data for the Scorecard later
    quizHistory.push({
        question: currentQuestionText,
        userAnswer: selectedValue,
        correctAnswer: currentCorrectAnswer,
        isCorrect: isCorrect
    });

    if (isCorrect) {
        currentScore++;
        document.getElementById('quizLiveScore').innerText = `Score: ${currentScore}`;
        clickedBtn.style.backgroundColor = '#2ecc71';
        clickedBtn.style.color = 'white';
        clickedBtn.style.borderColor = '#2ecc71';
        feedback.innerText = "✅ Correct!";
        feedback.style.color = '#27ae60';
    } else {
        clickedBtn.style.backgroundColor = '#e74c3c';
        clickedBtn.style.color = 'white';
        clickedBtn.style.borderColor = '#e74c3c';
        feedback.innerText = `❌ Incorrect.`;
        feedback.style.color = '#c0392b';

        allButtons.forEach(b => {
            if (b.innerText === currentCorrectAnswer) {
                b.style.backgroundColor = '#2ecc71';
                b.style.color = 'white';
                b.style.borderColor = '#2ecc71';
            }
        });
    }

    // Check if exam is over
    if (currentQuestionIndex < totalQuestions - 1) {
        document.getElementById('nextQuestionBtn').style.display = 'inline-block';
    } else {
        document.getElementById('finishQuizBtn').style.display = 'inline-block';
    }
}

function nextQuestion() {
    currentQuestionIndex++;
    loadQuizQuestion();
}

function showScorecard() {
    document.getElementById('quizContainer').style.display = 'none';
    document.getElementById('scorecardContainer').style.display = 'block';

    document.getElementById('finalScoreDisplay').innerText = `${currentScore} / ${totalQuestions}`;

    const resultsContainer = document.getElementById('scorecardResults');
    resultsContainer.innerHTML = '';

    quizHistory.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = `scorecard-item ${item.isCorrect ? 'correct' : 'incorrect'}`;

        let html = `<p style="margin-top:0;"><strong>Q${index + 1}: ${item.question}</strong></p>`;

        if (item.isCorrect) {
            html += `<p style="color: #27ae60; margin: 5px 0;">✅ Your Answer: ${item.userAnswer}</p>`;
        } else {
            html += `<p style="color: #c0392b; margin: 5px 0;">❌ Your Answer: ${item.userAnswer}</p>`;
            html += `<p style="color: #27ae60; margin: 5px 0;">✅ Correct Answer: ${item.correctAnswer}</p>`;
        }

        div.innerHTML = html;
        resultsContainer.appendChild(div);
    });
}