const axios = require('axios');

/**
 * Maps & Distance Tool
 * Handles location-based queries using Google Maps API or OpenStreetMap
 */
class MapsDistanceTool {
    constructor() {
        this.googleMapsKey = process.env.GOOGLE_MAPS_API_KEY;
        this.useGoogleMaps = !!this.googleMapsKey;
        
        if (this.useGoogleMaps) {
            console.log('[MAPS_TOOL] ✅ Google Maps API enabled');
        } else {
            console.log('[MAPS_TOOL] ⚠️  Using free OpenStreetMap (Google Maps API key not found)');
        }
    }

    /**
     * Calculate distance between two locations
     */
    async calculateDistance(origin, destination) {
        try {
            console.log(`[MAPS_TOOL] Calculating distance from ${origin} to ${destination}`);

            if (this.useGoogleMaps) {
                return await this.googleMapsDistance(origin, destination);
            } else {
                return await this.openStreetMapDistance(origin, destination);
            }
        } catch (error) {
            console.error('[MAPS_TOOL] Distance calculation error:', error.message);
            return { error: 'Unable to calculate distance. Please try again.' };
        }
    }

    /**
     * Find nearby places (schools, hospitals, etc.)
     */
    async findNearbyPlaces(location, placeType, radius = 5000) {
        try {
            console.log(`[MAPS_TOOL] Finding ${placeType} near ${location} within ${radius}m`);
            console.log(`[MAPS_TOOL] Using Google Maps: ${this.useGoogleMaps}`);

            if (this.useGoogleMaps) {
                const result = await this.googleMapsNearby(location, placeType, radius);
                console.log(`[MAPS_TOOL] Google Maps result:`, JSON.stringify(result, null, 2));
                return result;
            } else {
                const result = await this.openStreetMapNearby(location, placeType, radius);
                console.log(`[MAPS_TOOL] OSM result:`, JSON.stringify(result, null, 2));
                return result;
            }
        } catch (error) {
            console.error('[MAPS_TOOL] Nearby search error:', error.message);
            return { error: 'Unable to find nearby places. Please try again.' };
        }
    }

    /**
     * Google Maps Distance Matrix API with coordinate support
     */
    async googleMapsDistance(origin, destination) {
        console.log(`[MAPS_TOOL] Google Maps: Calculating distance from "${origin}" to "${destination}"`);
        
        const url = 'https://maps.googleapis.com/maps/api/distancematrix/json';
        
        try {
            const response = await axios.get(url, {
                params: {
                    origins: origin,
                    destinations: destination,
                    key: this.googleMapsKey,
                    units: 'metric'
                }
            });

            console.log(`[MAPS_TOOL] Google Maps API status: ${response.data.status}`);

            if (response.data.status === 'OK' && response.data.rows[0]?.elements[0]?.status === 'OK') {
                const element = response.data.rows[0].elements[0];
                console.log(`[MAPS_TOOL] Distance: ${element.distance.text}, Duration: ${element.duration.text}`);
                
                return {
                    distance: element.distance.text,
                    distanceValue: element.distance.value,
                    duration: element.duration.text,
                    durationValue: element.duration.value,
                    originLocation: response.data.origin_addresses[0],
                    destLocation: response.data.destination_addresses[0]
                };
            }

            const errorStatus = response.data.rows[0]?.elements[0]?.status || response.data.status;
            console.log(`[MAPS_TOOL] Google Maps error status: ${errorStatus}`);
            
            return { 
                error: `Could not find route: ${errorStatus}`,
                suggestion: 'Try providing a more specific location or landmark'
            };
        } catch (error) {
            console.error('[MAPS_TOOL] Google Maps API error:', error.message);
            return { error: 'Unable to calculate distance. Please try again.' };
        }
    }

    /**
     * Google Maps Places API (Nearby Search) with better place type mapping
     */
    async googleMapsNearby(location, placeType, radius) {
        console.log(`[MAPS_TOOL] Google Maps: Finding ${placeType} near "${location}"`);
        
        // Check if location is already coordinates
        const coordMatch = location.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
        let lat, lng;
        
        if (coordMatch) {
            lat = parseFloat(coordMatch[1]);
            lng = parseFloat(coordMatch[2]);
            console.log(`[MAPS_TOOL] Using provided coordinates: ${lat}, ${lng}`);
        } else {
            // Geocode the location first
            console.log(`[MAPS_TOOL] Geocoding location: ${location}`);
            const geocodeUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
            
            try {
                const geocodeResponse = await axios.get(geocodeUrl, {
                    params: {
                        address: location,
                        key: this.googleMapsKey
                    }
                });

                if (geocodeResponse.data.status !== 'OK') {
                    console.log(`[MAPS_TOOL] Geocoding failed: ${geocodeResponse.data.status}`);
                    return { 
                        error: `Could not find location "${location}"`,
                        suggestion: 'Try providing a more specific address'
                    };
                }

                const result = geocodeResponse.data.results[0];
                lat = result.geometry.location.lat;
                lng = result.geometry.location.lng;
                console.log(`[MAPS_TOOL] Geocoded to: ${lat}, ${lng}`);
            } catch (error) {
                console.error('[MAPS_TOOL] Geocoding error:', error.message);
                return { error: 'Unable to geocode location' };
            }
        }

        // Map place types to Google Maps types
        const googlePlaceTypes = {
            school: 'school',
            hospital: 'hospital',
            restaurant: 'restaurant',
            bank: 'bank',
            pharmacy: 'pharmacy',
            supermarket: 'supermarket',
            shopping_mall: 'shopping_mall',
            park: 'park',
            gym: 'gym',
            bus_station: 'bus_station',
            bus_stop: 'bus_station',
            bus: 'bus_station',
            metro_station: 'subway_station',
            subway_station: 'subway_station',
            metro: 'subway_station',
            train_station: 'train_station',
            railway_station: 'train_station',
            point_of_interest: 'point_of_interest'
        };

        const googleType = googlePlaceTypes[placeType.toLowerCase()] || placeType;
        console.log(`[MAPS_TOOL] Searching for type: ${googleType}`);

        // Search for nearby places
        const placesUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
        
        try {
            const placesResponse = await axios.get(placesUrl, {
                params: {
                    location: `${lat},${lng}`,
                    radius: radius,
                    type: googleType,
                    key: this.googleMapsKey
                }
            });

            console.log(`[MAPS_TOOL] Places API status: ${placesResponse.data.status}`);

            if (placesResponse.data.status === 'OK' && placesResponse.data.results.length > 0) {
                const places = placesResponse.data.results.slice(0, 5).map(place => {
                    const distance = this.calculateDistanceFromCoords(
                        lat, lng, 
                        place.geometry.location.lat, 
                        place.geometry.location.lng
                    );
                    
                    return {
                        name: place.name,
                        address: place.vicinity || 'Address not available',
                        rating: place.rating || 'N/A',
                        distance: `${distance.toFixed(1)} km`,
                        distanceValue: distance,
                        isOpen: place.opening_hours?.open_now !== undefined ? 
                            (place.opening_hours.open_now ? 'Open now' : 'Closed') : 'N/A'
                    };
                });

                // Sort by distance
                places.sort((a, b) => a.distanceValue - b.distanceValue);

                console.log(`[MAPS_TOOL] Found ${places.length} places`);
                return { places, count: places.length };
            }

            console.log(`[MAPS_TOOL] No places found or error: ${placesResponse.data.status}`);
            return { 
                error: `No ${placeType.replace('_', ' ')} found within ${radius/1000}km`,
                suggestion: 'Try increasing the search radius or searching for a different type of place'
            };
        } catch (error) {
            console.error('[MAPS_TOOL] Places API error:', error.message);
            return { error: 'Unable to search for nearby places' };
        }
    }

    /**
     * Parse coordinate string (e.g., "12.9352,77.6245") or return null
     */
    parseCoordinates(location) {
        if (typeof location !== 'string') return null;
        
        const coordPattern = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;
        const match = location.trim().match(coordPattern);
        
        if (match) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            
            // Validate coordinate ranges
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                console.log(`[MAPS_TOOL] Parsed coordinates: ${lat}, ${lng}`);
                return { lat, lon: lng, displayName: `${lat}, ${lng}` };
            }
        }
        
        return null;
    }

    /**
     * OpenStreetMap Nominatim API (Free alternative) with improved location handling
     */
    async openStreetMapDistance(origin, destination) {
        console.log(`[MAPS_TOOL] Calculating distance from "${origin}" to "${destination}"`);
        
        // Check if origin is already coordinates
        let originCoords = this.parseCoordinates(origin);
        
        // If not coordinates, try to geocode origin with multiple formats
        if (!originCoords) {
            originCoords = await this.geocodeOSM(origin);
            
            // If origin not found, try adding "India" to make it more specific
            if (!originCoords && !origin.toLowerCase().includes('india')) {
                console.log(`[MAPS_TOOL] Retrying origin with ", India" appended`);
                originCoords = await this.geocodeOSM(`${origin}, India`);
            }
        }
        
        // Try to geocode destination with multiple formats
        let destCoords = await this.geocodeOSM(destination);
        
        // If destination not found, try with origin city context
        if (!destCoords && originCoords) {
            const cityMatch = origin.match(/([A-Za-z\s]+)(?:,|$)/);
            if (cityMatch) {
                const city = cityMatch[1].trim();
                console.log(`[MAPS_TOOL] Retrying destination with city context: "${destination}, ${city}"`);
                destCoords = await this.geocodeOSM(`${destination}, ${city}, India`);
            }
        }

        if (!originCoords) {
            console.log(`[MAPS_TOOL] Failed to geocode origin: "${origin}"`);
            return { 
                error: `Could not find location "${origin}". Please provide a more specific address or city name.`,
                suggestion: 'Try including the city name, e.g., "Koramangala, Bangalore" or "Indiranagar, Bangalore, India"'
            };
        }
        
        if (!destCoords) {
            console.log(`[MAPS_TOOL] Failed to geocode destination: "${destination}"`);
            return { 
                error: `Could not find "${destination}" near ${origin}. Please be more specific.`,
                suggestion: 'Try asking about specific landmarks like "nearest metro station" or "railway station"'
            };
        }

        const distance = this.calculateDistanceFromCoords(
            originCoords.lat, originCoords.lon,
            destCoords.lat, destCoords.lon
        );

        // Estimate duration (assuming average speed of 40 km/h in city, 60 km/h outside)
        const avgSpeed = distance < 10 ? 30 : distance < 50 ? 40 : 60;
        const durationMinutes = Math.round((distance / avgSpeed) * 60);

        console.log(`[MAPS_TOOL] Distance calculated: ${distance.toFixed(1)} km, Duration: ${durationMinutes} mins`);

        return {
            distance: `${distance.toFixed(1)} km`,
            distanceValue: distance * 1000,
            duration: `${durationMinutes} mins`,
            durationValue: durationMinutes * 60,
            originLocation: originCoords.displayName,
            destLocation: destCoords.displayName,
            note: 'Estimated straight-line distance. Actual travel distance may vary.'
        };
    }

    /**
     * OpenStreetMap Overpass API (Nearby search) with improved location handling
     */
    async openStreetMapNearby(location, placeType, radius) {
        console.log(`[MAPS_TOOL] Finding ${placeType} near "${location}" within ${radius}m`);
        
        // Check if location is already coordinates
        let coords = this.parseCoordinates(location);
        
        // If not coordinates, try to geocode location
        if (!coords) {
            coords = await this.geocodeOSM(location);
            
            // If location not found, try adding "India"
            if (!coords && !location.toLowerCase().includes('india')) {
                console.log(`[MAPS_TOOL] Retrying with ", India" appended`);
                coords = await this.geocodeOSM(`${location}, India`);
            }
        }
        
        if (!coords) {
            console.log(`[MAPS_TOOL] Failed to geocode location: "${location}"`);
            return { 
                error: `Could not find location "${location}". Please provide a more specific address.`,
                suggestion: 'Try including the city name, e.g., "Koramangala, Bangalore"'
            };
        }

        console.log(`[MAPS_TOOL] Searching for ${placeType} within ${radius}m of ${coords.lat}, ${coords.lon}`);

        // Map common place types to OSM tags with correct bus stop support
        const osmTags = {
            school: 'amenity=school',
            hospital: 'amenity=hospital',
            restaurant: 'amenity=restaurant',
            bank: 'amenity=bank',
            pharmacy: 'amenity=pharmacy',
            supermarket: 'shop=supermarket',
            park: 'leisure=park',
            gym: 'leisure=fitness_centre',
            bus_station: 'highway=bus_stop',    // Fixed: bus stops use highway tag
            bus_stop: 'highway=bus_stop',       // Added bus_stop
            bus: 'highway=bus_stop',            // Added bus
            subway_station: 'railway=station',
            metro_station: 'railway=station',
            metro: 'railway=station',
            train_station: 'railway=station',
            railway_station: 'railway=station'
        };

        const tag = osmTags[placeType.toLowerCase()] || `amenity=${placeType}`;

        // Try Overpass API first
        try {
            const overpassUrl = 'https://overpass-api.de/api/interpreter';
            const query = `
                [out:json][timeout:25];
                (
                    node[${tag}](around:${radius},${coords.lat},${coords.lon});
                    way[${tag}](around:${radius},${coords.lat},${coords.lon});
                );
                out body 10;
            `;

            console.log(`[MAPS_TOOL] Querying Overpass API...`);
            const response = await axios.post(overpassUrl, `data=${encodeURIComponent(query)}`, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 30000
            });

            if (!response.data.elements || response.data.elements.length === 0) {
                console.log(`[MAPS_TOOL] No ${placeType} found in Overpass, trying Nominatim search...`);
                // Fallback to Nominatim search
                return await this.nominatimNearbySearch(location, coords, placeType, radius);
            }

            const places = response.data.elements.slice(0, 5).map(element => {
                const placeLat = element.lat || element.center?.lat;
                const placeLon = element.lon || element.center?.lon;
                const distance = this.calculateDistanceFromCoords(coords.lat, coords.lon, placeLat, placeLon);

                return {
                    name: element.tags?.name || `Unnamed ${placeType.replace('_', ' ')}`,
                    address: element.tags?.['addr:street'] || element.tags?.['addr:city'] || 'Address not available',
                    distance: `${distance.toFixed(1)} km`,
                    distanceValue: distance
                };
            });

            // Sort by distance
            places.sort((a, b) => a.distanceValue - b.distanceValue);

            console.log(`[MAPS_TOOL] Found ${places.length} ${placeType}(s) via Overpass`);

            return { places, count: places.length };
        } catch (error) {
            console.error('[MAPS_TOOL] Overpass API error:', error.message);
            console.log('[MAPS_TOOL] Falling back to Nominatim search...');
            // Fallback to Nominatim search
            return await this.nominatimNearbySearch(location, coords, placeType, radius);
        }
    }

    /**
     * Fallback: Use Nominatim search for nearby places
     */
    async nominatimNearbySearch(location, coords, placeType, radius) {
        try {
            console.log(`[MAPS_TOOL] Using Nominatim search for ${placeType} near ${location}`);
            
            // Add delay for rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Search for place type in the area
            const searchQuery = `${placeType.replace('_', ' ')} near ${location}`;
            const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: searchQuery,
                    format: 'json',
                    limit: 10,
                    addressdetails: 1
                },
                headers: {
                    'User-Agent': process.env.NOMINATIM_USER_AGENT || 'EstatePulse/1.0'
                }
            });

            if (!response.data || response.data.length === 0) {
                console.log(`[MAPS_TOOL] No ${placeType} found via Nominatim either`);
                return { 
                    places: [], 
                    count: 0,
                    message: `No ${placeType.replace('_', ' ')} found within ${(radius/1000).toFixed(1)}km of ${location}. This area might not have detailed mapping data yet.`
                };
            }

            // Filter results within radius and calculate distances
            const places = response.data
                .map(result => {
                    const distance = this.calculateDistanceFromCoords(
                        coords.lat, coords.lon,
                        parseFloat(result.lat), parseFloat(result.lon)
                    );
                    return {
                        name: result.display_name.split(',')[0] || `${placeType.replace('_', ' ')}`,
                        address: result.display_name,
                        distance: `${distance.toFixed(1)} km`,
                        distanceValue: distance
                    };
                })
                .filter(place => place.distanceValue <= radius / 1000) // Filter by radius
                .sort((a, b) => a.distanceValue - b.distanceValue) // Sort by distance
                .slice(0, 5); // Take top 5

            console.log(`[MAPS_TOOL] Found ${places.length} ${placeType}(s) via Nominatim`);

            return { places, count: places.length };
        } catch (error) {
            console.error('[MAPS_TOOL] Nominatim search error:', error.message);
            return { 
                error: `Unable to search for nearby ${placeType.replace('_', ' ')}. The service might be temporarily unavailable.`,
                suggestion: 'Please try again in a moment or ask about a different location.'
            };
        }
    }

    /**
     * Geocode location using OpenStreetMap Nominatim with better error handling
     */
    async geocodeOSM(location) {
        try {
            console.log(`[MAPS_TOOL] Geocoding location: "${location}"`);
            
            // Add delay to respect rate limits (1 request per second)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: location,
                    format: 'json',
                    limit: 1,
                    addressdetails: 1
                },
                headers: {
                    'User-Agent': process.env.NOMINATIM_USER_AGENT || 'EstatePulse/1.0'
                }
            });

            console.log(`[MAPS_TOOL] Geocoding response for "${location}":`, response.data.length > 0 ? 'Found' : 'Not found');

            if (response.data.length > 0) {
                const result = response.data[0];
                console.log(`[MAPS_TOOL] Coordinates: ${result.lat}, ${result.lon}`);
                return {
                    lat: parseFloat(result.lat),
                    lon: parseFloat(result.lon),
                    displayName: result.display_name
                };
            }
            
            console.log(`[MAPS_TOOL] No results found for "${location}"`);
            return null;
        } catch (error) {
            console.error('[MAPS_TOOL] Geocoding error:', error.message);
            return null;
        }
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     */
    calculateDistanceFromCoords(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }
}

module.exports = new MapsDistanceTool();
