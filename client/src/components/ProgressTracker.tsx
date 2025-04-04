import { AppStep } from "@/lib/types";

interface ProgressTrackerProps {
  currentStep: AppStep;
  senderDetailsComplete: boolean;
  fileUploadComplete: boolean;
}

export default function ProgressTracker({
  currentStep,
  senderDetailsComplete,
  fileUploadComplete
}: ProgressTrackerProps) {
  // Calculate progress percentage for the progress bar
  const calculateProgress = () => {
    if (currentStep === AppStep.SenderDetails) {
      return senderDetailsComplete ? "50%" : "0%";
    } else if (currentStep === AppStep.UploadLeads) {
      return fileUploadComplete ? "100%" : "50%";
    } else {
      return "100%";
    }
  };

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800">Generate Personalized Emails</h2>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Beta
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-600">Upload your leads and customize emails in three easy steps</p>
      
      {/* Progress steps */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= AppStep.SenderDetails ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
            } font-semibold`}>
              1
            </div>
            <span className={`mt-2 text-sm ${
              currentStep >= AppStep.SenderDetails ? "text-gray-700 font-medium" : "text-gray-500"
            }`}>
              Sender Details
            </span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mx-4 relative">
            <div 
              className="absolute inset-0 bg-primary" 
              style={{ width: senderDetailsComplete ? "100%" : "0%" }}
            ></div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= AppStep.UploadLeads ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
            } font-semibold`}>
              2
            </div>
            <span className={`mt-2 text-sm ${
              currentStep >= AppStep.UploadLeads ? "text-gray-700 font-medium" : "text-gray-500"
            }`}>
              Upload Leads
            </span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mx-4 relative">
            <div 
              className="absolute inset-0 bg-primary" 
              style={{ width: currentStep >= AppStep.ReviewExport ? "100%" : "0%" }}
            ></div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= AppStep.ReviewExport ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
            } font-semibold`}>
              3
            </div>
            <span className={`mt-2 text-sm ${
              currentStep >= AppStep.ReviewExport ? "text-gray-700 font-medium" : "text-gray-500"
            }`}>
              Review & Export
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
