import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CrowdMonitorProps {
  restaurantId: string;
  restaurantName: string;
  maxCapacity?: number;
  allowLiveStream?: boolean;
}

const CrowdMonitor: React.FC<CrowdMonitorProps> = ({ 
  restaurantId, 
  restaurantName, 
  maxCapacity = 50 
}) => {
  const [occupancy, setOccupancy] = useState(0);
  const [status, setStatus] = useState<'Quiet' | 'Moderate' | 'Busy' | 'Crowded'>('Quiet');

  const apiUrl = import.meta.env.VITE_API_URL;

  // Real-time crowd status: connects to backend YOLOv8 detector if available
  useEffect(() => {
    let isMounted = true;

    // Initial base occupancy based on restaurant ID
    const hash = restaurantId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const initialOccupancy = (hash % Math.min(15, maxCapacity)) + 1;
    setOccupancy(initialOccupancy);

    const fetchCrowdData = async () => {
      if (apiUrl) {
        try {
          const response = await fetch(`${apiUrl}/api/outlets/${restaurantId}`);
          if (!response.ok) throw new Error('Server offline');
          const json = await response.json();
          
          if (json.success && json.data && isMounted) {
            setOccupancy(json.data.occupancy);
            return;
          }
        } catch {
          // Fallback to simulation if backend API is unavailable
        }
      }

      // Smooth simulated crowd variation for frontend-only presentation
      if (isMounted) {
        setOccupancy(prev => {
          const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
          return Math.max(0, Math.min(maxCapacity, prev + change));
        });
      }
    };

    fetchCrowdData();
    const pollInterval = setInterval(fetchCrowdData, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [restaurantId, maxCapacity, apiUrl]);

  // Map headcount to density levels:
  // Low: 1 - 5 people (Quiet)
  // Medium: 6 - 10 people (Moderate)
  // High: More than 10 people (Crowded)
  useEffect(() => {
    if (occupancy <= 5) {
      setStatus('Quiet');
    } else if (occupancy <= 10) {
      setStatus('Moderate');
    } else {
      setStatus('Crowded');
    }
  }, [occupancy]);

  const getStatusColor = () => {
    switch (status) {
      case 'Quiet': return 'text-green-500 bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/30';
      case 'Moderate': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30';
      case 'Busy': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800/30';
      case 'Crowded': return 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'Quiet': return <CheckCircle className="w-4 h-4" />;
      case 'Moderate': return <Users className="w-4 h-4" />;
      case 'Busy': return <Users className="w-4 h-4" />;
      case 'Crowded': return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getStatusColor()} transition-colors duration-500`}>
          {getStatusIcon()}
          <span>{status === 'Quiet' ? 'Low' : status === 'Moderate' ? 'Medium' : 'High'}</span>
        </div>
      </div>
      
      {/* Categorical Progress Bar (No Numbers) */}
      <div className="h-1.5 w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ 
            width: status === 'Quiet' ? '25%' : status === 'Moderate' ? '65%' : '100%' 
          }}
          className={`h-full transition-all duration-500 ${
            status === 'Quiet' ? 'bg-green-500' :
            status === 'Moderate' ? 'bg-blue-500' :
            status === 'Busy' ? 'bg-orange-500' : 'bg-red-500'
          }`}
        />
      </div>

      {/* Suggestions for Medium and High */}
      <AnimatePresence>
        {status === 'Moderate' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl mt-2"
          >
            <Users className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium leading-tight">
              Moderate crowd. Consider pre-ordering to avoid wait times at {restaurantName}.
            </p>
          </motion.div>
        )}

        {status === 'Crowded' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 rounded-xl mt-2"
          >
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-red-600 dark:text-red-400 font-medium leading-tight">
              High crowd alert! Consider pre-ordering to avoid long wait times at {restaurantName}.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CrowdMonitor;
