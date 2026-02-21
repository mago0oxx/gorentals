import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useBranchDetection() {
  const [detectedBranch, setDetectedBranch] = useState(null);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    try {
      // Try geolocation first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await setBranchByCoordinates(latitude, longitude);
          },
          async () => {
            // Fallback to IP-based detection
            await setBranchByIP();
          }
        );
      } else {
        await setBranchByIP();
      }
    } catch (error) {
      console.error('Error detecting location:', error);
      await setDefaultBranch();
    }
  };

  const setBranchByCoordinates = async (lat, lng) => {
    const branches = await base44.entities.Branch.list('sort_order');
    
    // Buenos Aires coordinates: ~(-34.6, -58.4)
    // Isla de Margarita coordinates: ~(11.0, -63.9)
    
    const distanceToBuenosAires = Math.abs(lat + 34.6) + Math.abs(lng + 58.4);
    const distanceToMargarita = Math.abs(lat - 11.0) + Math.abs(lng + 63.9);
    
    let selectedBranch;
    if (distanceToBuenosAires < distanceToMargarita) {
      selectedBranch = branches.find(b => b.city === 'Buenos Aires');
    } else {
      selectedBranch = branches.find(b => b.city === 'Isla de Margarita');
    }
    
    // Si la sucursal está en "próximamente", usar Buenos Aires
    if (!selectedBranch || selectedBranch.is_coming_soon) {
      selectedBranch = branches.find(b => b.city === 'Buenos Aires' && !b.is_coming_soon);
    }
    
    setDetectedBranch(selectedBranch || branches[0]);
    setIsDetecting(false);
  };

  const setBranchByIP = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      const branches = await base44.entities.Branch.list('sort_order');
      let selectedBranch;
      
      // Detectar por país
      if (data.country_code === 'AR') {
        selectedBranch = branches.find(b => b.city === 'Buenos Aires');
      } else if (data.country_code === 'VE') {
        selectedBranch = branches.find(b => b.city === 'Isla de Margarita');
      }
      
      // Si la sucursal está en "próximamente", usar Buenos Aires
      if (!selectedBranch || selectedBranch.is_coming_soon) {
        selectedBranch = branches.find(b => b.city === 'Buenos Aires' && !b.is_coming_soon);
      }
      
      setDetectedBranch(selectedBranch || branches[0]);
    } catch (error) {
      console.error('IP detection failed:', error);
      await setDefaultBranch();
    }
    setIsDetecting(false);
  };

  const setDefaultBranch = async () => {
    const branches = await base44.entities.Branch.list('sort_order');
    const buenosAires = branches.find(b => b.city === 'Buenos Aires');
    setDetectedBranch(buenosAires || branches[0]);
    setIsDetecting(false);
  };

  return { detectedBranch, isDetecting };
}