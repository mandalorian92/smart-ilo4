import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  Select,
  MenuItem,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  SelectChangeEvent,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Download,
  Refresh,
  DataUsage,
  Storage,
  Schedule,
  Assessment,
  SelectAll,
  ClearAll
} from '@mui/icons-material';
import { historyAPI } from '../api';

interface DatabaseStats {
  totalRecords: number;
  sensorRecords: number;
  fanRecords: number;
  historicalRecords: number;
  oldestRecord: string;
  newestRecord: string;
  databaseSize: string;
}

interface DatabaseRecord {
  id: number;
  timestamp: string;
  type?: string;
  name?: string;
  value?: number;
  unit?: string;
  status?: string;
  data?: any;
  created_at?: string;
}

interface PaginatedData {
  data: DatabaseRecord[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

const HistoryViewer: React.FC = () => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [data, setData] = useState<PaginatedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Selection state
  const [selectedRecords, setSelectedRecords] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Table controls
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const tableOptions = [
    { value: 'all', label: 'All Data' },
    { value: 'sensor_readings', label: 'Sensor Readings' },
    { value: 'fan_readings', label: 'Fan Readings' },
    { value: 'historical_data', label: 'Historical Data' }
  ];

  const exportFormats = [
    { value: 'csv', label: 'CSV' },
    { value: 'json', label: 'JSON' },
    { value: 'txt', label: 'Text' }
  ];

  const loadDatabaseStats = async () => {
    try {
      const stats = await historyAPI.getDatabaseStats();
      setStats(stats);
    } catch (err) {
      console.error('Error loading database stats:', err);
      setError('Failed to load database statistics');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await historyAPI.getPaginatedData(
        selectedTable,
        page + 1, // API expects 1-based page numbers
        pageSize,
        sortBy,
        sortOrder
      );
      setData(data);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load database data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([loadDatabaseStats(), loadData()]);
  };

  const handleTableChange = (event: SelectChangeEvent<string>) => {
    setSelectedTable(event.target.value);
    setPage(0); // Reset to first page
    setSelectedRecords(new Set()); // Clear selections
    setSelectAll(false);
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
    setSelectAll(false); // Reset select all when changing pages
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
    setSelectedRecords(new Set()); // Clear selections
    setSelectAll(false);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('DESC');
    }
    setPage(0);
    setSelectedRecords(new Set()); // Clear selections
    setSelectAll(false);
  };

  const handleSelectRecord = (recordId: number) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId);
    } else {
      newSelected.add(recordId);
    }
    setSelectedRecords(newSelected);
    
    // Update select all state
    if (data?.data) {
      const currentPageIds = data.data.map(record => record.id);
      const allCurrentPageSelected = currentPageIds.every(id => newSelected.has(id));
      setSelectAll(allCurrentPageSelected);
    }
  };

  const handleSelectAllOnPage = () => {
    if (!data?.data) return;
    
    const currentPageIds = data.data.map(record => record.id);
    const newSelected = new Set(selectedRecords);
    
    if (selectAll) {
      // Deselect all on current page
      currentPageIds.forEach(id => newSelected.delete(id));
      setSelectAll(false);
    } else {
      // Select all on current page
      currentPageIds.forEach(id => newSelected.add(id));
      setSelectAll(true);
    }
    
    setSelectedRecords(newSelected);
  };

  const handleClearAllSelections = () => {
    setSelectedRecords(new Set());
    setSelectAll(false);
  };

  const handleExport = async (format: string, exportSelected: boolean = false) => {
    try {
      setExporting(true);
      
      if (exportSelected && selectedRecords.size > 0) {
        // Export selected records
        const selectedData = data?.data.filter(record => selectedRecords.has(record.id)) || [];
        
        let exportContent = '';
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        
        if (format === 'csv') {
          const headers = ['ID', 'Timestamp', 'Type', 'Name', 'Value', 'Unit', 'Status'];
          exportContent = headers.join(',') + '\n';
          exportContent += selectedData.map(record => {
            const value = record.value !== undefined ? record.value : (record.data ? JSON.stringify(record.data) : '');
            return [
              record.id,
              record.timestamp,
              record.type || '',
              record.name || '',
              value,
              record.unit || '',
              record.status || ''
            ].map(field => `"${field}"`).join(',');
          }).join('\n');
        } else if (format === 'json') {
          exportContent = JSON.stringify(selectedData, null, 2);
        } else {
          exportContent = selectedData.map(record => {
            const value = record.value !== undefined ? `${record.value}${record.unit ? ` ${record.unit}` : ''}` : 
                         record.data ? JSON.stringify(record.data) : 'N/A';
            return `ID: ${record.id}\nTimestamp: ${record.timestamp}\nType: ${record.type || 'N/A'}\nName: ${record.name || 'N/A'}\nValue: ${value}\nStatus: ${record.status || 'N/A'}\n---`;
          }).join('\n');
        }
        
        // Create and download file
        const blob = new Blob([exportContent], { 
          type: format === 'csv' ? 'text/csv' : format === 'json' ? 'application/json' : 'text/plain' 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ilo4-selected-${selectedRecords.size}records-${timestamp}.${format}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Export all data for selected table
        const blob = await historyAPI.exportData(selectedTable, format);
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.download = `ilo4-${selectedTable}-${timestamp}.${format}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const formatValue = (record: DatabaseRecord) => {
    if (record.value !== undefined) {
      return `${record.value}${record.unit ? ` ${record.unit}` : ''}`;
    }
    if (record.data) {
      return JSON.stringify(record.data).substring(0, 100) + '...';
    }
    return 'N/A';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusChip = (status?: string) => {
    if (!status) return null;
    
    const color = status.toLowerCase() === 'ok' ? 'success' : 
                  status.toLowerCase() === 'warning' ? 'warning' : 'error';
    
    return <Chip label={status} color={color} size="small" />;
  };

  useEffect(() => {
    loadDatabaseStats();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedTable, page, pageSize, sortBy, sortOrder]);

  if (loading && !data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Database Viewer
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Database Statistics */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <DataUsage color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Total Records
                    </Typography>
                    <Typography variant="h6">
                      {stats.totalRecords.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Assessment color="success" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Sensor Records
                    </Typography>
                    <Typography variant="h6">
                      {stats.sensorRecords.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Storage color="info" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Fan Records
                    </Typography>
                    <Typography variant="h6">
                      {stats.fanRecords.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Schedule color="warning" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Database Size
                    </Typography>
                    <Typography variant="h6">
                      {stats.databaseSize}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <Select
                value={selectedTable}
                onChange={handleTableChange}
                displayEmpty
              >
                {tableOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Selection Controls */}
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<SelectAll />}
                onClick={handleSelectAllOnPage}
                disabled={!data?.data || data.data.length === 0}
              >
                {selectAll ? 'Deselect Page' : 'Select Page'}
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ClearAll />}
                onClick={handleClearAllSelections}
                disabled={selectedRecords.size === 0}
              >
                Clear All
              </Button>
            </Box>
          </Grid>
          
          {/* Export Controls */}
          <Grid item xs={12} sm={12} md={6}>
            <Box display="flex" gap={1} justifyContent="flex-end" flexWrap="wrap">
              {selectedRecords.size > 0 && (
                <Typography variant="body2" sx={{ alignSelf: 'center', mr: 1 }}>
                  {selectedRecords.size} selected
                </Typography>
              )}
              
              {/* Export Selected Records */}
              {selectedRecords.size > 0 && (
                <>
                  {exportFormats.map((format) => (
                    <Button
                      key={`selected-${format.value}`}
                      variant="contained"
                      size="small"
                      startIcon={<Download />}
                      onClick={() => handleExport(format.value, true)}
                      disabled={exporting}
                      color="primary"
                    >
                      Export Selected {format.label}
                    </Button>
                  ))}
                </>
              )}
              
              {/* Export All Records */}
              {exportFormats.map((format) => (
                <Button
                  key={format.value}
                  variant="outlined"
                  size="small"
                  startIcon={<Download />}
                  onClick={() => handleExport(format.value, false)}
                  disabled={exporting}
                >
                  Export All {format.label}
                </Button>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Data Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectAll}
                      indeterminate={selectedRecords.size > 0 && !selectAll}
                      onChange={handleSelectAllOnPage}
                      disabled={!data?.data || data.data.length === 0}
                    />
                  }
                  label=""
                />
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => handleSort('timestamp')}
                  sx={{ textTransform: 'none', fontWeight: 'bold' }}
                >
                  Timestamp {sortBy === 'timestamp' && (sortOrder === 'ASC' ? ' ▲' : ' ▼')}
                </Button>
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => handleSort('type')}
                  sx={{ textTransform: 'none', fontWeight: 'bold' }}
                >
                  Type {sortBy === 'type' && (sortOrder === 'ASC' ? ' ▲' : ' ▼')}
                </Button>
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => handleSort('name')}
                  sx={{ textTransform: 'none', fontWeight: 'bold' }}
                >
                  Name {sortBy === 'name' && (sortOrder === 'ASC' ? ' ▲' : ' ▼')}
                </Button>
              </TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : data?.data && data.data.length > 0 ? (
              data.data.map((record) => (
                <TableRow key={record.id} hover selected={selectedRecords.has(record.id)}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRecords.has(record.id)}
                      onChange={() => handleSelectRecord(record.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={formatTimestamp(record.timestamp)}>
                      <span>{formatTimestamp(record.timestamp)}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {record.type && (
                      <Chip label={record.type} variant="outlined" size="small" />
                    )}
                  </TableCell>
                  <TableCell>{record.name || 'N/A'}</TableCell>
                  <TableCell>{formatValue(record)}</TableCell>
                  <TableCell>{getStatusChip(record.status)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {data && (
          <TablePagination
            component="div"
            count={data.totalCount || 0}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[25, 50, 100, 200]}
          />
        )}
      </TableContainer>
    </Box>
  );
};

export default HistoryViewer;
