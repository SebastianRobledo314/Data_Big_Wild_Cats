let catData;
let infoBoard;

function preload() {
  // Load the JSON data
  catData = loadJSON('Cat_Data.json');
}

function setup() {
  noCanvas(); // We are using DOM elements
  
  infoBoard = select('#info-board');
  const zoomLayer = select('#zoom-layer');
  const closeBtn = select('#close-btn');
  const mainTitle = select('#main-title');
  const body = select('body');
  
  // Select all cat stickers
  const stickers = selectAll('.cat-sticker');
  
  stickers.forEach(sticker => {
    // Add rings based on conservation status
    const speciesName = sticker.attribute('data-species');
    const cat = findCatData(speciesName);
    if (cat) {
        let status = cat.conservation_status.toLowerCase();
        if (status.includes('least concern')) {
            sticker.addClass('status-green');
        } else if (status.includes('vulnerable')) {
            sticker.addClass('status-yellow');
        } else if (status.includes('critically endangered')) {
            sticker.addClass('status-red');
        } else if (status.includes('endangered')) {
            sticker.addClass('status-orange');
        } else if (status.includes('near threatened')) {
            sticker.addClass('status-yellow'); 
        }
    }

    sticker.mousePressed(() => {
        const speciesName = sticker.attribute('data-species');
        const cat = findCatData(speciesName);
        
        if (cat) {
            updateInfoBoard(cat); // Populate data
            
            // Improved Zoom Calculation
            // We use the original CSS left/top values which are relative to the container (1728x1117)
            // This is safer than DOM offset measures if the element is already transformed
            
            // Parse '100px' to 100
            let left = parseFloat(sticker.style('left')); 
            let top = parseFloat(sticker.style('top'));
            
            // If not found in inline style, compute it
            let comp = window.getComputedStyle(sticker.elt);
            let stickerLeft = parseFloat(comp.left);
            let stickerTop = parseFloat(comp.top);
            let stickerWidth = parseFloat(comp.width);
            let stickerHeight = parseFloat(comp.height);
            
            // Handle cases where CSS uses 'auto' (less likely here but good to be safe)
            if (isNaN(stickerLeft)) stickerLeft = sticker.elt.offsetLeft;
            if (isNaN(stickerTop)) stickerTop = sticker.elt.offsetTop;

            let targetX = stickerLeft + stickerWidth / 2;
            let targetY = stickerTop + stickerHeight / 2;
            
            // Set transform origin
            zoomLayer.style('transform-origin', `${targetX}px ${targetY}px`);
             
            // Scale
            zoomLayer.style('transform', 'scale(3)'); 
            
            body.addClass('is-zoomed');
            
        } else {
            console.log("Cat data not found for: " + speciesName);
        }
        
        return false;
    });
  });

  // Close functionality
  closeBtn.mousePressed(() => {
    body.removeClass('is-zoomed');
    zoomLayer.style('transform', 'scale(1)');
    // Resetting transform origin isn't strictly necessary but good practice if we want to default to center or top-left
    // zoomLayer.style('transform-origin', '0 0'); // Wait until transition ends? 
    // Just leaving current origin is fine for zooming out to the same spot.
  });
}

function updateInfoBoard(cat) {
    select('#info-title').html(cat.common_name);
    select('#info-scientific').html(`Scientific Name: ${cat.scientific_name}`);
    
    // Update status with highlight - only color the status value, not the label
    const statusEl = select('#info-status');
    statusEl.html(`Status: <span id="status-value">${cat.conservation_status}</span>`);
    
    // Remove old classes (p5 removeClass only takes one class at a time)
    statusEl.removeClass('status-green');
    statusEl.removeClass('status-yellow');
    statusEl.removeClass('status-orange');
    statusEl.removeClass('status-red');
    
    let status = cat.conservation_status.toLowerCase();
    if (status.includes('least concern')) {
        statusEl.addClass('status-green');
    } else if (status.includes('vulnerable')) {
        statusEl.addClass('status-yellow');
    } else if (status.includes('critically endangered')) {
        statusEl.addClass('status-red');
    } else if (status.includes('endangered')) {
        statusEl.addClass('status-orange');
    } else if (status.includes('near threatened')) {
        statusEl.addClass('status-yellow'); 
    }
    
    // Handle Habitats (New JSON structure vs Old)
    let habitats = [];
    if (cat.geographical_data && cat.geographical_data.habitat_types) {
        habitats = cat.geographical_data.habitat_types;
    } else if (cat.habitat_types) {
        habitats = cat.habitat_types;
    }
    
    if (habitats.length > 0) {
        select('#info-habitats').html(`Habitats: ${habitats.join(', ')}`);
        select('#info-habitats').style('display', 'block');
    } else {
        select('#info-habitats').style('display', 'none');
    }
    
    // Additional Data
    const pop = select('#info-wild-pop');
    let wildPopVal = null;
    
    if (cat.wild_population_est) {
        wildPopVal = cat.wild_population_est;
    } else if (cat.population_history && cat.population_history.length > 0) {
        // Get the latest estimate from history
        const lastEntry = cat.population_history[cat.population_history.length - 1];
        wildPopVal = lastEntry.estimate;
    }
    
    if (wildPopVal) {
        pop.html(`Wild Pop: ${typeof wildPopVal === 'number' ? wildPopVal.toLocaleString() : wildPopVal}`);
        pop.style('display', 'block');
    } else {
        pop.style('display', 'none');
    }

    const age = select('#info-age');
    let ageData = null;
    if (cat.biological_data && cat.biological_data.age_range) {
        ageData = cat.biological_data.age_range;
    } else if (cat.age_range) {
        ageData = cat.age_range;
    }

    if (ageData && ageData.wild_avg) {
        age.html(`Lifespan: ${ageData.wild_avg} years`);
        age.style('display', 'block');
    } else {
         age.style('display', 'none');
    }

    const threat = select('#info-threats');
    let threatData = [];
    if (cat.biological_data && cat.biological_data.primary_threats) {
        threatData = cat.biological_data.primary_threats;
    } else if (cat.threats) {
        threatData = cat.threats;
    }

    if (threatData && threatData.length > 0) {
        threat.html(`Threats: ${threatData.join(', ')}`);
        threat.style('display', 'block');
    } else {
        threat.style('display', 'none');
    }

    // Update Image
    const imgPath = getCatImage(cat.common_name);
    if (imgPath) {
        select('#info-photo').attribute('src', imgPath);
    }

    let geoText = 'Locations: ';
    if (cat.geographical_data) {
        if (cat.geographical_data.range_countries && cat.geographical_data.range_countries.length > 0) {
             geoText += cat.geographical_data.range_countries.slice(0, 5).join(', ') + (cat.geographical_data.range_countries.length > 5 ? '...' : '');
        } else if (cat.geographical_data.regions && cat.geographical_data.regions.length > 0) {
             geoText += cat.geographical_data.regions.join(', ');
        } else {
            geoText += "Unknown";
        }
    }
    select('#info-geo').html(geoText);
    
    // Render Chart
    renderChart(cat);
}

function renderChart(cat) {
    const container = select('#info-chart-container');
    if (!container) return; // Guard clause
    
    container.html(''); // Clear previous chart

    if (!cat.population_history || cat.population_history.length === 0) {
        container.style('display', 'none');
        return;
    }

    container.style('display', 'flex'); // Show container

    // Title
    const title = createElement('h4', 'Population History');
    title.addClass('chart-title');
    title.parent(container);

    // Find max value to scale bars
    let maxVal = 0;
    
    // Filter out non-numeric estimates for cleaner chart
    const numericData = cat.population_history.filter(d => typeof d.estimate === 'number');

    if (numericData.length === 0) {
         container.style('display', 'none');
         return;
    }

    numericData.forEach(d => {
        let val = d.estimate;
        if (val > maxVal) maxVal = val;
    });
    
    // Special handling for Iriomote Cat to ensure bars are small and red
    if (cat.common_name === 'Iriomote Cat') {
        maxVal = 1000; // Creating a larger relative scale makes bars appear small (100/1000 = 10%)
    }

    if (maxVal === 0) maxVal = 100; // Prevent division by zero

    numericData.forEach(d => {
        const row = createDiv('');
        row.addClass('chart-row');
        row.parent(container);

        // Period Label (Year or Era)
        let labelText = d.period;
        // Try to extract year: "Historic (1900)" -> "1900"
        let yearMatch = d.period.match(/\d{4}/);
        if (yearMatch) {
             labelText = yearMatch[0];
        } else {
             // If no year, take first word or short form
             labelText = d.period.split(' ')[0];
        }
        
        const label = createSpan(labelText);
        label.addClass('chart-label');
        label.parent(row);

        // Background for bar area
        const barBg = createDiv('');
        barBg.addClass('chart-bar-bg');
        barBg.parent(row);

        // Calculate width
        let val = d.estimate;
        let percentage = (val / maxVal) * 100;
        
        if (percentage < 1) {
            percentage = 1; // Minimum visibility
        }

        const barFill = createDiv('');
        barFill.addClass('chart-bar-fill');
        barFill.style('width', percentage + '%');
        
        // Color based on percentage of max (high = green, low = red, mid = yellow/orange)
        // If > 75% -> Green
        // If 40-75% -> Yellow/Orange
        // If < 40% -> Red
        
        if (percentage > 75) {
             barFill.style('background', 'linear-gradient(90deg, #56ab2f, #a8e063)'); // Green
        } else if (percentage > 40) {
             barFill.style('background', 'linear-gradient(90deg, #fceabb, #f8b500)'); // Yellow-Orange
        } else {
             barFill.style('background', 'linear-gradient(90deg, #ff9966, #ff5e62)'); // Red
        }

        // Special override for status indicators
        if (d.status && d.status.includes('Declining')) {
             // Maybe force red/orange regardless of number?
             // barFill.style('background', 'linear-gradient(90deg, #ff9966, #ff5e62)');
        } else if (d.status === 'Recovering') {
             // barFill.style('background', 'linear-gradient(90deg, #56ab2f, #a8e063)');
        }
        
        barFill.parent(barBg);

        // Value Label
        let valText = d.estimate.toLocaleString();
        const valSpan = createSpan(valText);
        valSpan.addClass('chart-value');
        valSpan.parent(row);
    });
}

function findCatData(speciesName) {
    if (!catData || !catData.species_list) {
        console.error("Cat data not loaded");
        return null;
    }
    
    // Normalize input
    const cleanName = speciesName ? speciesName.trim() : "";
    console.log("Searching for cat:", cleanName);

    // Explicit check for Jaguar to prevent any partial match issues
    if (cleanName.toLowerCase() === "jaguar") {
        return catData.species_list.find(c => c.common_name === "Jaguar");
    }
    
    // Find the cat in the list
    // We try exact match first (case-insensitive)
    let cat = catData.species_list.find(c => c.common_name.trim().toLowerCase() === cleanName.toLowerCase());
    
    if (!cat) {
        // Fallback to partial match, but be careful not to match "Leopard" to "Snow Leopard" incorrectly
        // We only allow partial match if the search term is sufficiently long or specific
        cat = catData.species_list.find(c => 
            c.common_name.toLowerCase().includes(cleanName.toLowerCase()) || 
            (cleanName.length > 3 && cleanName.toLowerCase().includes(c.common_name.toLowerCase()))
        );
    }
    
    if (!cat) {
        console.warn("No cat found for:", cleanName);
    }
    
    return cat;
}

function displayInfo(cat, displayContainer) {
   // Legacy function, replaced by updateInfoBoard logic directly
}

function getCatImage(commonName) {
    if (!commonName) return "assets/ui/snow_leopard_photo.png";
    const name = commonName.trim();
    console.log("Getting image for:", name);

    // Ensure path uses %20 for spaces
    // const wildCatPath = "assets/wild%20cat/"; 
    const wildCatPath = "assets/wild cat/";
    
    // Map common names to file names explicitly
    const imageMap = {
        "Iriomote Cat": "Iriomote_Cat1.jpg",
        "Snow Leopard": "Snow_Leopard2.jpg",
        "Clouded Leopard": "Clouded_Leopard2.jpg",
        "Eurasian Lynx": "Eurasian_Lynx2.jpg",
        "Jaguar": "Jaguar1.jpg",
        "Tiger": "Tiger2.jpg",
        "Leopard": "leopard1.jpg", 
        "Lion": "Lion2.jpg",
        "Cheetah": "Cheeta2.jpg",
        "Cougar (Puma/Mountain Lion)": "Puma2.jpg",
        "Iberian Lynx": "Liberian_Lynx1.jpg" 
    };

    const fileName = imageMap[name];
    
    if (fileName) {
        return wildCatPath + fileName;
    }
    
    console.warn("Image not found for:", name, "Using default.");
    return "assets/ui/snow_leopard_photo.png"; 
}
