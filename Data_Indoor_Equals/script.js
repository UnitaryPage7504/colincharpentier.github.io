const map = new maplibregl.Map({
    container: 'map',
    zoom: 18,
    pitch: 30,
    center: [0.6775, 47.3662],
    style: {
        "version": 8,
        "sources": {
            "satellite": {
                "type": "raster",
                "tiles": [
                    "https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}"
                ],
                "tileSize": 256
            }
        },
        "layers": [{
            "id": "satellite",
            "type": "raster",
            "source": "satellite"
        }]
    }
});

map.addControl(new maplibregl.NavigationControl({
    visualizePitch: true,
    showZoom: true,
    showCompass: true
}));

let indoorEqual;
map.on('load', function() {
    indoorEqual = new IndoorEqual(map, { 
        apiKey: 'iek_nwHd3sev0GZtSyCScb8AZU3Ow74g' 
    });
    map.addControl(indoorEqual);
    
    fetch('https://raw.githubusercontent.com/UnitaryPage7504/colincharpentier.github.io/refs/heads/main/Data_Indoor_Equals/Heure_tranquille.geojson')
        .then(response => response.json())
        .then(data => {
            console.log('✅ GeoJSON chargé,', data.features.length, 'points trouvés');
            
            map.addSource('commerces', {
                type: 'geojson',
                data: data
            });
            
            // Définir les catégories et leurs couleurs
            const categories = [
                { nom: 'Restauration', couleur: '#FF6347' },
                { nom: 'Mode & Accessoires', couleur: '#6A5ACD' },
                { nom: 'Beauté & Bien-être', couleur: '#FF69B4' },
                { nom: 'Santé', couleur: '#2ECC71' },
                { nom: 'High-Tech & Services', couleur: '#E67E22' },
                { nom: 'Alimentation & Gourmandises', couleur: '#F39C12' },
                { nom: 'Décoration & Maison', couleur: '#27AE60' },
                { nom: 'Toilettes', couleur: '#95A5A6' }
            ];
            
            // Créer une couche par catégorie avec un filtre sur le nom
            categories.forEach(categorie => {
                const layerId = `commerces-${categorie.nom.toLowerCase().replace(/ & /g, '-').replace(/[^a-z0-9-]/g, '')}`;
                
                // Définir les noms des magasins pour cette catégorie
                let nomsMagasins = [];
                
                switch(categorie.nom) {
                    case 'Restauration':
                        nomsMagasins = [
                            'La Fabrique à Cookies', 'Saveurs & Gourmandises', 'EatSalad',
                            'Côté Sushi', 'Subway', 'Pitaya', 'Il Restorante', 'Au Bureau',
                            'La Côte et l’Arête', 'Holly\'s Dinner', 'IT Italian Trattoria',
                            'Nachos', 'Le Patacrêpe', 'Le paradis du fruit', 'Sushi Kyo',
                            'Waffle Factory'
                        ];
                        break;
                    case 'Mode & Accessoires':
                        nomsMagasins = [
                            'H&M', 'Zara', 'Undiz', 'Le Temps des Cerises', 'New Yorker',
                            'RougeGorge', 'Jack & Jones', 'Les Petites Bombes', 'claire\'s',
                            'Foot Locker', 'Chaussea', 'Bel Chou\'s', 'Arthur & Aston',
                            'Histoire d\'Or', 'Moa'
                        ];
                        break;
                    case 'Beauté & Bien-être':
                        nomsMagasins = [
                            'Sephora', 'Nyx', 'Bleu Libellule', 'Rituals...', 'Adopt\'',
                            'LOX', 'ikxis coiffure', 'Dépil Tech'
                        ];
                        break;
                    case 'Santé':
                        nomsMagasins = ['Krys', 'L\'Opticien concept', 'Normal'];
                        break;
                    case 'High-Tech & Services':
                        nomsMagasins = ['Bouygues Telecom', 'SFR', 'Vap\'yoo', 'Docteur IT'];
                        break;
                    case 'Alimentation & Gourmandises':
                        nomsMagasins = ['Monoprix', 'Lolly\'s', 'Gâteaux Louisa', 'Jeff de Bruges', 'Biotech USA'];
                        break;
                    case 'Décoration & Maison':
                        nomsMagasins = ['muy mucho'];
                        break;
                    case 'Toilettes':
                        nomsMagasins = [''];
                        break;
                }
                
                // Créer un filtre "match" pour cette catégorie
                const filter = ['match', ['get', 'name'], ...nomsMagasins.flatMap(n => [n, true]), false];
                
                // Ajouter la couche pour cette catégorie
                map.addLayer({
                    'id': layerId,
                    'type': 'circle',
                    'source': 'commerces',
                    'filter': filter,
                    'paint': {
                        'circle-radius': 12,
                        'circle-color': categorie.couleur,
                        'circle-stroke-width': 2,
                        'circle-stroke-color': '#FFFFFF'
                    }
                });
                
                // Ajouter un filtre dans la barre latérale avec la couleur correspondante
                ajouterFiltreSidebar(categorie.nom, categorie.couleur, layerId);
            });
            
            // Ajouter une couche pour les labels (visible pour tous)
            map.addLayer({
                'id': 'commerces-labels',
                'type': 'symbol',
                'source': 'commerces',
                'layout': {
                    'text-field': ['get', 'name'],
                    'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                    'text-offset': [0, 1.8],
                    'text-anchor': 'top',
                    'text-size': 12
                },
                'paint': {
                    'text-color': '#000000',
                    'text-halo-color': '#FFFFFF',
                    'text-halo-width': 3
                }
            });
            
            // ============================================
            // POPUP AU SURVOL
            // ============================================
            
            // Créer une popup
            const popup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
                offset: [0, -15]
            });
            
// Dictionnaire des logos par nom de magasin
const logos = {
    // === RESTAURATION ===
    'La Fabrique à Cookies': 'URL_LOGO_LA_FABRIQUE_A_COOKIES',
    'Saveurs & Gourmandises': 'URL_LOGO_SAVEURS_GOURMANDISES',
    'EatSalad': 'URL_LOGO_EATSALAD',
    'Côté Sushi': 'URL_LOGO_COTE_SUSHI',
    'Subway': 'URL_LOGO_SUBWAY',
    'Pitaya': 'URL_LOGO_PITAYA',
    'Il Restorante': 'URL_LOGO_IL_RESTORANTE',
    'Au Bureau': 'URL_LOGO_AU_BUREAU',
    'La Côte et l’Arête': 'URL_LOGO_COTE_ARETE',
    'Holly\'s Dinner': 'URL_LOGO_HOLLYS_DINNER',
    'IT Italian Trattoria': 'URL_LOGO_IT_ITALIAN',
    'Nachos': 'URL_LOGO_NACHOS',
    'Le Patacrêpe': 'URL_LOGO_LE_PATACREPE',
    'Le paradis du fruit': 'URL_LOGO_PARADIS_FRUIT',
    'Sushi Kyo': 'URL_LOGO_SUSHI_KYO',
    'Waffle Factory': 'URL_LOGO_WAFFLE_FACTORY',

    // === MODE & ACCESSOIRES ===
    'H&M': 'URL_LOGO_HM',
    'Zara': 'URL_LOGO_ZARA',
    'Undiz': 'URL_LOGO_UNDIZ',
    'Le Temps des Cerises': 'URL_LOGO_TEMPS_CERISES',
    'New Yorker': 'URL_LOGO_NEW_YORKER',
    'RougeGorge': 'URL_LOGO_ROUGEGORGE',
    'Jack & Jones': 'URL_LOGO_JACK_JONES',
    'Les Petites Bombes': 'URL_LOGO_PETITES_BOMBES',
    'claire\'s': 'URL_LOGO_CLAIRES',
    'Foot Locker': 'URL_LOGO_FOOT_LOCKER',
    'Chaussea': 'URL_LOGO_CHAUSSEA',
    'Bel Chou\'s': 'URL_LOGO_BEL_CHOUS',
    'Arthur & Aston': 'URL_LOGO_ARTHUR_ASTON',
    'Histoire d\'Or': 'URL_LOGO_HISTOIRE_OR',
    'Moa': 'URL_LOGO_MOA',

    // === BEAUTÉ & BIEN-ÊTRE ===
    'Sephora': 'URL_LOGO_SEPHORA',
    'Nyx': 'URL_LOGO_NYX',
    'Bleu Libellule': 'URL_LOGO_BLEU_LIBELLULE',
    'Rituals...': 'URL_LOGO_RITUALS',
    'Adopt\'': 'URL_LOGO_ADOPT',
    'LOX': 'URL_LOGO_LOX',
    'ikxis coiffure': 'URL_LOGO_IKXIS',
    'Dépil Tech': 'URL_LOGO_DEPIL_TECH',

    // === SANTÉ ===
    'Krys': 'URL_LOGO_KRYS',
    'L\'Opticien concept': 'URL_LOGO_OPTICIEN_CONCEPT',
    'Normal': 'URL_LOGO_NORMAL',

    // === HIGH-TECH & SERVICES ===
    'Bouygues Telecom': 'URL_LOGO_BOUYGUES',
    'SFR': 'URL_LOGO_SFR',
    'Vap\'yoo': 'URL_LOGO_VAPYOO',
    'Docteur IT': 'URL_LOGO_DOCTEUR_IT',

    // === ALIMENTATION & GOURMANDISES ===
    'Monoprix': 'URL_LOGO_MONOPRIX',
    'Lolly\'s': 'URL_LOGO_LOLLYS',
    'Gâteaux Louisa': 'URL_LOGO_GATEAUX_LOUISA',
    'Jeff de Bruges': 'URL_LOGO_JEFF_DE_BRUGES',
    'Biotech USA': 'URL_LOGO_BIOTECH_USA',

    // === DÉCORATION & MAISON ===
    'muy mucho': 'URL_LOGO_MUY_MUCHO',

    // === TOILETTES (pas de logo) ===
    '': null
};
            
            // Fonction pour obtenir le logo d'un magasin
            function getLogoUrl(nomMagasin) {
                return logos[nomMagasin] || null;
            }
            
            // Gérer le survol des points
            map.on('mouseenter', 'commerces-points', (e) => {
                // Changer le curseur
                map.getCanvas().style.cursor = 'pointer';
                
                // Récupérer les informations du magasin
                const coordinates = e.features[0].geometry.coordinates.slice();
                const properties = e.features[0].properties;
                const nom = properties.name || 'Magasin sans nom';
                
                // Construire le contenu HTML de la popup
                let popupContent = '';
                
                // Ajouter le logo si disponible
                const logoUrl = getLogoUrl(nom);
                if (logoUrl) {
                    popupContent += `<img src="${logoUrl}" style="max-width: 50px; max-height: 50px; display: block; margin: 0 auto 5px;">`;
                }
                
                // Ajouter le nom du magasin
                popupContent += `<strong style="font-size: 14px;">${nom}</strong>`;
                
                // Ajouter la catégorie et la couleur
                const categorieTrouvee = categories.find(c => 
                    e.features[0].layer.id.includes(c.nom.toLowerCase().replace(/ & /g, '-').replace(/[^a-z0-9-]/g, ''))
                );
                
                if (categorieTrouvee) {
                    popupContent += `<br><span style="color: ${categorieTrouvee.couleur}; font-size: 12px;">${categorieTrouvee.nom}</span>`;
                }
                
                // Ajouter le téléphone si disponible
                if (properties.phone) {
                    popupContent += `<br><span style="font-size: 11px;">📞 ${properties.phone}</span>`;
                }
                
                // Ajouter le site web si disponible
                if (properties.website) {
                    popupContent += `<br><a href="${properties.website}" target="_blank" style="font-size: 11px;">🌐 Site web</a>`;
                }
                
                // Afficher la popup
                popup.setLngLat(coordinates)
                    .setHTML(popupContent)
                    .addTo(map);
            });
            
            map.on('mouseleave', 'commerces-points', () => {
                map.getCanvas().style.cursor = '';
                popup.remove();
            });
            
            console.log('✅ Points colorés par catégorie ajoutés');
        })
        .catch(error => {
            console.error('❌ Erreur:', error);
        });
});

// Fonction pour ajouter un filtre dans la barre latérale
function ajouterFiltreSidebar(nomCategorie, couleur, layerId) {
    const sidebar = document.getElementById('sidebar');
    
    // Créer le conteneur du filtre s'il n'existe pas
    let filterGroup = document.getElementById('filter-group');
    if (!filterGroup) {
        filterGroup = document.createElement('div');
        filterGroup.id = 'filter-group';
        filterGroup.className = 'filter-group';
        sidebar.appendChild(filterGroup);
        
        // Ajouter un titre
        const titre = document.createElement('h5');
        titre.className = 'mb-3';
        titre.textContent = 'Filtres par catégorie';
        filterGroup.appendChild(titre);
    }
    
    // Créer les éléments du filtre (checkbox + label)
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = `filter-${layerId}`;
    input.checked = true;
    filterGroup.appendChild(input);
    
    const label = document.createElement('label');
    label.setAttribute('for', `filter-${layerId}`);
    label.textContent = nomCategorie;
    label.style.backgroundColor = couleur;
    filterGroup.appendChild(label);
    
    // Ajouter l'événement de filtrage
    input.addEventListener('change', (e) => {
        map.setLayoutProperty(
            layerId,
            'visibility',
            e.target.checked ? 'visible' : 'none'
        );
        
        if (e.target.checked) {
            label.style.backgroundColor = couleur;
            label.style.opacity = '1';
        } else {
            label.style.backgroundColor = '#cccccc';
            label.style.opacity = '0.7';
        }
    });
}

// Ajouter le style CSS pour les filtres dans la barre latérale
const style = document.createElement('style');
style.textContent = `
    .filter-group {
        font: 12px/20px 'Helvetica Neue', Arial, Helvetica, sans-serif;
        font-weight: 600;
        border-radius: 3px;
        width: 100%;
        color: #fff;
    }

    .filter-group input[type='checkbox']:first-child + label {
        border-radius: 3px 3px 0 0;
    }

    .filter-group label:last-child {
        border-radius: 0 0 3px 3px;
        border: none;
    }

    .filter-group input[type='checkbox'] {
        display: none;
    }

    .filter-group input[type='checkbox'] + label {
        display: block;
        cursor: pointer;
        padding: 10px;
        margin-bottom: 2px;
        border-radius: 5px;
        transition: all 0.3s ease;
    }

    .filter-group input[type='checkbox'] + label:hover {
        filter: brightness(90%);
    }

    .filter-group input[type='checkbox']:checked + label:before {
        content: '✔';
        margin-right: 5px;
    }
    
    .filter-group h5 {
        color: #333;
        margin-bottom: 15px;
    }
`;
document.head.appendChild(style);