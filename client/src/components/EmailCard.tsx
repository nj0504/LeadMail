import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SenderDetails, GeneratedEmail } from "@shared/schema";
import { regenerateEmailContent, exportEmailsAsCSV } from "@/lib/apiClient";
import { Check, Pencil, Copy, Download, RefreshCw } from "lucide-react";

interface EmailCardProps {
  email: GeneratedEmail;
  senderDetails: SenderDetails;
  onUpdate: (updatedEmail: GeneratedEmail) => void;
}

export default function EmailCard({
  email,
  senderDetails,
  onUpdate
}: EmailCardProps) {
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [isEditingBody, setIsEditingBody] = useState(false);
  const [editedSubject, setEditedSubject] = useState(email.subject);
  const [editedBody, setEditedBody] = useState(email.body);
  const [isRegeneratingSubject, setIsRegeneratingSubject] = useState(false);
  const [isRegeneratingBody, setIsRegeneratingBody] = useState(false);
  const { toast } = useToast();

  const handleMarkReviewed = () => {
    onUpdate({
      ...email,
      isReviewed: !email.isReviewed
    });
    
    toast({
      title: email.isReviewed ? "Email unmarked" : "Email marked as reviewed",
      description: email.isReviewed ? "Email is no longer marked as reviewed" : "Email has been marked as reviewed",
    });
  };

  const handleToggleSubjectEdit = () => {
    if (isEditingSubject) {
      // Save changes
      onUpdate({
        ...email,
        subject: editedSubject,
        isEdited: true
      });
      
      toast({
        title: "Subject updated",
        description: "Email subject has been updated successfully",
      });
    }
    setIsEditingSubject(!isEditingSubject);
  };

  const handleToggleBodyEdit = () => {
    if (isEditingBody) {
      // Save changes
      onUpdate({
        ...email,
        body: editedBody,
        isEdited: true
      });
      
      toast({
        title: "Email body updated",
        description: "Email body has been updated successfully",
      });
    }
    setIsEditingBody(!isEditingBody);
  };

  const handleRegenerateSubject = async () => {
    try {
      setIsRegeneratingSubject(true);
      
      const result = await regenerateEmailContent(
        email.id!,
        'subject',
        senderDetails
      );
      
      setEditedSubject(result.regeneratedContent);
      onUpdate(result.email);
      
      toast({
        title: "Subject regenerated",
        description: "Email subject has been regenerated successfully",
      });
    } catch (error) {
      console.error("Error regenerating subject:", error);
      toast({
        title: "Regeneration failed",
        description: "Failed to regenerate the email subject. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRegeneratingSubject(false);
    }
  };

  const handleRegenerateBody = async () => {
    try {
      setIsRegeneratingBody(true);
      
      const result = await regenerateEmailContent(
        email.id!,
        'body',
        senderDetails
      );
      
      setEditedBody(result.regeneratedContent);
      onUpdate(result.email);
      
      toast({
        title: "Email body regenerated",
        description: "Email body has been regenerated successfully",
      });
    } catch (error) {
      console.error("Error regenerating email body:", error);
      toast({
        title: "Regeneration failed",
        description: "Failed to regenerate the email body. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRegeneratingBody(false);
    }
  };

  const handleCopyEmail = () => {
    const emailText = `Subject: ${email.subject}\n\n${email.body}`;
    navigator.clipboard.writeText(emailText);
    
    toast({
      title: "Email copied",
      description: "Email content has been copied to clipboard",
    });
  };

  const handleExportSingleEmail = () => {
    exportEmailsAsCSV([email], `email-${email.recipientName.replace(/\s+/g, '-').toLowerCase()}.csv`);
    
    toast({
      title: "Email exported",
      description: "Email has been exported as a CSV file",
    });
  };

  // Format date for display
  const formattedDate = email.createdAt 
    ? new Date(email.createdAt).toLocaleDateString() 
    : 'Unknown date';

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-900">
            To: {email.recipientName} ({email.recipientCompany})
          </h4>
          <p className="text-sm text-gray-500">Generated on {formattedDate}</p>
        </div>
        <div className="flex space-x-2">
          <button 
            type="button" 
            className={`inline-flex items-center p-1 border border-transparent rounded-full ${
              email.isReviewed ? 'text-green-600 bg-green-100' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
            onClick={handleMarkReviewed}
          >
            <Check className="h-5 w-5" />
          </button>
          <button 
            type="button"
            className={`inline-flex items-center p-1 border border-transparent rounded-full ${
              isEditingSubject || isEditingBody ? 'text-blue-600 bg-blue-100' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
            onClick={() => {
              if (isEditingSubject) handleToggleSubjectEdit();
              if (isEditingBody) handleToggleBodyEdit();
              if (!isEditingSubject && !isEditingBody) {
                setIsEditingSubject(true);
              }
            }}
          >
            <Pencil className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="mt-3">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-sm font-medium text-gray-900">Subject:</h5>
          <button 
            type="button" 
            className="text-xs text-primary hover:text-blue-600 inline-flex items-center"
            onClick={isEditingSubject ? handleToggleSubjectEdit : handleRegenerateSubject}
            disabled={isRegeneratingSubject}
          >
            {isRegeneratingSubject ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Regenerating...
              </>
            ) : isEditingSubject ? (
              "Save"
            ) : (
              "Regenerate"
            )}
          </button>
        </div>
        <div className="px-3 py-2 bg-white border border-gray-200 rounded-md">
          {isEditingSubject ? (
            <Input
              value={editedSubject}
              onChange={(e) => setEditedSubject(e.target.value)}
              className="text-sm text-gray-800 w-full border-0 focus:ring-0 p-0"
            />
          ) : (
            <p className="text-sm text-gray-800">{email.subject}</p>
          )}
        </div>
      </div>
      
      <div className="mt-3">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-sm font-medium text-gray-900">Email Body:</h5>
          <button 
            type="button" 
            className="text-xs text-primary hover:text-blue-600 inline-flex items-center"
            onClick={isEditingBody ? handleToggleBodyEdit : handleRegenerateBody}
            disabled={isRegeneratingBody}
          >
            {isRegeneratingBody ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Regenerating...
              </>
            ) : isEditingBody ? (
              "Save"
            ) : (
              "Regenerate"
            )}
          </button>
        </div>
        <div className="px-3 py-2 bg-white border border-gray-200 rounded-md">
          {isEditingBody ? (
            <Textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              className="text-sm text-gray-800 w-full border-0 focus:ring-0 p-0 min-h-[200px]"
            />
          ) : (
            <p className="text-sm text-gray-800 whitespace-pre-line">{email.body}</p>
          )}
        </div>
      </div>
      
      <div className="mt-4 flex justify-end space-x-3">
        <Button
          onClick={handleCopyEmail}
          variant="outline"
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
        >
          <Copy className="h-4 w-4 mr-1" />
          Copy
        </Button>
        <Button
          onClick={handleExportSingleEmail}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary hover:bg-blue-600"
        >
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
      </div>
    </div>
  );
}
