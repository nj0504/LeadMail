import { Lead, SenderDetails, GeneratedEmail } from "@shared/schema";
import { apiRequest } from "./queryClient";

// Function to upload a CSV file
export async function uploadCsv(file: File): Promise<{ csv: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload-csv', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

// Function to generate emails
export async function generateEmails(
  senderDetails: SenderDetails,
  leads: Lead[]
): Promise<{ emails: GeneratedEmail[] }> {
  const res = await apiRequest('POST', '/api/generate-emails', {
    senderDetails,
    leads,
  });
  return res.json();
}

// Function to get all generated emails
export async function getEmails(): Promise<{ emails: GeneratedEmail[] }> {
  const res = await apiRequest('GET', '/api/emails');
  return res.json();
}

// Function to update an email
export async function updateEmail(
  id: number,
  update: Partial<GeneratedEmail>
): Promise<{ email: GeneratedEmail }> {
  const res = await apiRequest('PATCH', `/api/emails/${id}`, update);
  return res.json();
}

// Function to regenerate email content (subject or body)
export async function regenerateEmailContent(
  id: number,
  part: 'subject' | 'body',
  senderDetails: SenderDetails
): Promise<{ email: GeneratedEmail; regeneratedContent: string }> {
  const res = await apiRequest('POST', `/api/emails/${id}/regenerate`, {
    part,
    senderDetails,
  });
  return res.json();
}

// Function to create a downloadable CSV from generated emails
export function createEmailsCSV(emails: GeneratedEmail[]): string {
  const headers = ['Recipient Name', 'Recipient Company', 'Subject', 'Body'];
  const rows = emails.map(email => [
    email.recipientName,
    email.recipientCompany,
    email.subject,
    email.body
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => 
        `"${(cell || '').replace(/"/g, '""')}"`
      ).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

// Function to export emails as a CSV file
export function exportEmailsAsCSV(emails: GeneratedEmail[], filename: string = 'generated-emails.csv'): void {
  const csvContent = createEmailsCSV(emails);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Function to create a sample CSV for users to download
export function createSampleCSV(): string {
  const headers = ['Name', 'Company Name', 'Product Description'];
  const rows = [
    ['Jane Smith', 'XYZ Corp', 'Software Development'],
    ['Michael Johnson', 'ABC Inc', 'Digital Marketing'],
    ['Sarah Williams', 'Acme Co', 'Cloud Solutions']
  ];
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => 
        `"${cell.replace(/"/g, '""')}"`
      ).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

// Function to download the sample CSV
export function downloadSampleCSV(filename: string = 'sample-leads.csv'): void {
  const csvContent = createSampleCSV();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
