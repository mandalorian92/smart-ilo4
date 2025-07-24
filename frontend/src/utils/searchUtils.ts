// Utility functions for search functionality

/**
 * Searches through row data for matching terms
 * @param row - The data row to search in
 * @param query - The search query string
 * @param columns - Array of column definitions to search through
 * @returns boolean - True if all search terms are found
 */
export const searchInRow = (row: any, query: string, columns: { id: string }[]): boolean => {
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
  
  return searchTerms.every(term => {
    return columns.some(column => {
      const value = row[column.id];
      if (value === null || value === undefined) return false;
      
      // Convert value to string for searching
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return stringValue.toLowerCase().includes(term);
    });
  });
};

/**
 * Filters array data based on search query
 * @param data - Array of data to filter
 * @param query - Search query string
 * @param columns - Column definitions to search through
 * @returns Filtered array
 */
export const filterData = <T>(data: T[], query: string, columns: { id: string }[]): T[] => {
  if (!query.trim()) return data;
  return data.filter(row => searchInRow(row, query, columns));
};
