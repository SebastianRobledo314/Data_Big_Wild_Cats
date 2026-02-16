let catData;

function preload() {
  // Load the JSON data
  catData = loadJSON('Cat_Data.json');
}

function setup() {
  noCanvas(); // We are using DOM elements, not the canvas
  
  const buttonContainer = select('#button-container');
  const infoDisplay = select('#info-display');
  
  // Access the species_list from the loaded data
  if (catData && catData.species_list) {
    const species = catData.species_list;
    
    // Create a button for each species
    for (let i = 0; i < species.length; i++) {
        let cat = species[i];
        let btn = createButton(cat.common_name);
        btn.parent(buttonContainer);
        
        // Add click event to display info
        btn.mousePressed(() => {
            displayInfo(cat, infoDisplay);
        });
    }
  }
}

function displayInfo(cat, displayContainer) {
    // Clear previous content
    displayContainer.html('');
    
    // Create new content
    let nameTitle = createElement('h2', cat.common_name);
    nameTitle.parent(displayContainer);
    
    let scientificName = createP(`<strong>Scientific Name:</strong> ${cat.scientific_name}`);
    scientificName.parent(displayContainer);
    
    let status = createP(`<strong>Conservation Status:</strong> ${cat.conservation_status}`);
    status.parent(displayContainer);
    
    let habitats = createP(`<strong>Habitats:</strong> ${cat.habitat_types.join(', ')}`);
    habitats.parent(displayContainer);
    
    // Geographical Data processing
    let geoHTML = '<strong>Geographical Data:</strong><ul style="margin-top:5px; margin-bottom:0">';
    if (cat.geographical_data.regions) {
        geoHTML += `<li>Regions: ${cat.geographical_data.regions.join(', ')}</li>`;
    }
    if (cat.geographical_data.range_countries) {
        // Show first 5 countries if there are many
        let countries = cat.geographical_data.range_countries;
        let countryText = countries.length > 5 ? 
            countries.slice(0, 5).join(', ') + '...' : 
            countries.join(', ');
        geoHTML += `<li>Range Countries: ${countryText}</li>`;
    }
    geoHTML += '</ul>';
    
    let geoData = createP(geoHTML);
    geoData.parent(displayContainer);
}
