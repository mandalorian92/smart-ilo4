import React from "react";
import { 
  Typography, 
  Grid, 
  Box,
  useTheme
} from "@mui/material";
import { SPACING } from '../constants/spacing';
import { FanPresets, FanControlCard, SensorConfiguration } from './FanControls';

// Main Controls component with proper two-row layout
function Controls({ onDebugLog }: { onDebugLog?: (message: string) => void }) {
  const theme = useTheme();
  
  return (
    <Box component="section" role="main" aria-label="System Controls">
      {/* Controls Layout with System-Wide Consistency */}
      <Grid container spacing={SPACING.CARD} rowSpacing={SPACING.ROW} sx={{ width: '100%' }}>
        {/* First Row - Quick Presets (full width) */}
        <Grid item xs={12}>
          <FanPresets onDebugLog={onDebugLog} />
        </Grid>

        {/* Second Row - Fan Control (full width) */}
        <Grid item xs={12}>
          <FanControlCard onDebugLog={onDebugLog} />
        </Grid>
        
        {/* Third Row - Sensor Configuration (full width) */}
        <Grid item xs={12}>
          <SensorConfiguration />
        </Grid>
      </Grid>
    </Box>
  );
}

export default Controls;
