'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface MapPickerProps {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }) => void;
  initialLat?: number;
  initialLng?: number;
}

export function MapPicker({ onLocationSelect, initialLat, initialLng }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const LRef = useRef<any>(null);

  // Default to Bangalore, India (12.9716, 77.5946) or initial coords
  const defaultLat = initialLat || 12.9716;
  const defaultLng = initialLng || 77.5946;

  useEffect(() => {
    let isMounted = true;

    // Load CSS dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        LRef.current = L;

        if (!isMounted || !mapContainerRef.current) return;

        // Leaflet default icon bug bypass
        const DefaultIcon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
        L.Marker.prototype.options.icon = DefaultIcon;

        const leafletMap = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], initialLat ? 16 : 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(leafletMap);

        const newMarker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(leafletMap);

        setMap(leafletMap);
        setMarker(newMarker);

        // Marker drag events
        newMarker.on('dragend', async () => {
          const position = newMarker.getLatLng();
          await reverseGeocode(position.lat, position.lng);
        });

        // Map clicks
        leafletMap.on('click', async (e: any) => {
          const { lat, lng } = e.latlng;
          newMarker.setLatLng([lat, lng]);
          await reverseGeocode(lat, lng);
        });

        // Trigger on load if initial lat/lng is provided
        if (initialLat && initialLng) {
          await reverseGeocode(initialLat, initialLng);
        } else if (navigator.geolocation) {
          // Auto-locate at current position on initial mount if it's a new address
          setLoading(true);
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              if (!isMounted) return;
              const { latitude, longitude } = position.coords;
              leafletMap.setView([latitude, longitude], 16);
              newMarker.setLatLng([latitude, longitude]);
              await reverseGeocode(latitude, longitude);
            },
            (err) => {
              console.warn('Auto-geolocation failed on mount:', err);
              setLoading(false);
            },
            { enableHighAccuracy: true }
          );
        }

      } catch (err: any) {
        console.error('Error initializing map:', err);
        setError('Failed to load map components.');
      }
    };

    initMap();

    return () => {
      isMounted = false;
      try {
        document.head.removeChild(link);
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      if (!response.ok) throw new Error('Failed to retrieve address details.');
      const data = await response.json();

      const addr = data.address || {};
      
      // Build structured parts
      const street = addr.road || addr.suburb || addr.neighbourhood || addr.amenity || addr.industrial || addr.commercial || addr.residential || '';
      const locality = addr.suburb || addr.neighbourhood || addr.village || addr.subdistrict || '';
      
      const addressDetails = {
        addressLine1: street || data.display_name?.split(',')[0] || '',
        addressLine2: locality || '',
        city: addr.city || addr.town || addr.village || addr.county || '',
        state: addr.state || addr.state_district || '',
        postalCode: addr.postcode || '',
        country: addr.country || 'India',
      };

      onLocationSelect({
        lat,
        lng,
        ...addressDetails
      });
    } catch (err: any) {
      console.error(err);
      setError('Could not retrieve address details for this location.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent | React.KeyboardEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim() || !map || !marker) return;

    setSearching(true);
    setError(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      if (!response.ok) throw new Error('Search failed.');
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);

        map.setView([newLat, newLng], 16);
        marker.setLatLng([newLat, newLng]);
        await reverseGeocode(newLat, newLng);
      } else {
        setError('Location not found. Try a different search query.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Search failed. Please check your internet connection.');
    } finally {
      setSearching(false);
    }
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        if (map && marker) {
          map.setView([latitude, longitude], 16);
          marker.setLatLng([latitude, longitude]);
          await reverseGeocode(latitude, longitude);
        }
      },
      (err) => {
        console.error(err);
        setError('Permission to access location denied.');
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Prevent map container cleanup memory leaks
  useEffect(() => {
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [map]);

  return (
    <div className="flex flex-col gap-4 border border-border bg-card p-4 rounded-xl shadow-xs">
      
      {/* Search & Location Trigger */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(e);
                }
              }}
              placeholder="Search area, landmark or pincode..."
              className="w-full text-xs bg-muted border border-border rounded-lg pl-8 pr-4 py-2.5 outline-none focus:border-primary/50 text-foreground"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute left-2.5 top-3" />
          </div>
          <Button
            type="button"
            onClick={() => handleSearch()}
            size="sm"
            disabled={searching}
            className="text-xs uppercase tracking-wider font-bold shrink-0"
          >
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGeolocate}
          disabled={loading}
          className="text-xs uppercase tracking-wider font-bold shrink-0 flex items-center justify-center gap-1.5"
        >
          <Navigation className="w-3.5 h-3.5" />
          Locate Me
        </Button>
      </div>

      {/* Interactive Map viewport */}
      <div className="relative w-full h-[260px] bg-muted rounded-lg overflow-hidden border border-border z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {loading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                Retrieving Location Address…
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-destructive">{error}</p>
      )}

      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
        📍 Drag the marker or click on the map to pinpoint your location.
      </p>

    </div>
  );
}
