
'use server';
/**
 * @fileOverview A support request handling AI flow.
 *
 * - sendSupportRequest - A function that processes a user's support query.
 * - SupportRequestInput - The input type for the sendSupportRequest function.
 * - SupportRequestOutput - The return type for the sendSupportRequest function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SupportRequestInputSchema = z.object({
  subject: z.string().describe('The subject of the support request.'),
  message: z.string().describe('The detailed message from the user.'),
});
export type SupportRequestInput = z.infer<typeof SupportRequestInputSchema>;

const SupportRequestOutputSchema = z.object({
  ticketId: z.string().describe('A unique ticket ID generated for the request.'),
  category: z.enum(['Technical', 'Billing', 'General Inquiry', 'Wallet Issue', 'Transaction']).describe('The category of the support request as determined by the AI.'),
  summary: z.string().describe('A brief summary of the user\'s issue.'),
  status: z.string().describe('The initial status of the ticket, which should be "Open".'),
});
export type SupportRequestOutput = z.infer<typeof SupportRequestOutputSchema>;

export async function sendSupportRequest(input: SupportRequestInput): Promise<SupportRequestOutput> {
  return supportRequestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'supportRequestPrompt',
  input: { schema: SupportRequestInputSchema },
  output: { schema: SupportRequestOutputSchema },
  prompt: `You are a support ticket processing agent. A user has submitted a support request. 
  Your task is to analyze the request, categorize it, generate a unique ticket ID, and provide a summary.

  User Request:
  Subject: {{{subject}}}
  Message: {{{message}}}

  Instructions:
  1. Generate a unique ticket ID in the format: UMU- followed by 8 random alphanumeric characters.
  2. Analyze the subject and message to determine the most appropriate category from the available options.
  3. Write a concise, one-sentence summary of the user's issue.
  4. Set the initial status to "Open".
  5. Format the output according to the specified JSON schema.`,
});

const supportRequestFlow = ai.defineFlow(
  {
    name: 'supportRequestFlow',
    inputSchema: SupportRequestInputSchema,
    outputSchema: SupportRequestOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    
    // In a real application, you would save the ticket to a database here.
    // For this prototype, we'll just log it to the console.
    console.log('New Support Ticket Created:', output);
    
    if (!output) {
      throw new Error("Failed to process support request.");
    }
    
    return output;
  }
);
