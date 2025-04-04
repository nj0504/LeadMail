import type { Express, Request, Response } from "express";
import type { FileFilterCallback } from "multer";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { 
  senderDetailsSchema, 
  leadSchema, 
  generateEmailsRequestSchema,
  generatedEmailSchema,
  insertGeneratedEmailSchema,
  type GeneratedEmail
} from "@shared/schema";
import { ZodError } from "zod";
import axios from "axios";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // API route to handle CSV file uploads
  app.post('/api/upload-csv', upload.single('file'), (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      // Convert buffer to string and return
      const csvString = req.file.buffer.toString('utf-8');
      return res.status(200).json({ csv: csvString });
    } catch (error) {
      console.error('Error processing CSV:', error);
      return res.status(500).json({ message: 'Error processing the CSV file' });
    }
  });

  // API route to generate emails
  app.post('/api/generate-emails', async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const validatedData = generateEmailsRequestSchema.parse(req.body);
      const { senderDetails, leads } = validatedData;

      // OpenRouter API configuration
      const openRouterApiKey = process.env.OPENROUTER_API_KEY || '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';
      const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
      
      // Process each lead and generate an email
      const generatedEmails: GeneratedEmail[] = [];
      
      for (const lead of leads) {
        try {
          // Prepare the prompt for OpenRouter
          const prompt = `
          Generate a deeply personalized cold email from ${senderDetails.name} at ${senderDetails.company} 
          to ${lead.name} at ${lead.company}.
          
          About the sender's product/service: ${senderDetails.productDescription}
          
          About the recipient's focus: ${lead.product || "Not specified"}
          
          The email should be in a ${senderDetails.emailTone} tone.
          
          Instructions for hyperpersonalization:
          1. Use specific details about ${lead.company} and their product focus area.
          2. Find a unique angle or connection between the sender's offering and recipient's business.
          3. Reference relevant industry trends, challenges, or opportunities specific to ${lead.company}'s market.
          4. Make a highly tailored value proposition that directly addresses the recipient's likely needs.
          5. Each email should be substantially different from other emails in style, structure, and approach.
          
          Return only a JSON object with two fields:
          1. "subject": A compelling, personalized subject line that stands out
          2. "body": The email body text that feels like it was written specifically for this recipient
          
          The email body should be concise (3-4 paragraphs max), extremely personalized, and clearly show how 
          the sender's offering directly solves specific problems for the recipient's company.
          `;

          // Call OpenRouter API
          const response = await axios.post(openRouterUrl, {
            model: 'qwen/qwen2.5-vl-32b-instruct:free',
            messages: [
              { role: 'user', content: prompt }
            ],
            temperature: 0.85,
            max_tokens: 1000
          }, {
            headers: {
              'Authorization': `Bearer ${openRouterApiKey}`,
              'Content-Type': 'application/json'
            }
          });

          // Parse response to extract generated email content
          let emailContent = {
            subject: '',
            body: ''
          };

          try {
            const content = response.data.choices[0].message.content;
            // Extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              emailContent = JSON.parse(jsonMatch[0]);
            } else {
              // If no JSON is found, try to extract subject and body from text
              const lines = content.split('\n');
              const subjectLine = lines.find((line: string) => line.toLowerCase().includes('subject:'));
              if (subjectLine) {
                emailContent.subject = subjectLine.replace(/subject:/i, '').trim();
              }
              
              const bodyStart = lines.findIndex((line: string) => line.toLowerCase().includes('body:'));
              if (bodyStart !== -1) {
                emailContent.body = lines.slice(bodyStart + 1).join('\n').trim();
              }
            }
          } catch (error) {
            console.error('Error parsing AI response:', error);
            // Use more personalized fallback content if parsing fails
            emailContent = {
              subject: `${lead.product ? `Enhancing ${lead.product} at` : `Innovative solutions for`} ${lead.company} with ${senderDetails.company}`,
              body: `Dear ${lead.name},\n\nI've been following the impressive developments at ${lead.company}${lead.product ? ` in the ${lead.product} space` : ''} and noticed an opportunity where our specialized ${senderDetails.productDescription} could provide significant value.\n\nOur approach has helped similar organizations achieve substantial improvements in efficiency and outcomes. I'd love to discuss how we might tailor our solution to address your specific challenges at ${lead.company}.\n\nWould you be open to a brief conversation next week to explore this further?\n\nBest regards,\n${senderDetails.name}\n${senderDetails.company}`
            };
          }

          // Create the email in storage
          const newEmail = await storage.createGeneratedEmail({
            recipientName: lead.name,
            recipientCompany: lead.company,
            recipientProduct: lead.product,
            subject: emailContent.subject,
            body: emailContent.body,
            isReviewed: false,
            isEdited: false,
            createdAt: new Date()
          });
          
          generatedEmails.push(newEmail);
        } catch (error) {
          console.error(`Error generating email for ${lead.name}:`, error);
          // Continue with next lead if one fails
        }
      }

      return res.status(200).json({ emails: generatedEmails });
    } catch (error) {
      console.error('Error generating emails:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      return res.status(500).json({ message: 'Error generating emails' });
    }
  });

  // API route to get all generated emails
  app.get('/api/emails', async (req: Request, res: Response) => {
    try {
      const emails = await storage.getGeneratedEmails();
      return res.status(200).json({ emails });
    } catch (error) {
      console.error('Error fetching emails:', error);
      return res.status(500).json({ message: 'Error fetching emails' });
    }
  });

  // API route to update an email
  app.patch('/api/emails/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid email ID' });
      }

      // Validate the update data
      const updateData = z.object({
        subject: z.string().optional(),
        body: z.string().optional(),
        isReviewed: z.boolean().optional(),
        isEdited: z.boolean().optional()
      }).parse(req.body);

      const updatedEmail = await storage.updateGeneratedEmail(id, updateData);
      if (!updatedEmail) {
        return res.status(404).json({ message: 'Email not found' });
      }

      return res.status(200).json({ email: updatedEmail });
    } catch (error) {
      console.error('Error updating email:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid update data', errors: error.errors });
      }
      return res.status(500).json({ message: 'Error updating email' });
    }
  });

  // API route to regenerate an email subject or body
  app.post('/api/emails/:id/regenerate', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid email ID' });
      }

      // Validate the regeneration request
      const regenerateData = z.object({
        part: z.enum(['subject', 'body']),
        senderDetails: senderDetailsSchema
      }).parse(req.body);

      // Get the existing email
      const existingEmail = await storage.getGeneratedEmailById(id);
      if (!existingEmail) {
        return res.status(404).json({ message: 'Email not found' });
      }

      // OpenRouter API configuration
      const openRouterApiKey = process.env.OPENROUTER_API_KEY || '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';
      const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
      
      // Prepare the prompt based on the part to regenerate
      let prompt = '';
      if (regenerateData.part === 'subject') {
        prompt = `
        Generate a deeply personalized, unique email subject line for a cold email from ${regenerateData.senderDetails.name} at ${regenerateData.senderDetails.company} 
        to ${existingEmail.recipientName} at ${existingEmail.recipientCompany}.
        
        About the sender's product/service: ${regenerateData.senderDetails.productDescription}
        About the recipient's focus: ${existingEmail.recipientProduct || "Not specified"}
        
        The tone should be ${regenerateData.senderDetails.emailTone}.
        
        Instructions for hyperpersonalization:
        1. Use specific details about ${existingEmail.recipientCompany} and their product focus area.
        2. Find a unique angle or connection between the sender's offering and recipient's business.
        3. Make it attention-grabbing but professional and relevant to ${existingEmail.recipientCompany}'s needs.
        4. Avoid generic phrases like "Regarding our services" or "Partnership opportunity"
        5. Create a subject line that feels written specifically for ${existingEmail.recipientName}.
        
        Return only the subject line text, nothing else.
        `;
      } else {
        prompt = `
        Generate the body of a deeply personalized cold email from ${regenerateData.senderDetails.name} at ${regenerateData.senderDetails.company} 
        to ${existingEmail.recipientName} at ${existingEmail.recipientCompany}.
        
        About the sender's product/service: ${regenerateData.senderDetails.productDescription}
        About the recipient's focus: ${existingEmail.recipientProduct || "Not specified"}
        
        The email should be in a ${regenerateData.senderDetails.emailTone} tone.
        
        The subject line is: ${existingEmail.subject}
        
        Instructions for hyperpersonalization:
        1. Use specific details about ${existingEmail.recipientCompany} and their product focus area.
        2. Find a unique angle or connection between the sender's offering and recipient's business.
        3. Reference relevant industry trends, challenges, or opportunities specific to ${existingEmail.recipientCompany}'s market.
        4. Make a highly tailored value proposition that directly addresses the recipient's likely needs.
        5. The email should feel completely unique and written specifically for this recipient.
        
        The email body should be concise (3-4 paragraphs max), extremely personalized, and clearly show how 
        the sender's offering directly solves specific problems for the recipient's company.
        
        Return only the email body text, nothing else.
        `;
      }

      // Call OpenRouter API
      const response = await axios.post(openRouterUrl, {
        model: 'qwen/qwen2.5-vl-32b-instruct:free',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.85,
        max_tokens: regenerateData.part === 'subject' ? 100 : 1000
      }, {
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      // Parse response
      let newContent = '';
      try {
        newContent = response.data.choices[0].message.content.trim();
      } catch (error) {
        console.error('Error parsing AI response:', error);
        return res.status(500).json({ message: 'Error regenerating content' });
      }

      // Update the email with the new content
      const updateData = regenerateData.part === 'subject' 
        ? { subject: newContent, isEdited: true } 
        : { body: newContent, isEdited: true };
      
      const updatedEmail = await storage.updateGeneratedEmail(id, updateData);
      
      return res.status(200).json({ 
        email: updatedEmail,
        regeneratedContent: newContent
      });
    } catch (error) {
      console.error('Error regenerating email content:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
      }
      return res.status(500).json({ message: 'Error regenerating email content' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
