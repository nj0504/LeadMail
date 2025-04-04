import { SenderDetails, Lead, GeneratedEmail } from "@shared/schema";

export enum AppStep {
  SenderDetails = 1,
  UploadLeads = 2,
  ReviewExport = 3
}

export interface CsvData {
  headers: string[];
  rows: string[][];
}

export interface EmailFilter {
  type: 'all' | 'reviewed' | 'edited';
}

export interface ProcessStatus {
  processed: number;
  total: number;
  inProgress: boolean;
}

export interface FileUploadState {
  file: File | null;
  parsedData: Lead[] | null;
  previewData: string[][] | null;
  headers: string[] | null;
  error: string | null;
}
