/**
 * Geocode a location string to [longitude, latitude] using OpenStreetMap Nominatim (free, no API key).
 * Returns [0, 0] if geocoding fails.
 */
async function geocode(location) {
    try {
        const query = encodeURIComponent(location);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'WanderlustApp/1.0'  // Nominatim requires a User-Agent
            }
        });

        const data = await response.json();

        if (data && data.length > 0) {
            const lng = parseFloat(data[0].lon);
            const lat = parseFloat(data[0].lat);
            return [lng, lat]; // GeoJSON format: [longitude, latitude]
        }

        console.log('Geocoding: No results found for', location);
        return [0, 0];
    } catch (err) {
        console.error('Geocoding error:', err.message);
        return [0, 0];
    }
}

module.exports = geocode;
