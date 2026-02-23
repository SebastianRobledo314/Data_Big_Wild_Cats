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
    select('#info-status').html(`Status: ${cat.conservation_status}`);
    select('#info-habitats').html(`Habitats: ${cat.habitat_types.join(', ')}`);
    
    // Update Image
    const imgPath = getCatImage(cat.common_name);
    if (imgPath) {
        select('#info-photo').attribute('src', imgPath);
    }

    let geoText = 'Locations: ';
    if (cat.geographical_data && cat.geographical_data.range_countries) {
        geoText += cat.geographical_data.range_countries.slice(0, 5).join(', ') + (cat.geographical_data.range_countries.length > 5 ? '...' : '');
    }
    select('#info-geo').html(geoText);
}

function findCatData(speciesName) {
    if (!catData || !catData.species_list) return null;
    
    // Find the cat in the list
    // We try exact match first
    let cat = catData.species_list.find(c => c.common_name === speciesName);
    
    // If not found, try partial match (e.g. "Cougar" vs "Cougar (Puma/Mountain Lion)")
    if (!cat) {
        cat = catData.species_list.find(c => c.common_name.includes(speciesName) || speciesName.includes(c.common_name));
    }
    
    return cat;
}

function displayInfo(cat, displayContainer) {
   // Legacy function, replaced by updateInfoBoard logic directly
}

function getCatImage(commonName) {
    const images = {
        "Iriomote Cat": "assets/wild cat/Iriomote_Cat1.jpg",
        "Snow Leopard": "assets/wild cat/Snow_Leopard2.jpg",
        "Clouded Leopard": "assets/wild cat/Clouded_Leopard2.jpg",
        "Eurasian Lynx": "assets/wild cat/Eurasian_Lynx2.jpg.jpg",
        "Jaguar": "assets/wild cat/Jaguar1.jpg",
        "Tiger": "assets/wild cat/Tiger2.jpg",
        "Leopard": "assets/wild cat/leopard1.jpg",  // check capitalization
        "Lion": "assets/wild cat/Lion2.jpg",
        "Cheetah": "assets/wild cat/Cheeta2.jpg",
        "Cougar (Puma/Mountain Lion)": "assets/wild cat/Puma2.jpg",
        "Iberian Lynx": "assets/wild cat/Liberian_Lynx1.jpg" // Assuming Liberian = Iberian here
    };
    
    return images[commonName] || "assets/ui/snow_leopard_photo.png"; // Default
}
