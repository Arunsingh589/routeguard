const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export async function fetchPresets() {
  try {
    const res = await fetch(`${API_BASE_URL}/presets/`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Using fallback presets due to network error:', err);
    return {
      presets: [
        {
          id: 'preset_chicago_dallas',
          name: 'Chicago to Dallas (Corridor 35)',
          description: 'High-volume midwest freight corridor crossing Midwest wind plains.',
          origin: { city: 'Chicago', state: 'IL', lat: 41.8781, lon: -87.6298, label: 'Chicago, IL' },
          destination: { city: 'Dallas', state: 'TX', lat: 32.7767, lon: -96.7970, label: 'Dallas, TX' },
          suggested_load_weight: 35000,
          default_interval: 25,
        },
        {
          id: 'preset_denver_seattle',
          name: 'Denver to Seattle (Mountain Corridor)',
          description: 'Challenging Rocky Mountain passage prone to heavy snowfall and gusty passes.',
          origin: { city: 'Denver', state: 'CO', lat: 39.7392, lon: -104.9903, label: 'Denver, CO' },
          destination: { city: 'Seattle', state: 'WA', lat: 47.6062, lon: -122.3321, label: 'Seattle, WA' },
          suggested_load_weight: 42000,
          default_interval: 25,
        },
        {
          id: 'preset_atlanta_nyc',
          name: 'Atlanta to New York (I-85 / I-95)',
          description: 'Heavy Atlantic coastal corridor with frequent rain fronts and tropical depressions.',
          origin: { city: 'Atlanta', state: 'GA', lat: 33.7490, lon: -84.3880, label: 'Atlanta, GA' },
          destination: { city: 'New York', state: 'NY', lat: 40.7128, lon: -74.0060, label: 'New York, NY' },
          suggested_load_weight: 28000,
          default_interval: 25,
        },
        {
          id: 'preset_la_phoenix',
          name: 'Los Angeles to Phoenix (I-10 Desert)',
          description: 'Desert corridor prone to severe crosswinds and sudden dust squalls.',
          origin: { city: 'Los Angeles', state: 'CA', lat: 34.0522, lon: -118.2437, label: 'Los Angeles, CA' },
          destination: { city: 'Phoenix', state: 'AZ', lat: 33.4484, lon: -112.0740, label: 'Phoenix, AZ' },
          suggested_load_weight: 45000,
          default_interval: 25,
        },
        {
          id: 'preset_minneapolis_kc',
          name: 'Minneapolis to Kansas City (I-35 North-South)',
          description: 'Upper Great Plains corridor exposed to winter blizzards and rapid temp drops.',
          origin: { city: 'Minneapolis', state: 'MN', lat: 44.9778, lon: -93.2650, label: 'Minneapolis, MN' },
          destination: { city: 'Kansas City', state: 'MO', lat: 39.0997, lon: -94.5786, label: 'Kansas City, MO' },
          suggested_load_weight: 32000,
          default_interval: 10,
        },
      ],
    };
  }
}

export async function searchLocations(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/geocode/?q=${encodeURIComponent(query.trim())}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.warn('Geocode API request failed:', err);
    return [];
  }
}

export async function analyzeRoutes({
  origin,
  destination,
  departureTime,
  loadWeightLbs,
  samplingIntervalMiles,
}) {
  const payload = {
    origin,
    destination,
    departure_time: departureTime,
    load_weight_lbs: Number(loadWeightLbs),
    sampling_interval_miles: Number(samplingIntervalMiles),
  };

  const res = await fetch(`${API_BASE_URL}/routes/analyze/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    try {
      const errData = await res.json();
      if (errData.error) errorMsg = errData.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return await res.json();
}
