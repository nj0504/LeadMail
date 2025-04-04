import React from "react";

interface CsvPreviewTableProps {
  previewData: string[][];
  rowCount: number;
  onClear: () => void;
}

export default function CsvPreviewTable({
  previewData,
  rowCount,
  onClear
}: CsvPreviewTableProps) {
  if (!previewData || previewData.length === 0) {
    return null;
  }

  const headers = previewData[0];
  const dataRows = previewData.slice(1);

  return (
    <div className="mt-6">
      <h4 className="text-sm font-medium text-gray-700 flex items-center">
        <span>Preview</span>
        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
          {rowCount} {rowCount === 1 ? 'row' : 'rows'}
        </span>
        <button 
          type="button" 
          className="ml-auto text-sm text-red-600 hover:text-red-500"
          onClick={onClear}
        >
          Clear
        </button>
      </h4>
      <div className="mt-2 overflow-x-auto rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              {headers.map((header, index) => (
                <th 
                  key={index}
                  scope="col" 
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-xs">
            {dataRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="px-3 py-2 whitespace-nowrap text-gray-500">{rowIndex + 1}</td>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-2 whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
