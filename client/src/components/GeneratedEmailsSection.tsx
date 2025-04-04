import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import EmailCard from "./EmailCard";
import { EmailFilter } from "@/lib/types";
import { SenderDetails, GeneratedEmail } from "@shared/schema";
import { exportEmailsAsCSV, updateEmail } from "@/lib/apiClient";
import { Download } from "lucide-react";

interface GeneratedEmailsSectionProps {
  emails: GeneratedEmail[];
  senderDetails: SenderDetails;
  setEmails: React.Dispatch<React.SetStateAction<GeneratedEmail[]>>;
}

export default function GeneratedEmailsSection({
  emails,
  senderDetails,
  setEmails
}: GeneratedEmailsSectionProps) {
  const [activeTab, setActiveTab] = useState<EmailFilter['type']>('all');
  const [filteredEmails, setFilteredEmails] = useState<GeneratedEmail[]>(emails);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const { toast } = useToast();

  useEffect(() => {
    // Filter emails based on active tab
    if (activeTab === 'all') {
      setFilteredEmails(emails);
    } else if (activeTab === 'reviewed') {
      setFilteredEmails(emails.filter(email => email.isReviewed));
    } else if (activeTab === 'edited') {
      setFilteredEmails(emails.filter(email => email.isEdited));
    }
    // Reset to first page when filter changes
    setCurrentPage(1);
  }, [activeTab, emails]);

  const handleTabChange = (tab: EmailFilter['type']) => {
    setActiveTab(tab);
  };

  const handleExportEmails = () => {
    try {
      exportEmailsAsCSV(emails);
      toast({
        title: "Emails exported successfully",
        description: `${emails.length} emails exported as CSV.`,
      });
    } catch (error) {
      console.error("Error exporting emails:", error);
      toast({
        title: "Export failed",
        description: "Failed to export emails. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEmailUpdate = async (updatedEmail: GeneratedEmail) => {
    try {
      // Update the email in storage
      await updateEmail(updatedEmail.id!, updatedEmail);
      
      // Update the local state
      setEmails(prevEmails => 
        prevEmails.map(email => 
          email.id === updatedEmail.id ? updatedEmail : email
        )
      );
    } catch (error) {
      console.error("Error updating email:", error);
      toast({
        title: "Update failed",
        description: "Failed to update the email. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredEmails.length / itemsPerPage);
  const paginatedEmails = filteredEmails.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="mt-10">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Generated Emails</h3>
            <Button
              onClick={handleExportEmails}
              className="inline-flex items-center px-4 py-2 bg-primary hover:bg-blue-600"
            >
              <Download className="h-5 w-5 mr-2" />
              Export All Emails
            </Button>
          </div>
          
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={(value) => handleTabChange(value as EmailFilter['type'])}
            className="mt-6"
          >
            <div className="border-b border-gray-200">
              <TabsList className="flex h-auto space-x-8 bg-transparent">
                <TabsTrigger 
                  value="all" 
                  className="border-primary data-[state=active]:border-b-2 data-[state=active]:text-primary hover:text-blue-700 whitespace-nowrap py-4 px-1 border-b-2 data-[state=inactive]:border-transparent text-sm font-medium data-[state=inactive]:text-gray-500 focus:outline-none"
                >
                  All Emails
                  <span className="ml-2 py-0.5 px-2.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {emails.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger 
                  value="reviewed" 
                  className="border-primary data-[state=active]:border-b-2 data-[state=active]:text-primary hover:text-blue-700 whitespace-nowrap py-4 px-1 border-b-2 data-[state=inactive]:border-transparent text-sm font-medium data-[state=inactive]:text-gray-500 focus:outline-none"
                >
                  Reviewed
                  <span className="ml-2 py-0.5 px-2.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                    {emails.filter(e => e.isReviewed).length}
                  </span>
                </TabsTrigger>
                <TabsTrigger 
                  value="edited" 
                  className="border-primary data-[state=active]:border-b-2 data-[state=active]:text-primary hover:text-blue-700 whitespace-nowrap py-4 px-1 border-b-2 data-[state=inactive]:border-transparent text-sm font-medium data-[state=inactive]:text-gray-500 focus:outline-none"
                >
                  Edited
                  <span className="ml-2 py-0.5 px-2.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                    {emails.filter(e => e.isEdited).length}
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="mt-6 space-y-6">
              {paginatedEmails.length > 0 ? (
                paginatedEmails.map((email) => (
                  <EmailCard 
                    key={email.id} 
                    email={email} 
                    senderDetails={senderDetails}
                    onUpdate={handleEmailUpdate}
                  />
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No emails found.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="reviewed" className="mt-6 space-y-6">
              {paginatedEmails.length > 0 ? (
                paginatedEmails.map((email) => (
                  <EmailCard 
                    key={email.id} 
                    email={email} 
                    senderDetails={senderDetails}
                    onUpdate={handleEmailUpdate}
                  />
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No reviewed emails found.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="edited" className="mt-6 space-y-6">
              {paginatedEmails.length > 0 ? (
                paginatedEmails.map((email) => (
                  <EmailCard 
                    key={email.id} 
                    email={email} 
                    senderDetails={senderDetails}
                    onUpdate={handleEmailUpdate}
                  />
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No edited emails found.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredEmails.length)}
                    </span>{" "}
                    of <span className="font-medium">{filteredEmails.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </Button>
                    
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <Button
                        key={index}
                        onClick={() => setCurrentPage(index + 1)}
                        variant={currentPage === index + 1 ? "default" : "outline"}
                        className={`relative inline-flex items-center px-4 py-2 border ${
                          currentPage === index + 1
                            ? "bg-primary border-primary text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        } text-sm font-medium`}
                      >
                        {index + 1}
                      </Button>
                    ))}
                    
                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
