import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon issues in Vite/React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const mapContainerStyle = {
  width: '100%',
  height: '600px',
  zIndex: 1,
};

const center = [3.848, 11.502]; // [lat, lng]

const plotMarkers = [
  {
    id: 1,
    position: [3.868, 11.522],
    status: 'clear',
    title: 'Plot A-001',
    code: 'CM_12345',
    area: '2,500 m²',
  },
  {
    id: 2,
    position: [3.858, 11.512],
    status: 'disputed',
    title: 'Plot B-045',
    code: 'CM_23456',
    area: '3,200 m²',
  },
  {
    id: 3,
    position: [3.848, 11.502],
    status: 'clear',
    title: 'Plot C-128',
    code: 'CM_34567',
    area: '1,800 m²',
  },
  {
    id: 4,
    position: [3.838, 11.492],
    status: 'clear',
    title: 'Plot D-203',
    code: 'CH26_45678',
    area: '4,100 m²',
  },
  {
    id: 5,
    position: [3.878, 11.532],
    status: 'disputed',
    title: 'Plot E-089',
    code: 'CM_56789',
    area: '2,900 m²',
  },
];

// Custom DivIcon to mimic the status dots from the original design
const createCustomIcon = (status) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${status === 'clear' ? '#22c55e' : '#ef4444'}; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7],
  });
};

export default function InteractiveMap() {
  const [selectedPlot, setSelectedPlot] = useState(null);

  return (
    <section id="cadastre" className="pt-24 pb-0 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-block px-6 py-2 bg-[#002147]/5 rounded-full border border-[#002147]/10 mb-4"
          >
            <span className="text-[#D4AF37] tracking-widest text-sm">CADASTRAL SYSTEM</span>
          </motion.div>
          <h2 className="text-5xl lg:text-6xl text-[#002147] mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            Global Cadastre View
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real-time visualization of registered properties with clear ownership status and dispute indicators
          </p>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-8 mb-8"
        >
          <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-md">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span className="text-[#002147]">Clear</span>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-md">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span className="text-[#002147]">Disputed</span>
          </div>
        </motion.div>

        {/* Map Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white"
        >
          <MapContainer 
            center={center} 
            zoom={12} 
            style={mapContainerStyle}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {plotMarkers.map((plot) => (
              <Marker
                key={plot.id}
                position={plot.position}
                icon={createCustomIcon(plot.status)}
                eventHandlers={{
                  click: () => setSelectedPlot(plot),
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[150px]">
                    <h3 className="text-lg font-bold text-[#002147] mb-1">
                      {plot.title}
                    </h3>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p>
                        <strong>Code:</strong> {plot.code}
                      </p>
                      <p>
                        <strong>Area:</strong> {plot.area}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`w-2 h-2 rounded-full ${
                          plot.status === 'clear' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className={`capitalize font-semibold ${
                          plot.status === 'clear' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {plot.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Overlay UI */}
          <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-lg max-w-xs z-[1000]">
            <h4 className="text-[#002147] font-bold mb-2">
              Map Statistics
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Plots:</span>
                <span className="text-[#002147] font-medium">{plotMarkers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Clear:</span>
                <span className="text-green-600 font-medium">
                  {plotMarkers.filter(p => p.status === 'clear').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Disputed:</span>
                <span className="text-red-600 font-medium">
                  {plotMarkers.filter(p => p.status === 'disputed').length}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center text-gray-600"
        >
          <p className="text-sm">
            Click on any marker to view detailed property information. Data updated in real-time from MINDCAF registry.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
