    "use client";

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions,
  ChartTypeRegistry
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { motion } from 'framer-motion';

// Register all components including Filler
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartWrapperProps {
  type: keyof ChartTypeRegistry;
  data: ChartData<any>;
  options?: ChartOptions<any>;
  className?: string;
  height?: number | string;
  width?: number | string;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({ 
  type, 
  data, 
  options, 
  className = "",
  height,
  width
}) => {
  // Default options for better responsiveness and visuals
  const defaultOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          color: 'rgba(156, 163, 175, 0.8)', // gray-400
          font: {
            family: "'Inter', sans-serif",
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)', // gray-900
        titleColor: '#fff',
        bodyColor: '#e5e7eb', // gray-200
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        usePointStyle: true,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(107, 114, 128, 0.1)', // gray-500 with low opacity
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(156, 163, 175, 0.8)', // gray-400
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(156, 163, 175, 0.8)',
          font: {
            size: 11
          }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    ...options
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`w-full h-full ${className}`}
      style={{ height, width }}
    >
      <Chart type={type} data={data} options={defaultOptions} />
    </motion.div>
  );
};

export default ChartWrapper;
