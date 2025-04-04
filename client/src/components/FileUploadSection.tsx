import { useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { parseCSV, validateCSVStructure, convertCSVtoLeads } from "@/lib/utils/csvUtils";
import { FileUploadState, ProcessStatus } from "@/lib/types";
import { uploadCsv, downloadSampleCSV } from "@/lib/apiClient";
import CsvPreviewTable from "./CsvPreviewTable";
import { Upload, FileText, Loader2 } from "lucide-react";

interface FileUploadSectionProps {
  onUpload: (uploadState: FileUploadState) => void;
  onGenerate: () => void;
  uploadState: FileUploadState;
  isActive: boolean;
  processStatus: ProcessStatus;
  senderDetailsComplete: boolean;
}

export default function FileUploadSection({
  onUpload,
  onGenerate,
  uploadState,
  isActive,
  processStatus,
  senderDetailsComplete
}: FileUploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Only accept CSV files
      if (!file.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file",
          variant: "destructive"
        });
        return;
      }

      // Upload the file to the server
      const response = await uploadCsv(file);
      
      // Parse the CSV
      const parsedCSV = parseCSV(response.csv);
      
      // Validate the CSV structure
      const validation = validateCSVStructure(parsedCSV);
      if (!validation.valid) {
        toast({
          title: "Invalid CSV format",
          description: validation.message,
          variant: "destructive"
        });
        return;
      }

      // Convert CSV to leads
      const leads = convertCSVtoLeads(parsedCSV);

      // Update state with the parsed CSV data
      onUpload({
        file,
        parsedData: leads,
        previewData: parsedCSV.slice(0, 6), // First 5 rows plus header for preview
        headers: parsedCSV[0],
        error: null
      });

      toast({
        title: "File uploaded successfully",
        description: `${leads.length} leads loaded and ready to process.`,
      });
    } catch (error) {
      console.error("Error processing file:", error);
      onUpload({
        file: null,
        parsedData: null,
        previewData: null,
        headers: null,
        error: error instanceof Error ? error.message : "An unknown error occurred"
      });

      toast({
        title: "Error uploading file",
        description: error instanceof Error ? error.message : "Failed to process the file",
        variant: "destructive"
      });
    }
  }, [onUpload, toast]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      // Create a new FileList-like object with the dragged file
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      
      // Set the file input's files
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        
        // Trigger the change event
        const changeEvent = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(changeEvent);
      }
    }
  }, []);

  const handleClearFile = () => {
    onUpload({
      file: null,
      parsedData: null,
      previewData: null,
      headers: null,
      error: null
    });
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    toast({
      title: "File cleared",
      description: "You can now upload a different file.",
    });
  };

  const handleDownloadSample = () => {
    downloadSampleCSV();
    toast({
      title: "Sample CSV downloaded",
      description: "Use this as a template for your leads data.",
    });
  };

  const isGenerateDisabled = !uploadState.parsedData || 
                            !senderDetailsComplete || 
                            processStatus.inProgress;

  return (
    <Card className={`bg-white rounded-lg shadow overflow-hidden ${!isActive ? 'opacity-90' : ''}`}>
      <CardContent className="p-6">
        <h3 className="text-lg font-medium text-gray-900">Upload Leads Data</h3>
        <p className="mt-1 text-sm text-gray-600">Upload a CSV file with your leads information.</p>
        
        {/* Drag & Drop Upload Area */}
        <div className="mt-6">
          <div className="max-w-xl">
            <div 
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
                isDragging ? 'border-primary' : 'border-gray-300'
              } border-dashed rounded-md cursor-pointer hover:border-primary transition-colors duration-200`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-500 focus-within:outline-none">
                    <span>Upload a file</span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      className="sr-only" 
                      accept=".csv"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">CSV file with lead details</p>
              </div>
            </div>
          </div>

          {/* CSV Format Instructions */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700">Required CSV Format</h4>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                  <tr>
                    <td className="px-6 py-2 whitespace-nowrap">Jane Smith</td>
                    <td className="px-6 py-2 whitespace-nowrap">XYZ Corp</td>
                    <td className="px-6 py-2 whitespace-nowrap">Software Development</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-2">
              <button 
                onClick={handleDownloadSample}
                className="text-xs text-primary hover:text-blue-600 flex items-center"
              >
                <FileText className="h-4 w-4 mr-1" />
                Download sample CSV
              </button>
            </div>
          </div>
        </div>
        
        {/* Uploaded File Preview */}
        {uploadState.previewData && (
          <CsvPreviewTable 
            previewData={uploadState.previewData} 
            rowCount={uploadState.parsedData?.length || 0}
            onClear={handleClearFile}
          />
        )}
        
        {/* Generate Emails Button */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={onGenerate}
            disabled={isGenerateDisabled}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-accent hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${
              isGenerateDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {processStatus.inProgress ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating... ({processStatus.processed}/{processStatus.total})
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Generate Emails
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
