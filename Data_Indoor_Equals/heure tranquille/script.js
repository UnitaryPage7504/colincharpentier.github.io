// ============================================================
// INITIALISATION DE LA CARTE
// ============================================================
const map = new maplibregl.Map({
    container: 'map',
    zoom: 16,
    minZoom: 16,
    pitch: 30,
    center: [0.6775, 47.3662],
    maxBounds: [
        [0.6720, 47.3635],  // Sud-Ouest
        [0.6835, 47.3690]   // Nord-Est
    ],
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
        "layers": [{ "id": "satellite", "type": "raster", "source": "satellite" }]
    }
});

map.addControl(new maplibregl.NavigationControl({ visualizePitch: true, showZoom: true, showCompass: true }));

// Géolocalisation
const geolocateControl = new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true
});
map.addControl(geolocateControl);

let indoorEqual;
let currentPopup = null;
let allFeatures = [];

// ============================================================
// CATÉGORIES
// ============================================================
const categories = [
    { nom: 'Restauration',                  couleur: '#FF6347' },
    { nom: 'Mode & Accessoires',            couleur: '#6A5ACD' },
    { nom: 'Beauté & Bien-être',            couleur: '#FF69B4' },
    { nom: 'Santé',                         couleur: '#2ECC71' },
    { nom: 'High-Tech & Services',          couleur: '#E67E22' },
    { nom: 'Alimentation & Gourmandises',   couleur: '#F39C12' },
    { nom: 'Décoration & Maison',           couleur: '#27AE60' },
    { nom: 'Toilettes',                     couleur: '#95A5A6' }
];

const nomsMagasinsParCategorie = {
    'Restauration': [
        'La Fabrique à Cookies', 'Saveurs & Gourmandises', 'EatSalad',
        'Côté Sushi', 'Subway', 'Pitaya', 'Il Restorante', 'Au Bureau',
        "La Côte et l\u2019Arête", "Holly's Dinner", 'IT Italian Trattoria',
        'Nachos', 'Le Patacrêpe', 'Le paradis du fruit', 'Sushi Kyo', 'Waffle Factory'
    ],
    'Mode & Accessoires': [
        'H&M', 'Zara', 'Undiz', 'Le Temps des Cerises', 'New Yorker',
        'RougeGorge', 'Jack & Jones', 'Les Petites Bombes', "claire's",
        'Foot Locker', 'Chaussea', "Bel Chou's", 'Arthur & Aston',
        "Histoire d'Or", 'Moa', 'Mango', 'Primark'
    ],
    'Beauté & Bien-être': ['Sephora', 'Nyx', 'Bleu Libellule', 'Rituals...', "Adopt'", 'LOX', 'ikxis coiffure', 'Dépil Tech'],
    'Santé': ['Krys', "L'Opticien concept", 'Normal'],
    'High-Tech & Services': ['Bouygues Telecom', 'SFR', "Vap'yoo", 'Docteur IT'],
    'Alimentation & Gourmandises': ['Monoprix', "Lolly's", 'Gâteaux Louisa', 'Jeff de Bruges', 'Biotech USA'],
    'Décoration & Maison': ['muy mucho'],
    'Toilettes': ['Toilettes']
};

const categorieParNom = {};
categories.forEach(cat => {
    (nomsMagasinsParCategorie[cat.nom] || []).forEach(nom => { categorieParNom[nom] = cat; });
});

// ============================================================
// HORAIRES
// ============================================================
const horaires = {
    'La Fabrique à Cookies':    { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Saveurs & Gourmandises':   { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'EatSalad':                 { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Côté Sushi':               { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Subway':                   { semaine: '10:00-21:00', dimanche: '11:00-20:00' },
    'Pitaya':                   { semaine: '11:00-22:00', dimanche: '11:00-22:00' },
    'Il Restorante':            { semaine: '11:30-22:00', dimanche: '11:30-22:00' },
    'Au Bureau':                { semaine: '11:00-23:00', dimanche: '11:00-23:00' },
    "La Côte et l\u2019Arête":  { semaine: '11:30-22:00', dimanche: '11:30-22:00' },
    "Holly's Dinner":           { semaine: '11:00-22:00', dimanche: '11:00-22:00' },
    'IT Italian Trattoria':     { semaine: '11:30-22:00', dimanche: '11:30-22:00' },
    'Nachos':                   { semaine: '11:00-22:00', dimanche: '11:00-22:00' },
    'Le Patacrêpe':             { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Le paradis du fruit':      { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Sushi Kyo':                { semaine: '11:00-22:00', dimanche: '11:00-22:00' },
    'Waffle Factory':           { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'H&M':                      { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Zara':                     { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Undiz':                    { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Le Temps des Cerises':     { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'New Yorker':               { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'RougeGorge':               { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Jack & Jones':             { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Les Petites Bombes':       { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    "claire's":                 { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Foot Locker':              { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Chaussea':                 { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    "Bel Chou's":               { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Arthur & Aston':           { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    "Histoire d'Or":            { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Moa':                      { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Mango':                    { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Primark':                  { semaine: '09:30-20:00', dimanche: '10:00-19:00' },
    'Sephora':                  { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Nyx':                      { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Bleu Libellule':           { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Rituals...':               { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    "Adopt'":                   { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'LOX':                      { semaine: '10:00-20:00', dimanche: null },
    'ikxis coiffure':           { semaine: '10:00-19:30', dimanche: null },
    'Dépil Tech':               { semaine: '10:00-19:30', dimanche: null },
    'Krys':                     { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    "L'Opticien concept":       { semaine: '10:00-20:00', dimanche: null },
    'Normal':                   { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Bouygues Telecom':         { semaine: '10:00-20:00', dimanche: null },
    'SFR':                      { semaine: '10:00-20:00', dimanche: null },
    "Vap'yoo":                  { semaine: '10:00-20:00', dimanche: null },
    'Docteur IT':               { semaine: '10:00-19:30', dimanche: null },
    'Monoprix':                 { semaine: '09:00-21:00', dimanche: '10:00-13:00' },
    "Lolly's":                  { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Gâteaux Louisa':           { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Jeff de Bruges':           { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
    'Biotech USA':              { semaine: '10:00-20:00', dimanche: null },
    'muy mucho':                { semaine: '10:00-20:00', dimanche: '11:00-19:00' },
};

function estOuvert(nom) {
    const h = horaires[nom];
    if (!h) return null;
    const now = new Date();
    const jour = now.getDay();
    const plage = (jour === 0) ? h.dimanche : h.semaine;
    if (!plage) return false;
    const [debut, fin] = plage.split('-').map(t => { const [hh, mm] = t.split(':').map(Number); return hh * 60 + mm; });
    const minutes = now.getHours() * 60 + now.getMinutes();
    return minutes >= debut && minutes < fin;
}

function badgeOuvert(nom) {
    const ouvert = estOuvert(nom);
    const h = horaires[nom];
    if (ouvert === null || !h) return '';
    const jour = new Date().getDay();
    const plage = (jour === 0) ? h.dimanche : h.semaine;
    if (ouvert) return `<span style="display:inline-block;margin-top:6px;padding:3px 10px;border-radius:12px;background:#2ECC71;color:#fff;font-size:11px;font-weight:bold;">✓ Ouvert · ${plage}</span>`;
    return `<span style="display:inline-block;margin-top:6px;padding:3px 10px;border-radius:12px;background:#E74C3C;color:#fff;font-size:11px;font-weight:bold;">✗ Fermé${plage ? ' · ' + plage : ''}</span>`;
}

// ============================================================
// LOGOS & SITES WEB
// ============================================================
const BASE = 'https://raw.githubusercontent.com/UnitaryPage7504/colincharpentier.github.io/refs/heads/main/Data_Indoor_Equals/';
const GF = 'https://www.google.com/s2/favicons?domain=';

const logos = {
    'La Fabrique à Cookies':    BASE + 'fabrique%20a%20cookies.png',
    'Saveurs & Gourmandises':   BASE + 'saveurs%20et%20gourmandises.png',
    'EatSalad':                 BASE + 'eatsalad.jpg',
    'Côté Sushi':               BASE + 'cotesushi.jpg',
    'Subway':                   BASE + 'Subway-actual-logo.png',
    'Pitaya':                   BASE + 'pitaya.jpg',
    'Il Restorante':            BASE + 'il%20restaurante.png',
    'Au Bureau':                BASE + 'Au%20bureau.jpg',
    "La Côte et l\u2019Arête": BASE + 'Logo-La-cote-et-larete.png',
    "Holly's Dinner":           BASE + 'hollys%20diner.jpg',
    'IT Italian Trattoria':     BASE + 'IT%20Italian%20restaurant.png',
    'Nachos':                   BASE + 'TR-Identite-visuelle-nachos.jpg',
    'Le Patacrêpe':             BASE + 'patacrepe.png',
    'Le paradis du fruit':      BASE + 'pardis%20du%20fruit.png',
    'Sushi Kyo':                BASE + 'sushi%20kyo.png',
    'Waffle Factory':           BASE + 'waffle%20factory.png',
    'H&M':                      GF + 'hm.com&sz=128',
    'Zara':                     GF + 'zara.com&sz=128',
    'Undiz':                    GF + 'undiz.com&sz=128',
    'Le Temps des Cerises':     GF + 'tempsdescerises.com&sz=128',
    'New Yorker':               GF + 'newyorker.de&sz=128',
    'RougeGorge':               GF + 'rougegorge.com&sz=128',
    'Jack & Jones':             GF + 'jackjones.com&sz=128',
    'Les Petites Bombes':       GF + 'lespetitesbombes.com&sz=128',
    "claire's":                 GF + 'claires.com&sz=128',
    'Foot Locker':              GF + 'footlocker.fr&sz=128',
    'Chaussea':                 BASE + 'Chaussea%202025.png',
    "Bel Chou's":               BASE + 'belchous.png',
    'Arthur & Aston':           BASE + 'arthuretaston.png',
    "Histoire d'Or":            GF + 'histoiredor.com&sz=128',
    'Moa':                      BASE + 'moa.png',
    'Mango':                    GF + 'mango.com&sz=128',
    'Primark':                  GF + 'primark.com&sz=128',
    'Sephora':                  GF + 'sephora.fr&sz=128',
    'Nyx':                      GF + 'nyxcosmetics.fr&sz=128',
    'Bleu Libellule':           GF + 'bleulibellule.com&sz=128',
    'Rituals...':               GF + 'rituals.com&sz=128',
    "Adopt'":                   BASE + 'adopt.jpg',
    'LOX':                      GF + 'lox.fr&sz=128',
    'ikxis coiffure':           BASE + 'ikxis.jpg',
    'Dépil Tech':               GF + 'depiltech.com&sz=128',
    'Krys':                     GF + 'krys.com&sz=128',
    "L'Opticien concept":       GF + 'lopticienconcept.fr&sz=128',
    'Normal':                   BASE + 'normal.png',
    'Bouygues Telecom':         BASE + 'Bouygues_Telecom_(alt_logo).svg.png',
    'SFR':                      GF + 'sfr.fr&sz=128',
    "Vap'yoo":                  BASE + 'vapyoo.jpg',
    'Docteur IT':               BASE + 'DOCTEUR-IT.png',
    'Monoprix':                 GF + 'monoprix.fr&sz=128',
    "Lolly's":                  GF + 'lollys.fr&sz=128',
    'Gâteaux Louisa':           BASE + 'gateaux%20louisa.jpg',
    'Jeff de Bruges':           GF + 'jeff-de-bruges.com&sz=128',
    'Biotech USA':              GF + 'biotechusa.com&sz=128',
    'muy mucho':                GF + 'muymucho.com&sz=128',
    'Toilettes':                null
};
window.logos = logos;
function getLogoUrl(nom) { return logos[nom] || null; }

const sitesWeb = {
    'La Fabrique à Cookies': 'https://www.lafabriqueacookies.fr',
    'Saveurs & Gourmandises': 'https://www.saveurs-gourmandises.fr',
    'EatSalad': 'https://www.eatsalad.fr',
    'Côté Sushi': 'https://www.cotesushi.fr',
    'Subway': 'https://www.subway.fr',
    'Pitaya': 'https://www.pitaya.fr',
    'Il Restorante': 'https://www.ilrestorante.fr',
    'Au Bureau': 'https://www.aubureau.fr',
    "La Côte et l\u2019Arête": 'https://www.lacoteetlarete.fr',
    "Holly's Dinner": 'https://www.hollysdinner.fr',
    'IT Italian Trattoria': 'https://www.ittrattoria.fr',
    'Nachos': 'https://www.nachos.fr',
    'Le Patacrêpe': 'https://www.lepatacrepe.fr',
    'Le paradis du fruit': 'https://www.leparadisdufruit.fr',
    'Sushi Kyo': 'https://www.sushikyo.fr',
    'Waffle Factory': 'https://www.wafflefactory.fr',
    'H&M': 'https://www.hm.fr',
    'Zara': 'https://www.zara.com/fr',
    'Undiz': 'https://www.undiz.com',
    'Le Temps des Cerises': 'https://www.tempsdescerises.com',
    'New Yorker': 'https://www.newyorker.de/fr',
    'RougeGorge': 'https://www.rougegorge.com',
    'Jack & Jones': 'https://www.jackjones.com',
    'Les Petites Bombes': 'https://www.lespetitesbombes.com',
    "claire's": 'https://www.claires.com',
    'Foot Locker': 'https://www.footlocker.fr',
    'Chaussea': 'https://www.chaussea.fr',
    "Bel Chou's": 'https://www.belchous.fr',
    'Arthur & Aston': 'https://www.arthuretaston.com',
    "Histoire d'Or": 'https://www.histoiredor.com',
    'Moa': 'https://www.moa.fr',
    'Mango': 'https://www.mango.com',
    'Primark': 'https://www.primark.com/fr-fr',
    'Sephora': 'https://www.sephora.fr',
    'Nyx': 'https://www.nyxcosmetics.fr',
    'Bleu Libellule': 'https://www.bleulibellule.com',
    'Rituals...': 'https://www.rituals.com',
    "Adopt'": 'https://www.adoptparfums.com',
    'LOX': 'https://www.lox.fr',
    'ikxis coiffure': 'https://www.ikxis.com',
    'Dépil Tech': 'https://www.depiltech.com',
    'Krys': 'https://www.krys.com',
    "L'Opticien concept": 'https://www.lopticienconcept.fr',
    'Normal': 'https://www.normal.fr',
    'Bouygues Telecom': 'https://www.bouyguestelecom.fr',
    'SFR': 'https://www.sfr.fr',
    "Vap'yoo": 'https://www.vapyoo.fr',
    'Docteur IT': 'https://www.docteurit.com',
    'Monoprix': 'https://www.monoprix.fr',
    "Lolly's": 'https://www.lollys.fr',
    'Gâteaux Louisa': 'https://www.gateauxlouisa.fr',
    'Jeff de Bruges': 'https://www.jeff-de-bruges.com',
    'Biotech USA': 'https://www.biotechusa.com',
    'muy mucho': 'https://www.muymucho.com'
};
function getSiteWebUrl(nom) { return sitesWeb[nom] || null; }

// ============================================================
// POPUP
// ============================================================
function construirePopup(nom) {
    const logoUrl = getLogoUrl(nom);
    const siteUrl = getSiteWebUrl(nom);
    const cat = categorieParNom[nom];
    let html = '<div style="text-align:center;min-width:160px;">';
    if (logoUrl && siteUrl) {
        html += `<a href="${siteUrl}" target="_blank"><img src="${logoUrl}" style="max-width:80px;max-height:80px;display:block;margin:0 auto 8px;cursor:pointer;" onerror="this.style.display='none'"></a>`;
    } else if (logoUrl) {
        html += `<img src="${logoUrl}" style="max-width:80px;max-height:80px;display:block;margin:0 auto 8px;" onerror="this.style.display='none'">`;
    }
    html += `<strong style="font-size:15px;display:block;">${nom}</strong>`;
    if (cat) html += `<span style="color:${cat.couleur};font-size:12px;font-weight:bold;">${cat.nom}</span>`;
    html += badgeOuvert(nom);
    const h = horaires[nom];
    if (h) {
        html += `<div style="font-size:11px;color:#666;margin-top:5px;line-height:1.6;">`;
        if (h.semaine) html += `🗓 Lun-Sam : ${h.semaine}<br>`;
        html += h.dimanche ? `☀️ Dim : ${h.dimanche}` : `☀️ Fermé le dimanche`;
        html += `</div>`;
    }
    if (!logoUrl && siteUrl) html += `<br><a href="${siteUrl}" target="_blank" style="font-size:12px;display:inline-block;margin-top:8px;padding:4px 10px;background:#f0f0f0;border-radius:3px;text-decoration:none;color:#333;">🌐 Site web</a>`;
    html += '</div>';
    return html;
}

function afficherPopup(coordinates, nom) {
    if (currentPopup) { currentPopup.remove(); currentPopup = null; }
    currentPopup = new maplibregl.Popup({ closeButton: true, closeOnClick: false, maxWidth: '270px' })
        .setLngLat(coordinates)
        .setHTML(construirePopup(nom))
        .addTo(map);
    currentPopup.on('close', () => { currentPopup = null; });
}

// ============================================================
// SIDEBAR
// ============================================================
function construireSidebar(features) {
    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = '';
    sidebar.style.cssText += 'display:flex;flex-direction:column;overflow:hidden;padding:12px 14px !important;';

    // Recherche
    const searchWrap = document.createElement('div');
    searchWrap.style.cssText = 'margin-bottom:10px;';
    searchWrap.innerHTML = `<input id="search-input" type="text" placeholder="🔍 Rechercher un commerce..." style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:20px;font-size:13px;outline:none;box-sizing:border-box;">`;
    sidebar.appendChild(searchWrap);

    // Filtres
    const filterWrap = document.createElement('div');
    const filterTitle = document.createElement('div');
    filterTitle.style.cssText = 'font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;';
    filterTitle.textContent = 'Catégories';
    filterWrap.appendChild(filterTitle);

    const filterBadges = document.createElement('div');
    filterBadges.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;';
    categories.forEach(cat => {
        const layerId = `commerces-${cat.nom.toLowerCase().replace(/ & /g, '-').replace(/[^a-z0-9-]/g, '')}`;
        const badge = document.createElement('div');
        badge.className = 'cat-badge';
        badge.dataset.layerId = layerId;
        badge.dataset.active = 'true';
        badge.dataset.catNom = cat.nom;
        badge.style.cssText = `background:${cat.couleur};color:#fff;padding:3px 9px;border-radius:12px;font-size:10px;font-weight:700;cursor:pointer;transition:opacity .2s;user-select:none;`;
        badge.textContent = cat.nom;
        badge.addEventListener('click', () => {
            const active = badge.dataset.active === 'true';
            badge.dataset.active = (!active).toString();
            badge.style.opacity = active ? '0.3' : '1';
            map.setLayoutProperty(layerId, 'visibility', active ? 'none' : 'visible');
            filtrerListe();
        });
        filterBadges.appendChild(badge);
    });
    filterWrap.appendChild(filterBadges);

    // Filtre "Ouvert maintenant"
    const ouvertWrap = document.createElement('div');
    ouvertWrap.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;';

    const toggleLabel = document.createElement('label');
    toggleLabel.style.cssText = 'display:flex;align-items:center;gap:7px;cursor:pointer;user-select:none;font-size:12px;font-weight:600;color:#444;';

    const toggleInput = document.createElement('input');
    toggleInput.type = 'checkbox';
    toggleInput.id = 'filtre-ouvert';
    toggleInput.style.cssText = 'display:none;';

    const toggleSwitch = document.createElement('span');
    toggleSwitch.style.cssText = 'position:relative;display:inline-block;width:34px;height:18px;background:#ccc;border-radius:9px;transition:background .2s;flex-shrink:0;';
    const toggleKnob = document.createElement('span');
    toggleKnob.style.cssText = 'position:absolute;top:2px;left:2px;width:14px;height:14px;background:#fff;border-radius:50%;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,0.25);';
    toggleSwitch.appendChild(toggleKnob);

    toggleInput.addEventListener('change', () => {
        if (toggleInput.checked) {
            toggleSwitch.style.background = '#2ECC71';
            toggleKnob.style.left = '18px';
        } else {
            toggleSwitch.style.background = '#ccc';
            toggleKnob.style.left = '2px';
        }
        filtrerListe();
    });

    const dot = document.createElement('span');
    dot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:#2ECC71;display:inline-block;flex-shrink:0;';

    toggleLabel.appendChild(toggleInput);
    toggleLabel.appendChild(toggleSwitch);
    toggleLabel.appendChild(dot);
    toggleLabel.appendChild(document.createTextNode('Ouvert maintenant'));
    ouvertWrap.appendChild(toggleLabel);
    filterWrap.appendChild(ouvertWrap);

    sidebar.appendChild(filterWrap);

    const sep = document.createElement('hr');
    sep.style.cssText = 'border:none;border-top:1px solid #eee;margin:4px 0 8px;';
    sidebar.appendChild(sep);

    const listTitle = document.createElement('div');
    listTitle.id = 'list-title';
    listTitle.style.cssText = 'font-size:10px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;';
    listTitle.textContent = `${features.length} commerces`;
    sidebar.appendChild(listTitle);

    const liste = document.createElement('div');
    liste.id = 'commerce-liste';
    liste.style.cssText = 'overflow-y:auto;flex:1;';
    sidebar.appendChild(liste);

    afficherListe(features);
    document.getElementById('search-input').addEventListener('input', filtrerListe);
}

function afficherListe(features) {
    const liste = document.getElementById('commerce-liste');
    if (!liste) return;
    liste.innerHTML = '';
    const titre = document.getElementById('list-title');
    if (titre) titre.textContent = `${features.length} commerce${features.length !== 1 ? 's' : ''}`;

    features.forEach(feature => {
        const nom = feature.properties.name;
        if (!nom) return;
        const cat = categorieParNom[nom];
        const logoUrl = getLogoUrl(nom);
        const ouvert = estOuvert(nom);
        const coords = feature.geometry.coordinates;

        const item = document.createElement('div');
        item.style.cssText = 'display:flex;align-items:center;padding:6px 5px;border-radius:8px;cursor:pointer;transition:background .15s;margin-bottom:2px;';
        item.addEventListener('mouseenter', () => item.style.background = '#f5f5f5');
        item.addEventListener('mouseleave', () => item.style.background = '');

        const logoEl = document.createElement('div');
        logoEl.style.cssText = 'width:34px;height:34px;min-width:34px;border-radius:6px;overflow:hidden;background:#f0f0f0;display:flex;align-items:center;justify-content:center;margin-right:9px;font-size:16px;';
        if (logoUrl) {
            logoEl.innerHTML = `<img src="${logoUrl}" style="width:100%;height:100%;object-fit:contain;" onerror="this.parentElement.innerHTML='🏪'">`;
        } else { logoEl.textContent = nom === 'Toilettes' ? '🚻' : '🏪'; }

        const infos = document.createElement('div');
        infos.style.cssText = 'flex:1;min-width:0;';

        const nomEl = document.createElement('div');
        nomEl.style.cssText = 'font-size:12px;font-weight:600;color:#222;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        nomEl.textContent = nom;

        const meta = document.createElement('div');
        meta.style.cssText = 'display:flex;align-items:center;gap:5px;margin-top:2px;flex-wrap:wrap;';

        if (cat) {
            const catBadge = document.createElement('span');
            catBadge.style.cssText = `background:${cat.couleur};color:#fff;font-size:9px;font-weight:700;padding:1px 6px;border-radius:8px;`;
            catBadge.textContent = cat.nom;
            meta.appendChild(catBadge);
        }

        if (ouvert !== null) {
            const dot = document.createElement('span');
            dot.style.cssText = `width:6px;height:6px;border-radius:50%;background:${ouvert ? '#2ECC71' : '#E74C3C'};display:inline-block;flex-shrink:0;`;
            dot.title = ouvert ? 'Ouvert maintenant' : 'Fermé maintenant';
            meta.appendChild(dot);
        }

        infos.appendChild(nomEl);
        infos.appendChild(meta);
        item.appendChild(logoEl);
        item.appendChild(infos);

        item.addEventListener('click', () => {
            map.flyTo({ center: coords, zoom: 19, speed: 1.5 });
            setTimeout(() => afficherPopup(coords, nom), 700);
        });
        liste.appendChild(item);
    });
}

function filtrerListe() {
    const query = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
    const catsActives = new Set([...document.querySelectorAll('.cat-badge[data-active="true"]')].map(b => b.dataset.catNom));
    const filtreOuvert = document.getElementById('filtre-ouvert')?.checked || false;
    const filtered = allFeatures.filter(f => {
        const nom = f.properties.name || '';
        const cat = categorieParNom[nom];
        const matchQuery = nom.toLowerCase().includes(query);
        const matchCat = cat ? catsActives.has(cat.nom) : true;
        const matchOuvert = filtreOuvert ? (estOuvert(nom) === true) : true;
        return matchQuery && matchCat && matchOuvert;
    });
    afficherListe(filtered);
}

// ============================================================
// CHARGEMENT
// ============================================================
map.on('load', function () {
    indoorEqual = new IndoorEqual(map, { apiKey: 'iek_nwHd3sev0GZtSyCScb8AZU3Ow74g' });
    map.addControl(indoorEqual);

    indoorEqual.on('levelchange', (level) => {
        const vis = (level === 0 || level === '0') ? 'visible' : 'none';
        map.getStyle().layers.map(l => l.id).filter(id => id.startsWith('commerces')).forEach(id => {
            if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis);
        });
        if (currentPopup && vis === 'none') { currentPopup.remove(); currentPopup = null; }
    });

    fetch('https://raw.githubusercontent.com/UnitaryPage7504/colincharpentier.github.io/refs/heads/main/Data_Indoor_Equals/Heure_tranquille.geojson')
        .then(r => r.json())
        .then(data => {
            const entrees = { type: 'FeatureCollection', features: data.features.filter(f => f.properties.type === 'entree') };
            const seenNames = new Set();
            const commerces = {
                type: 'FeatureCollection',
                features: data.features.filter(f => {
                    if (f.properties.type === 'entree') return false;
                    const nom = f.properties.name;
                    if (seenNames.has(nom)) return false;
                    seenNames.add(nom);
                    return true;
                })
            };
            allFeatures = commerces.features;

            // Calcul automatique du centre et du zoom depuis le GeoJSON
            const allCoords = data.features
                .filter(f => f.geometry && f.geometry.coordinates)
                .map(f => f.geometry.coordinates);
            if (allCoords.length > 0) {
                const lngs = allCoords.map(c => c[0]);
                const lats = allCoords.map(c => c[1]);
                const bounds = [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
                map.fitBounds(bounds, { padding: 60, maxZoom: 18, duration: 0 });
            }

            map.addSource('commerces', { type: 'geojson', data: commerces });

            categories.forEach(cat => {
                const layerId = `commerces-${cat.nom.toLowerCase().replace(/ & /g, '-').replace(/[^a-z0-9-]/g, '')}`;
                const noms = nomsMagasinsParCategorie[cat.nom] || [];
                const filter = ['match', ['get', 'name'], ...noms.flatMap(n => [n, true]), false];
                map.addLayer({ id: layerId, type: 'circle', source: 'commerces', filter, paint: { 'circle-radius': 12, 'circle-color': cat.couleur, 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' } });
                map.on('click', layerId, (e) => {
                    if (!e.features.length) return;
                    const coords = e.features[0].geometry.coordinates.slice();
                    while (Math.abs(e.lngLat.lng - coords[0]) > 180) coords[0] += e.lngLat.lng > coords[0] ? 360 : -360;
                    afficherPopup(coords, e.features[0].properties.name);
                });
                map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'pointer');
                map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = '');
            });

            map.addLayer({
                id: 'commerces-labels', type: 'symbol', source: 'commerces',
                layout: { 'text-field': ['get', 'name'], 'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'], 'text-offset': [0, 1.8], 'text-anchor': 'top', 'text-size': 12 },
                paint: { 'text-color': '#000', 'text-halo-color': '#fff', 'text-halo-width': 3 }
            });

            // Entrées
            if (entrees.features.length > 0) {
                map.addSource('entrees', { type: 'geojson', data: entrees });
                map.addLayer({
                    id: 'entrees-cercle', type: 'circle', source: 'entrees',
                    paint: { 'circle-radius': 14, 'circle-color': ['match', ['get', 'acces'], 'voiture', '#2C3E50', '#1ABC9C'], 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' }
                });
                map.addLayer({
                    id: 'entrees-icone', type: 'symbol', source: 'entrees',
                    layout: { 'text-field': ['match', ['get', 'acces'], 'voiture', '🚗', '🚶'], 'text-size': 14, 'text-anchor': 'center' }
                });
                map.on('click', 'entrees-cercle', (e) => {
                    if (!e.features.length) return;
                    const props = e.features[0].properties;
                    const coords = e.features[0].geometry.coordinates.slice();
                    const label = props.acces === 'voiture' ? '🚗 Entrée véhicule' : '🚶 Entrée piétonne';
                    if (currentPopup) { currentPopup.remove(); currentPopup = null; }
                    currentPopup = new maplibregl.Popup({ closeButton: true, closeOnClick: false })
                        .setLngLat(coords)
                        .setHTML(`<div style="text-align:center;padding:4px 8px;"><strong style="font-size:15px;">${label}</strong>${props.name ? `<br><span style="font-size:12px;color:#555;">${props.name}</span>` : ''}</div>`)
                        .addTo(map);
                    currentPopup.on('close', () => { currentPopup = null; });
                });
                map.on('mouseenter', 'entrees-cercle', () => map.getCanvas().style.cursor = 'pointer');
                map.on('mouseleave', 'entrees-cercle', () => map.getCanvas().style.cursor = '');
            }

            construireSidebar(allFeatures);
        })
        .catch(err => console.error('❌ Erreur:', err));
});

// CSS
const style = document.createElement('style');
style.textContent = `
    #search-input:focus { border-color: #6A5ACD !important; box-shadow: 0 0 0 2px rgba(106,90,205,0.15); }
    .maplibregl-popup { font: 12px/20px 'Helvetica Neue', Arial, sans-serif; }
    .maplibregl-popup-content { padding: 14px; border-radius: 10px; }
    #commerce-liste::-webkit-scrollbar { width: 4px; }
    #commerce-liste::-webkit-scrollbar-track { background: transparent; }
    #commerce-liste::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
`;
document.head.appendChild(style);