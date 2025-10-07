'use server';
/**
 * @fileOverview A conversational AI support chat flow.
 *
 * - chatWithSupport - A function that handles a single turn in a support chat conversation.
 * - ChatWithSupportInput - The input type for the chatWithSupport function.
 * - ChatWithSupportOutput - The return type for the chatWithSupport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define a schema for a single message in the chat history
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatWithSupportInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe('The conversation history so far.'),
  message: z.string().describe('The latest message from the user.'),
});
export type ChatWithSupportInput = z.infer<typeof ChatWithSupportInputSchema>;

const ChatWithSupportOutputSchema = z.object({
  response: z.string().describe("The AI's response to the user's message."),
});
export type ChatWithSupportOutput = z.infer<typeof ChatWithSupportOutputSchema>;

export async function chatWithSupport(input: ChatWithSupportInput): Promise<ChatWithSupportOutput> {
  return supportChatFlow(input);
}

// Define the prompt for the conversational AI
const supportChatPrompt = `You are a friendly and knowledgeable AI support agent for Umuhora Tech Wallet, a non-custodial Bitcoin wallet. Your goal is to help users with their questions about the wallet.

Key features of Umuhora Tech Wallet:
- Non-custodial: Users have full control of their keys and funds.
- Supports both On-Chain Bitcoin and Lightning Network transactions.
- Allows users to create new wallets or restore existing ones with a 12 or 24-word recovery phrase.
- Users can buy and sell Bitcoin through integrated providers.
- It has features like sending, receiving, transaction history, and security settings (like backing up the private key).

Your tone should be helpful, empathetic, and clear. Use the conversation history to understand the context.

IMPORTANT: You must never ask for or handle sensitive user information like passwords, recovery phrases, or private keys. If a user mentions these, politely remind them never to share this information with anyone, including you.

Conversation History:
{{#each history}}
- {{role}}: {{content}}
{{/each}}

New User Message:
- user: {{{message}}}

Your response should be formatted as plain text, not JSON.`;

const supportChatFlow = ai.defineFlow(
  {
    name: 'supportChatFlow',
    inputSchema: ChatWithSupportInputSchema,
    outputSchema: ChatWithSupportOutputSchema,
  },
  async (input) => {
    const { history, message } = input;

    const { text } = await ai.generate({
      prompt: supportChatPrompt,
      history: history.map(msg => ({ role: msg.role, content: msg.content })),
      input: { message },
    });

    return { response: text };
  }
);
