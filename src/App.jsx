import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Leaflet default icons fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// --- MATH ALGORITHM: Haversine Formula (to find the distance between two points) ---
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; //  (Earth's radius in km)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
}

// --- OPTIMIZATION ALGORITHM: Nearest Neighbor (To set the smallest path) ---
function optimizeRoute(points) {
  if (!points || points.length <= 2) return points;

  // first point is always starting points 
  const startPoint = points[0];
  let unvisited = points.slice(1);
  let optimized = [startPoint];
  let currentPoint = startPoint;

  // do it till end points are not visited
  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      let dist = getDistance(currentPoint.lat, currentPoint.lon, unvisited[i].lat, unvisited[i].lon);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    }

    // visit the nearest point and remove it from unvisited
    currentPoint = unvisited[nearestIndex];
    optimized.push(currentPoint);
    unvisited.splice(nearestIndex, 1);
  }

  return optimized;
}

// draw the route on the map using Leaflet Routing Machine
const RoutingMachine = ({ points, mode }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length < 2) return;

    const waypoints = points.map(pt => L.latLng(pt.lat, pt.lon));

    let osrmProfile = 'driving';
    if (mode === 'bike') osrmProfile = 'bike';
    if (mode === 'walking') osrmProfile = 'foot';

    const routingControl = L.Routing.control({
      waypoints: waypoints,
      routeWhileDragging: false,
      addWaypoints: false, 
      fitSelectedRoutes: true, 
      showAlternatives: false,
      lineOptions: {
        styles: [{ color: '#3388ff', weight: 6, opacity: 0.8 }] 
      },
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: osrmProfile
      })
    }).addTo(map);

    return () => {
      try {
        map.removeControl(routingControl);
      } catch (e) {
        console.log(e);
      }
    };
  }, [points, mode, map]);

  return null;
};

export default function App() {
  const [routePoints, setRoutePoints] = useState([]); 
  const [transportMode, setTransportMode] = useState('car');

  // Poori 120 Locations
  const locations = useMemo(() => [
    { name: "Red Fort", lat: 28.6562, lon: 77.2410 },
    { name: "Jama Masjid", lat: 28.6507, lon: 77.2334 },
    { name: "Chandni Chowk", lat: 28.6506, lon: 77.2303 },
    { name: "Coronation Park", lat: 28.7230, lon: 77.1930 },
    { name: "Roshanara Bagh", lat: 28.6670, lon: 77.1950 },
    { name: "Mutiny Memorial", lat: 28.6675, lon: 77.2100 },
    { name: "Metcalfe House", lat: 28.6750, lon: 77.2250 },
    { name: "Kamla Nehru Ridge", lat: 28.6780, lon: 77.2150 },
    { name: "Partition Museum Delhi", lat: 28.6580, lon: 77.2310 },
    { name: "St. James' Church", lat: 28.6650, lon: 77.2300 },
    { name: "Fatehpuri Masjid", lat: 28.6580, lon: 77.2210 },
    { name: "Gurudwara Sis Ganj", lat: 28.6560, lon: 77.2310 },
    { name: "Sheesh Mahal Shalimar Bagh", lat: 28.7180, lon: 77.1600 },
    { name: "India Gate", lat: 28.6129, lon: 77.2295 },
    { name: "Gurudwara Bangla Sahib", lat: 28.6264, lon: 77.2091 },
    { name: "Purana Qila", lat: 28.6096, lon: 77.2437 },
    { name: "Agrasen Ki Baoli", lat: 28.6260, lon: 77.2250 },
    { name: "Feroz Shah Kotla", lat: 28.6330, lon: 77.2450 },
    { name: "Jantar Mantar", lat: 28.6270, lon: 77.2160 },
    { name: "National War Memorial", lat: 28.6120, lon: 77.2300 },
    { name: "Rashtrapati Bhavan", lat: 28.6143, lon: 77.1994 },
    { name: "Parliament House", lat: 28.6172, lon: 77.2081 },
    { name: "National Museum", lat: 28.6110, lon: 77.2190 },
    { name: "National Science Centre", lat: 28.6130, lon: 77.2460 },
    { name: "Museum of Illusions Delhi", lat: 28.6320, lon: 77.2190 },
    { name: "National Zoological Park", lat: 28.6030, lon: 77.2450 },
    { name: "Connaught Place", lat: 28.6304, lon: 77.2177 },
    { name: "Janpath Market", lat: 28.6250, lon: 77.2180 },
    { name: "Hanuman Mandir CP", lat: 28.6290, lon: 77.2130 },
    { name: "Sacred Heart Cathedral", lat: 28.6280, lon: 77.2060 },
    { name: "Birla Mandir", lat: 28.6320, lon: 77.1990 },
    { name: "Bhuli Bhatiyari Ka Mahal", lat: 28.6430, lon: 77.1940 },
    { name: "Khooni Darwaza", lat: 28.6320, lon: 77.2400 },
    { name: "Central Park CP", lat: 28.6300, lon: 77.2170 },
    { name: "Palika Bazaar", lat: 28.6300, lon: 77.2180 },
    { name: "NGMA Delhi", lat: 28.6100, lon: 77.2340 },
    { name: "Gandhi Smriti", lat: 28.6010, lon: 77.2140 },
    { name: "National Crafts Museum", lat: 28.6130, lon: 77.2420 },
    { name: "Dolls Museum", lat: 28.6290, lon: 77.2420 },
    { name: "Kartavya Path", lat: 28.6120, lon: 77.2190 },
    { name: "Bharat Mandapam", lat: 28.6130, lon: 77.2430 },
    { name: "Pragati Maidan", lat: 28.6140, lon: 77.2430 },
    { name: "Talkatora Garden", lat: 28.6250, lon: 77.1940 },
    { name: "Gurudwara Rakab Ganj", lat: 28.6200, lon: 77.2040 },
    { name: "National Philatelic Museum", lat: 28.6210, lon: 77.2120 },
    { name: "Qutub Minar", lat: 28.5244, lon: 77.1855 },
    { name: "Humayun's Tomb", lat: 28.5933, lon: 77.2507 },
    { name: "Lotus Temple", lat: 28.5535, lon: 77.2588 },
    { name: "Safdarjung Tomb", lat: 28.5893, lon: 77.2106 },
    { name: "Tughlaqabad Fort", lat: 28.5140, lon: 77.2600 },
    { name: "Mehrauli Archaeological Park", lat: 28.5190, lon: 77.1860 },
    { name: "Sunder Nursery", lat: 28.5940, lon: 77.2450 },
    { name: "Lodhi Garden", lat: 28.5930, lon: 77.2190 },
    { name: "Garden of Five Senses", lat: 28.5130, lon: 77.1980 },
    { name: "Dilli Haat INA", lat: 28.5730, lon: 77.2070 },
    { name: "Khan Market", lat: 28.6000, lon: 77.2270 },
    { name: "Lajpat Nagar Market", lat: 28.5680, lon: 77.2430 },
    { name: "Yogmaya Temple", lat: 28.5250, lon: 77.1840 },
    { name: "Chhattarpur Temple", lat: 28.5030, lon: 77.1780 },
    { name: "Kalkaji Mandir", lat: 28.5490, lon: 77.2580 },
    { name: "ISKCON Temple Delhi", lat: 28.5560, lon: 77.2530 },
    { name: "Nizamuddin Dargah", lat: 28.5910, lon: 77.2420 },
    { name: "Nizamuddin Baoli", lat: 28.5915, lon: 77.2425 },
    { name: "Ahimsa Sthal", lat: 28.5210, lon: 77.1860 },
    { name: "Zafar Mahal", lat: 28.5190, lon: 77.1780 },
    { name: "Jamali Kamali Mosque", lat: 28.5195, lon: 77.1870 },
    { name: "Alai Darwaza", lat: 28.5240, lon: 77.1850 },
    { name: "Alai Minar", lat: 28.5250, lon: 77.1850 },
    { name: "Iron Pillar of Delhi", lat: 28.5245, lon: 77.1852 },
    { name: "Hijron Ka Khanqah", lat: 28.5190, lon: 77.1790 },
    { name: "Khirki Masjid", lat: 28.5300, lon: 77.2190 },
    { name: "Quwwat-ul-Islam Mosque", lat: 28.5243, lon: 77.1853 },
    { name: "Satpula Bridge", lat: 28.5290, lon: 77.2220 },
    { name: "Begumpur Mosque", lat: 28.5390, lon: 77.2040 },
    { name: "Tomb of Adham Khan", lat: 28.5240, lon: 77.1820 },
    { name: "Qila Rai Pithora", lat: 28.5240, lon: 77.1860 },
    { name: "Lal Kot Fort", lat: 28.5250, lon: 77.1870 },
    { name: "Sanjay Van", lat: 28.5350, lon: 77.1690 },
    { name: "Asola Bhatti Sanctuary", lat: 28.4350, lon: 77.2340 },
    { name: "Smriti Van", lat: 28.5340, lon: 77.1650 },
    { name: "District Park Saket", lat: 28.5280, lon: 77.2100 },
    { name: "Select Citywalk Mall", lat: 28.5285, lon: 77.2190 },
    { name: "INA Market", lat: 28.5740, lon: 77.2080 },
    { name: "Sanskriti Kendra Museums", lat: 28.4730, lon: 77.1260 },
    { name: "JLN Stadium", lat: 28.5820, lon: 77.2340 },
    { name: "Siri Fort Complex", lat: 28.5510, lon: 77.2200 },
    { name: "Delhi Golf Club", lat: 28.5960, lon: 77.2370 },
    { name: "Thyagaraj Sports Complex", lat: 28.5760, lon: 77.2150 },
    { name: "Sai Baba Temple Lodhi Road", lat: 28.5880, lon: 77.2250 },
    { name: "Dargah Qutub Sahib", lat: 28.5200, lon: 77.1770 },
    { name: "Jahaz Mahal Mehrauli", lat: 28.5170, lon: 77.1750 },
    { name: "Siri Fort Forest Park", lat: 28.5510, lon: 77.2220 },
    { name: "National Rail Museum", lat: 28.5850, lon: 77.1790 },
    { name: "Nehru Park", lat: 28.5920, lon: 77.1900 },
    { name: "Sarojini Nagar Market", lat: 28.5760, lon: 77.1960 },
    { name: "Uttara Swami Malai Temple", lat: 28.5720, lon: 77.1710 },
    { name: "Aravalli Biodiversity Park", lat: 28.5440, lon: 77.1470 },
    { name: "Buddha Jayanti", lat: 28.6010, lon: 77.1750 },
    { name: "Santushti Shopping Complex", lat: 28.5870, lon: 77.1950 },
    { name: "Ambience Mall Vasant Kunj", lat: 28.5400, lon: 77.1560 },
    { name: "Air Force Museum", lat: 28.5680, lon: 77.1130 },
    { name: "Toilet Museum", lat: 28.5990, lon: 77.0800 },
    { name: "Pacific Mall Tagore Garden", lat: 28.6420, lon: 77.1050 },
    { name: "Rajouri Garden Market", lat: 28.6480, lon: 77.1200 },
    { name: "Tilak Nagar Market", lat: 28.6360, lon: 77.0960 },
    { name: "Dilli Haat Janakpuri", lat: 28.6250, lon: 77.0870 },
    { name: "Akshardham Temple", lat: 28.6127, lon: 77.2773 },
    { name: "Millennium Indraprastha Park", lat: 28.6020, lon: 77.2580 },
    { name: "Waste to Wonder Park", lat: 28.5870, lon: 77.2530 },
    { name: "Delhi Eye", lat: 28.5430, lon: 77.2880 },
    { name: "Raj Ghat", lat: 28.6406, lon: 77.2495 },
    { name: "Yamuna Biodiversity Park", lat: 28.7240, lon: 77.2160 },
    { name: "Signature Bridge", lat: 28.7050, lon: 77.2270 },
    { name: "Hauz Khas Fort", lat: 28.5540, lon: 77.1920 },
    { name: "Deer Park", lat: 28.5560, lon: 77.1940 },
    { name: "Hauz Khas Village", lat: 28.5550, lon: 77.1910 },
    { name: "Karol Bagh Market", lat: 28.6520, lon: 77.1900 },
    { name: "Gaffar Market", lat: 28.6525, lon: 77.1890 },
    { name: "Japanese Park Rohini", lat: 28.7250, lon: 77.1060 },
    { name: "Dilli Haat Pitampura", lat: 28.7030, lon: 77.1510 }
  ], []);

  // here we are optimizing the route whenever the routePoints change
  const optimizedRoute = useMemo(() => {
    return optimizeRoute(routePoints);
  }, [routePoints]);

  const handleAddStop = (loc) => {
    const isAlreadyAdded = routePoints.some(point => point.name === loc.name);
    if (!isAlreadyAdded) {
      setRoutePoints([...routePoints, loc]);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Bar for Status */}
      <div style={{ padding: '15px', background: '#2c3e50', color: 'white', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: '0 0 10px 0', color: '#00ffcc' }}>Delhi Optimized Tour Planner</h2>
          {routePoints.length > 2 && (
            <span style={{ background: '#27ae60', padding: '5px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>
              ✨ AI Auto-Sorted for Minimum Distance
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          <div style={{ flex: 1, background: '#34495e', padding: '10px', borderRadius: '5px' }}>
            <strong>Your Optimized Route: </strong> 
            {optimizedRoute.length === 0 ? (
              <span style={{ color: '#bdc3c7' }}>click on locations to add stops...</span>
            ) : (
              <span style={{ color: '#f1c40f', fontWeight: 'bold' }}>
                {optimizedRoute.map(p => p.name).join(" ➔ ")}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select 
              value={transportMode} 
              onChange={(e) => setTransportMode(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', outline: 'none' }}
            >
              <option value="car">🚗 Car</option>
              <option value="bike">🏍️ Bike</option>
              <option value="walking">🚶 Walking</option>
            </select>

            <button 
              onClick={() => setRoutePoints([])}
              style={{ padding: '8px 15px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Clear Tour
            </button>
          </div>
        </div>
      </div>

      {/* Real Map */}
      <MapContainer 
        center={[28.6139, 77.2090]} 
        zoom={11} 
        style={{ flex: 1, width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {locations.map((loc, idx) => {
          const isAdded = routePoints.some(p => p.name === loc.name);

          return (
            <Marker key={idx} position={[loc.lat, loc.lon]}>
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>{loc.name}</h3>
                  <button 
                    onClick={() => handleAddStop(loc)}
                    disabled={isAdded}
                    style={{ 
                      padding: '5px 10px', 
                      background: isAdded ? '#27ae60' : '#3498db', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '3px', 
                      cursor: isAdded ? 'not-allowed' : 'pointer', 
                      fontWeight: 'bold' 
                    }}
                  >
                    {isAdded ? "Added ✅" : "Add Stop 📍"}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* we are using Leaflet Routing Machine to draw the route */}
        <RoutingMachine points={optimizedRoute} mode={transportMode} />
        
      </MapContainer>
    </div>
  );
}