import React, { useEffect, useState } from "react";
import { getSensors, getFans } from "../api";
import { 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress,
  Box,
  useTheme,
  useMediaQuery,
  Stack
} from "@mui/material";
import { CARD_STYLES, getGridCardContainerProps } from '../constants/cardStyles';

// System Health Gauge with Pie Chart Component following System design guidelines
function SystemHealthGauge({ 
  values, 
  total,
  size = 280,
  theme
}: {
  values: Array<{ value: number; color: string; label: string }>;
  total: number;
  size?: number;
  theme: any;
}) {
  const gaugeRadius = size / 2 - 30;
  const pieRadius = size / 3.2; // Increased from size / 4 to reduce gap
  const center = size / 2;
  
  // Calculate pie chart segments
  let currentAngle = 0;
  const pieSegments = values.map(item => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return {
      ...item,
      startAngle,
      endAngle: currentAngle,
      angle
    };
  });
  
  // Create pie chart path
  const createPieSlice = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(center, center, radius, endAngle);
    const end = polarToCartesian(center, center, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      "M", center, center,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };
  
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  // Calculate overall health percentage
  const healthyPercentage = total > 0 ? (values[0].value / total) * 100 : 100;
  const gaugeAngle = (healthyPercentage / 100) * 270; // 270 degrees for gauge
  // Flipped down: Start from bottom-left (-135°) and go clockwise
  const gaugeStart = polarToCartesian(center, center, gaugeRadius, -135);
  const gaugeEnd = polarToCartesian(center, center, gaugeRadius, -135 + gaugeAngle);
  
  return (
    <Box sx={{ 
      position: 'relative', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      flexDirection: 'column'
    }}>
      <Box sx={{ position: 'relative' }}>
        <svg width={size} height={size}>
          {/* Outer gauge track */}
          <path
            d={`M ${polarToCartesian(center, center, gaugeRadius, -135).x} ${polarToCartesian(center, center, gaugeRadius, -135).y} A ${gaugeRadius} ${gaugeRadius} 0 1 1 ${polarToCartesian(center, center, gaugeRadius, 135).x} ${polarToCartesian(center, center, gaugeRadius, 135).y}`}
            fill="none"
            stroke={theme.palette.divider}
            strokeWidth="16"
            strokeLinecap="round"
          />
          
          {/* Outer gauge progress */}
          <path
            d={`M ${gaugeStart.x} ${gaugeStart.y} A ${gaugeRadius} ${gaugeRadius} 0 ${gaugeAngle > 180 ? 1 : 0} 1 ${gaugeEnd.x} ${gaugeEnd.y}`}
            fill="none"
            stroke={
              healthyPercentage >= 90 ? theme.palette.success.main :
              healthyPercentage >= 70 ? theme.palette.warning.main :
              theme.palette.error.main
            }
            strokeWidth="16"
            strokeLinecap="round"
          />
          
          {/* Pie chart segments */}
          {pieSegments.map((segment, index) => (
            segment.value > 0 && (
              <path
                key={index}
                d={createPieSlice(segment.startAngle, segment.endAngle, pieRadius)}
                fill={segment.color}
                stroke="none"
                strokeWidth="0"
              />
            )
          ))}
          
          {/* Center circle for pie chart - removed to eliminate gap */}
        </svg>
        
        {/* Center content */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 'bold',
              color: 'text.primary',
              fontSize: { xs: '1.5rem', sm: '2rem' },
              lineHeight: 1
            }}
          >
            {Math.round(healthyPercentage)}%
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              textAlign: 'center',
              fontWeight: 500
            }}
          >
            System Health
          </Typography>
        </Box>
      </Box>
      
      {/* Legend */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: 3, 
        mt: 2,
        flexWrap: 'wrap'
      }}>
        {values.map((item, index) => (
          <Box key={index} sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.75 
          }}>
            <Box sx={{
              width: 14,
              height: 14,
              backgroundColor: item.color,
              borderRadius: item.label === 'Healthy' ? '50%' : 
                           item.label === 'Warning' ? '0' : '2px',
              ...(item.label === 'Warning' && {
                width: 0,
                height: 0,
                backgroundColor: 'transparent',
                borderLeft: '7px solid transparent',
                borderRight: '7px solid transparent',
                borderBottom: `12px solid ${item.color}`,
              }),
              ...(item.label === 'Critical' && {
                transform: 'rotate(45deg)',
              })
            }} />
            <Typography variant="caption" sx={{ 
              color: 'text.secondary',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              {item.label}
            </Typography>
            <Typography variant="caption" sx={{ 
              color: item.color,
              fontSize: '0.875rem',
              fontWeight: 'bold'
            }}>
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

const SystemHealthOverview: React.FC = () => {
  const [sensors, setSensors] = useState<any[]>([]);
  const [fans, setFans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sensorsData, fansData] = await Promise.all([
          getSensors(),
          getFans()
        ]);
        setSensors(sensorsData);
        setFans(fansData);
      } catch (error) {
        console.error('Error fetching system health data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds for responsive UI
    return () => clearInterval(interval);
  }, []);

  // Calculate system health overview
  const getSystemHealthStats = () => {
    const tempSensors = sensors.filter(s => s.reading > 0);
    const activeFans = fans.filter(f => f.status !== 'Absent');
    
    const criticalTemps = tempSensors.filter(s => s.critical && s.reading >= s.critical).length;
    const warningTemps = tempSensors.filter(s => s.critical && s.reading >= (s.critical - 15)).length - criticalTemps;
    const highSpeedFans = activeFans.filter(f => f.speed >= 85).length;
    const failedFans = activeFans.filter(f => f.health !== 'OK').length;
    
    const totalIssues = criticalTemps + failedFans;
    const totalWarnings = warningTemps + highSpeedFans;
    const totalHealthy = (tempSensors.length - criticalTemps - warningTemps) + (activeFans.length - failedFans - highSpeedFans);
    
    return {
      critical: totalIssues,
      warning: totalWarnings,
      healthy: totalHealthy,
      total: tempSensors.length + activeFans.length
    };
  };

  if (loading) {
    return (
      <Card {...getGridCardContainerProps(theme)}>
        <CardContent {...CARD_STYLES.CONTENT}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  const healthStats = getSystemHealthStats();
  const total = healthStats.total || 1; // Prevent division by zero
  
  // Prepare meter values for System Meter component
  const meterValues = [
    {
      value: healthStats.healthy,
      color: theme.palette.success.main, // Theme green for healthy
      label: 'Healthy'
    },
    {
      value: healthStats.warning,
      color: theme.palette.warning.main, // Theme orange for warning
      label: 'Warning'
    },
    {
      value: healthStats.critical,
      color: theme.palette.error.main, // Theme red for critical
      label: 'Critical'
    }
  ];

  return (
    <Card
      {...getGridCardContainerProps(theme)}
    >
      <CardContent {...CARD_STYLES.CONTENT}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography
            {...CARD_STYLES.TITLE}
          >
            System Health Overview
          </Typography>
        </Box>
        
        {/* Main Content */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: { xs: '300px', sm: '350px' }
        }}>
          <SystemHealthGauge
            values={meterValues}
            total={total}
            size={isMobile ? 250 : 320}
            theme={theme}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default SystemHealthOverview;
