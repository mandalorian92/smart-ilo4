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
  Grid,
  Paper
} from "@mui/material";
import SpeedIcon from '@mui/icons-material/Speed';

// Circular progress component for gauges
function CircularGauge({ 
  value, 
  maxValue, 
  size = 120, 
  thickness = 8, 
  color, 
  label, 
  unit,
  showValue = true 
}: {
  value: number;
  maxValue: number;
  size?: number;
  thickness?: number;
  color: string;
  label: string;
  unit: string;
  showValue?: boolean;
}) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const circumference = 2 * Math.PI * (size / 2 - thickness);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - thickness}
          stroke="currentColor"
          strokeWidth={thickness}
          fill="transparent"
          style={{ opacity: 0.1 }}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - thickness}
          stroke={color}
          strokeWidth={thickness}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.6s ease-in-out',
          }}
        />
      </svg>
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}
      >
        {showValue && (
          <>
            <Typography 
              variant="h4" 
              component="div" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '1.5rem', sm: '2rem' },
                color: color,
                lineHeight: 1
              }}
            >
              {Math.round(value)}{unit}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'text.secondary',
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                textAlign: 'center',
                mt: 0.5
              }}
            >
              {label}
            </Typography>
          </>
        )}
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
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
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
      <Card elevation={2} sx={{ border: `1px solid ${theme.palette.divider}` }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  const healthStats = getSystemHealthStats();
  const healthPercentage = healthStats.total > 0 ? (healthStats.healthy / healthStats.total) * 100 : 100;

  return (
    <Card 
      elevation={2}
      sx={{ 
        border: `1px solid ${theme.palette.divider}`,
        background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}05)`
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="h5" 
          component="h2"
          sx={{ 
            fontSize: { xs: '1.1rem', sm: '1.3rem' },
            fontWeight: 600,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <SpeedIcon /> System Health Overview
        </Typography>
        
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={5}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              py: 2
            }}>
              <CircularGauge
                value={Math.round(healthPercentage)}
                maxValue={100}
                size={isMobile ? 120 : 140}
                thickness={4}
                color={
                  healthPercentage >= 90 ? theme.palette.success.main :
                  healthPercentage >= 70 ? theme.palette.warning.main :
                  theme.palette.error.main
                }
                label="System Health"
                unit="%"
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={7}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    border: `2px solid ${theme.palette.success.main}`,
                    backgroundColor: `${theme.palette.success.main}08`,
                    borderRadius: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: `${theme.palette.success.main}12`,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${theme.palette.success.main}25`
                    }
                  }}
                >
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      color: theme.palette.success.main,
                      fontWeight: 'bold',
                      fontSize: { xs: '2rem', sm: '2.5rem' },
                      mb: 1
                    }}
                  >
                    {healthStats.healthy}
                  </Typography>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}
                  >
                    Healthy
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    border: `2px solid ${theme.palette.warning.main}`,
                    backgroundColor: `${theme.palette.warning.main}08`,
                    borderRadius: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: `${theme.palette.warning.main}12`,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${theme.palette.warning.main}25`
                    }
                  }}
                >
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      color: theme.palette.warning.main,
                      fontWeight: 'bold',
                      fontSize: { xs: '2rem', sm: '2.5rem' },
                      mb: 1
                    }}
                  >
                    {healthStats.warning}
                  </Typography>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}
                  >
                    Warning
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    border: `2px solid ${theme.palette.error.main}`,
                    backgroundColor: `${theme.palette.error.main}08`,
                    borderRadius: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: `${theme.palette.error.main}12`,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${theme.palette.error.main}25`
                    }
                  }}
                >
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      color: theme.palette.error.main,
                      fontWeight: 'bold',
                      fontSize: { xs: '2rem', sm: '2.5rem' },
                      mb: 1
                    }}
                  >
                    {healthStats.critical}
                  </Typography>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}
                  >
                    Critical
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SystemHealthOverview;
