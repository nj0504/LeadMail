import { Lead } from "@shared/schema";

// Function to parse CSV string and return array of arrays
export function parseCSV(csvString: string): string[][] {
  // Split the CSV by new lines
  const lines = csvString.split(/\r\n|\n/);
  const result: string[][] = [];

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const row: string[] = [];
    let cell = '';
    let inQuotes = false;

    // Process each character in the line
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = line[j + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            // Double quotes inside quotes - add a single quote
            cell += '"';
            j++; // Skip the next quote
          } else {
            // End of quoted section
            inQuotes = false;
          }
        } else {
          // Regular character inside quotes
          cell += char;
        }
      } else {
        if (char === '"') {
          // Start of quoted section
          inQuotes = true;
        } else if (char === ',') {
          // End of cell
          row.push(cell);
          cell = '';
        } else {
          // Regular character
          cell += char;
        }
      }
    }

    // Add the last cell
    row.push(cell);
    result.push(row);
  }

  return result;
}

// Function to convert CSV data to leads
export function convertCSVtoLeads(csvData: string[][]): Lead[] {
  const headers = csvData[0].map(header => header.trim().toLowerCase());
  
  // Check if required headers exist
  const nameIndex = headers.findIndex(h => h === 'name');
  const companyIndex = headers.findIndex(h => h === 'company name');
  const productIndex = headers.findIndex(h => h === 'product description');
  
  if (nameIndex === -1 || companyIndex === -1) {
    throw new Error('CSV must contain "Name" and "Company Name" columns');
  }
  
  // Convert rows to leads
  const leads: Lead[] = [];
  
  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i];
    if (row.length < Math.max(nameIndex, companyIndex) + 1) {
      // Skip rows that don't have enough columns
      continue;
    }
    
    leads.push({
      name: row[nameIndex],
      company: row[companyIndex],
      product: productIndex !== -1 ? row[productIndex] : undefined
    });
  }
  
  return leads;
}

// Function to validate CSV data has required columns
export function validateCSVStructure(csvData: string[][]): { valid: boolean; message?: string } {
  if (!csvData || csvData.length < 2) {
    return { valid: false, message: 'CSV file must contain a header row and at least one data row' };
  }
  
  const headers = csvData[0].map(header => header.trim().toLowerCase());
  
  if (!headers.includes('name')) {
    return { valid: false, message: 'CSV must contain a "Name" column' };
  }
  
  if (!headers.includes('company name')) {
    return { valid: false, message: 'CSV must contain a "Company Name" column' };
  }
  
  return { valid: true };
}

// Function to get a subset of CSV data for preview
export function getCSVPreview(csvData: string[][], maxRows: number = 5): string[][] {
  if (!csvData || csvData.length === 0) {
    return [];
  }
  
  const headers = csvData[0];
  const dataRows = csvData.slice(1, maxRows + 1);
  
  return [headers, ...dataRows];
}
