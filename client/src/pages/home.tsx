import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import ProgressTracker from "@/components/ProgressTracker";
import SenderDetailsForm from "@/components/SenderDetailsForm";
import FileUploadSection from "@/components/FileUploadSection";
import GeneratedEmailsSection from "@/components/GeneratedEmailsSection";
import { SenderDetails, Lead, GeneratedEmail } from "@shared/schema";
import { AppStep, FileUploadState, ProcessStatus } from "@/lib/types";
import { generateEmails } from "@/lib/apiClient";
import { Mail } from "lucide-react";

export default function Home() {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.SenderDetails);
  const [senderDetails, setSenderDetails] = useState<SenderDetails | null>(null);
  const [fileUploadState, setFileUploadState] = useState<FileUploadState>({
    file: null,
    parsedData: null,
    previewData: null,
    headers: null,
    error: null
  });
  const [processStatus, setProcessStatus] = useState<ProcessStatus>({
    processed: 0,
    total: 0,
    inProgress: false
  });
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([]);
  const { toast } = useToast();

  const handleSenderDetailsSubmit = (details: SenderDetails) => {
    setSenderDetails(details);
    setCurrentStep(AppStep.UploadLeads);
    toast({
      title: "Sender details saved",
      description: "You can now upload your leads file",
    });
  };

  const handleLeadsUpload = (uploadState: FileUploadState) => {
    setFileUploadState(uploadState);
  };

  const handleGenerateEmails = async () => {
    if (!senderDetails || !fileUploadState.parsedData) {
      toast({
        title: "Missing information",
        description: "Please complete all previous steps before generating emails",
        variant: "destructive"
      });
      return;
    }

    setProcessStatus({
      processed: 0,
      total: fileUploadState.parsedData.length,
      inProgress: true
    });

    try {
      const leads = fileUploadState.parsedData;
      
      const result = await generateEmails(senderDetails, leads);
      
      setGeneratedEmails(result.emails);
      setCurrentStep(AppStep.ReviewExport);
      
      toast({
        title: "Emails generated successfully",
        description: `Generated ${result.emails.length} personalized emails`,
      });
    } catch (error) {
      console.error("Error generating emails:", error);
      toast({
        title: "Error generating emails",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setProcessStatus({
        processed: fileUploadState.parsedData.length,
        total: fileUploadState.parsedData.length,
        inProgress: false
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-primary" />
            <h1 className="ml-2 text-xl font-semibold text-gray-800">AI Email Generator</h1>
          </div>
          <div>
            <a 
              href="https://github.com/yourusername/ai-email-generator" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              Help
            </a>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProgressTracker 
            currentStep={currentStep} 
            senderDetailsComplete={!!senderDetails}
            fileUploadComplete={!!fileUploadState.parsedData} 
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            <div className="md:col-span-1">
              <SenderDetailsForm 
                onSubmit={handleSenderDetailsSubmit} 
                initialData={senderDetails} 
                isActive={currentStep === AppStep.SenderDetails}
              />
            </div>
            
            <div className="md:col-span-2">
              <FileUploadSection 
                onUpload={handleLeadsUpload}
                onGenerate={handleGenerateEmails}
                uploadState={fileUploadState}
                isActive={currentStep === AppStep.UploadLeads}
                processStatus={processStatus}
                senderDetailsComplete={!!senderDetails}
              />
            </div>
          </div>

          {currentStep === AppStep.ReviewExport && generatedEmails.length > 0 && (
            <GeneratedEmailsSection 
              emails={generatedEmails} 
              senderDetails={senderDetails!}
              setEmails={setGeneratedEmails}
            />
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} AI Email Generator. All rights reserved.
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">Terms</a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
