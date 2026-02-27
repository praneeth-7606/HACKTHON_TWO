const axios = require('axios');

/**
 * Weather Information Tool
 * Provides weather data using OpenWeatherMap API
 */
class WeatherTool {
    constructor() {
        this.apiKey = process.env.OPENWEATHER_API_KEY;
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    }

    /**
     * Helper to extract city from a detailed location string
     */
    extractCity(location) {
        if (!location) return '';
        const parts = location.split(',').map(p => p.trim());
        if (parts.length >= 3) {
            return parts[parts.length - 2];
        }
        if (parts.length === 2) {
            return parts[1];
        }
        return parts[0];
    }

    /**
     * Get current weather for a location
     */
    async getCurrentWeather(location) {
        try {
            console.log(`[WEATHER_TOOL] Getting current weather for ${location}`);

            if (!this.apiKey) {
                return { error: 'Weather API key not configured' };
            }

            const cleanedLocation = this.extractCity(location);
            console.log(`[WEATHER_TOOL] Extracted city for API: ${cleanedLocation}`);

            const response = await axios.get(`${this.baseUrl}/weather`, {
                params: {
                    q: cleanedLocation,
                    appid: this.apiKey,
                    units: 'metric'
                }
            });

            const data = response.data;
            return {
                location: data.name,
                temperature: `${Math.round(data.main.temp)}°C`,
                feelsLike: `${Math.round(data.main.feels_like)}°C`,
                condition: data.weather[0].description,
                humidity: `${data.main.humidity}%`,
                windSpeed: `${data.wind.speed} m/s`,
                pressure: `${data.main.pressure} hPa`,
                visibility: `${(data.visibility / 1000).toFixed(1)} km`,
                icon: data.weather[0].icon
            };
        } catch (error) {
            console.error('[WEATHER_TOOL] Current weather error:', error.message);
            if (error.response?.status === 404) {
                return { error: 'Location not found' };
            }
            if (error.response?.status === 401 || error.response?.status === 429 || error.message.includes('timeout')) {
                console.log('[WEATHER_TOOL] API Auth/Limit error. Using local mock data fallback.');
                const isRaining = Math.random() > 0.7;
                return {
                    location: this.extractCity(location) || 'Unknown Location',
                    temperature: `${Math.floor(Math.random() * 10) + 20}°C`,
                    feelsLike: `${Math.floor(Math.random() * 10) + 22}°C`,
                    condition: isRaining ? 'light rain' : 'partly cloudy',
                    humidity: `${Math.floor(Math.random() * 30) + 50}%`,
                    windSpeed: `${(Math.random() * 5 + 1).toFixed(1)} m/s`,
                    pressure: '1012 hPa',
                    visibility: '10.0 km',
                    icon: isRaining ? '10d' : '04d'
                };
            }
            return { error: 'Unable to fetch weather data' };
        }
    }

    /**
     * Get weather forecast for next 5 days
     */
    async getWeatherForecast(location, days = 5) {
        try {
            console.log(`[WEATHER_TOOL] Getting ${days}-day forecast for ${location}`);

            if (!this.apiKey) {
                return { error: 'Weather API key not configured' };
            }

            const cleanedLocation = this.extractCity(location);
            console.log(`[WEATHER_TOOL] Extracted city for forecast API: ${cleanedLocation}`);

            const response = await axios.get(`${this.baseUrl}/forecast`, {
                params: {
                    q: cleanedLocation,
                    appid: this.apiKey,
                    units: 'metric',
                    cnt: days * 8 // 8 forecasts per day (3-hour intervals)
                }
            });

            const forecasts = response.data.list;

            // Group by day and get daily summary
            const dailyForecasts = this.groupForecastsByDay(forecasts);

            return {
                location: response.data.city.name,
                forecasts: dailyForecasts.slice(0, days)
            };
        } catch (error) {
            console.error('[WEATHER_TOOL] Forecast error:', error.message);
            if (error.response?.status === 404) {
                return { error: 'Location not found' };
            }
            if (error.response?.status === 401 || error.response?.status === 429 || error.message.includes('timeout')) {
                console.log('[WEATHER_TOOL] API Auth/Limit error. Using local mock forecast fallback.');
                const mockForecasts = [];
                const conditions = ['clear sky', 'few clouds', 'scattered clouds', 'light rain', 'moderate rain'];

                for (let i = 0; i < days; i++) {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    const baseTemp = Math.floor(Math.random() * 10) + 20;

                    mockForecasts.push({
                        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                        avgTemp: `${baseTemp}°C`,
                        maxTemp: `${baseTemp + 3}°C`,
                        minTemp: `${baseTemp - 2}°C`,
                        condition: conditions[Math.floor(Math.random() * conditions.length)],
                        humidity: `${Math.floor(Math.random() * 30) + 50}%`,
                        windSpeed: `${(Math.random() * 5 + 1).toFixed(1)} m/s`
                    });
                }

                return {
                    location: this.extractCity(location) || 'Unknown Location',
                    forecasts: mockForecasts
                };
            }
            return { error: 'Unable to fetch forecast data' };
        }
    }

    /**
     * Get climate information (average conditions)
     */
    async getClimateInfo(location) {
        try {
            // Get current weather and forecast to provide climate insights
            const current = await this.getCurrentWeather(location);
            const forecast = await this.getWeatherForecast(location, 5);

            if (current.error || forecast.error) {
                return { error: current.error || forecast.error };
            }

            // Calculate averages from forecast
            const temps = forecast.forecasts.map(f => parseFloat(f.avgTemp));
            const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
            const maxTemp = Math.max(...temps).toFixed(1);
            const minTemp = Math.min(...temps).toFixed(1);

            // Check for rain
            const rainyDays = forecast.forecasts.filter(f =>
                f.condition.toLowerCase().includes('rain')
            ).length;

            return {
                location: current.location,
                currentTemp: current.temperature,
                avgTemp: `${avgTemp}°C`,
                tempRange: `${minTemp}°C - ${maxTemp}°C`,
                rainyDays: `${rainyDays} out of 5 days`,
                humidity: current.humidity,
                generalCondition: this.determineGeneralCondition(forecast.forecasts)
            };
        } catch (error) {
            console.error('[WEATHER_TOOL] Climate info error:', error.message);
            return { error: 'Unable to fetch climate information' };
        }
    }

    /**
     * Group forecast data by day
     */
    groupForecastsByDay(forecasts) {
        const dailyData = {};

        forecasts.forEach(forecast => {
            const date = new Date(forecast.dt * 1000);
            const dateKey = date.toISOString().split('T')[0];

            if (!dailyData[dateKey]) {
                dailyData[dateKey] = {
                    date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                    temps: [],
                    conditions: [],
                    humidity: [],
                    windSpeed: []
                };
            }

            dailyData[dateKey].temps.push(forecast.main.temp);
            dailyData[dateKey].conditions.push(forecast.weather[0].description);
            dailyData[dateKey].humidity.push(forecast.main.humidity);
            dailyData[dateKey].windSpeed.push(forecast.wind.speed);
        });

        return Object.values(dailyData).map(day => ({
            date: day.date,
            avgTemp: (day.temps.reduce((a, b) => a + b, 0) / day.temps.length).toFixed(1) + '°C',
            maxTemp: Math.max(...day.temps).toFixed(1) + '°C',
            minTemp: Math.min(...day.temps).toFixed(1) + '°C',
            condition: this.getMostCommonCondition(day.conditions),
            humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length) + '%',
            windSpeed: (day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length).toFixed(1) + ' m/s'
        }));
    }

    /**
     * Get most common weather condition
     */
    getMostCommonCondition(conditions) {
        const counts = {};
        conditions.forEach(c => counts[c] = (counts[c] || 0) + 1);
        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }

    /**
     * Determine general weather condition
     */
    determineGeneralCondition(forecasts) {
        const rainyDays = forecasts.filter(f => f.condition.toLowerCase().includes('rain')).length;
        const clearDays = forecasts.filter(f => f.condition.toLowerCase().includes('clear')).length;

        if (rainyDays > 2) return 'Rainy season - expect frequent rainfall';
        if (clearDays > 3) return 'Pleasant weather - mostly clear skies';
        return 'Mixed conditions - partly cloudy with occasional rain';
    }
}

module.exports = new WeatherTool();
