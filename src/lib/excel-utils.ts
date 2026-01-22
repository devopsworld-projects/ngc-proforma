import ExcelJS from "exceljs";

/**
 * Parse an Excel file and return rows as JSON objects
 * Uses exceljs for safer parsing (no prototype pollution vulnerabilities)
 */
export async function parseExcelFile(file: File): Promise<Record<string, any>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("No worksheet found in Excel file");
  }
  
  const rows: Record<string, any>[] = [];
  const headers: string[] = [];
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      // First row is headers
      row.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = String(cell.value || "").trim();
      });
    } else {
      // Data rows
      const rowData: Record<string, any> = {};
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        if (header) {
          // Handle different cell value types
          let value = cell.value;
          if (value && typeof value === "object") {
            // Handle rich text, formulas, etc.
            if ("result" in value) {
              value = value.result;
            } else if ("text" in value) {
              value = value.text;
            } else if ("richText" in value) {
              value = (value as ExcelJS.CellRichTextValue).richText
                .map(rt => rt.text)
                .join("");
            }
          }
          rowData[header] = value ?? "";
        }
      });
      // Only add non-empty rows
      if (Object.keys(rowData).length > 0) {
        rows.push(rowData);
      }
    }
  });
  
  return rows;
}

/**
 * Create and download an Excel file from JSON data
 */
export async function downloadExcelTemplate(
  data: Record<string, any>[],
  filename: string,
  sheetName: string = "Sheet1",
  columnWidths?: number[]
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  
  if (data.length > 0) {
    // Add headers
    const headers = Object.keys(data[0]);
    worksheet.addRow(headers);
    
    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };
    
    // Add data rows
    data.forEach(item => {
      const row = headers.map(header => item[header]);
      worksheet.addRow(row);
    });
    
    // Set column widths
    if (columnWidths) {
      columnWidths.forEach((width, index) => {
        const column = worksheet.getColumn(index + 1);
        column.width = width;
      });
    } else {
      // Auto-width based on content
      worksheet.columns.forEach(column => {
        column.width = Math.max(12, Math.min(50, (column.header?.toString().length || 10) + 5));
      });
    }
  }
  
  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
  });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
