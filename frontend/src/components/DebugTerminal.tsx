import React from "react";
import { 
  Card, 
  CardContent, 
  Typography, 
  Paper,
  useTheme
} from "@mui/material";

interface DebugTerminalProps {
  debugLogs: string[];
}

function DebugTerminal({ debugLogs }: DebugTerminalProps) {
  const theme = useTheme();

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2,
            fontSize: { xs: '1rem', sm: '1.125rem' }
          }}
        >
          Debug Terminal
        </Typography>
        
        <Paper 
          sx={{ 
            bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100],
            p: 2, 
            height: { xs: 200, sm: 250, md: 300 }, 
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            color: theme.palette.mode === 'dark' ? theme.palette.success.light : theme.palette.success.dark,
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          {debugLogs.length === 0 ? (
            <Typography sx={{ 
              color: theme.palette.text.secondary, 
              fontFamily: 'monospace',
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}>
              Waiting for fan control operations...
            </Typography>
          ) : (
            debugLogs.map((log, index) => (
              <Typography 
                key={index} 
                sx={{ 
                  fontFamily: 'monospace', 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  color: log.includes('✗') ? theme.palette.error.main : 
                         log.includes('✓') ? theme.palette.success.main : 
                         log.includes('SSH Command:') ? theme.palette.warning.main : 
                         theme.palette.mode === 'dark' ? theme.palette.success.light : theme.palette.success.dark,
                  mb: 0.5,
                  lineHeight: 1.4
                }}
              >
                {log}
              </Typography>
            ))
          )}
        </Paper>
      </CardContent>
    </Card>
  );
}

export default DebugTerminal;
