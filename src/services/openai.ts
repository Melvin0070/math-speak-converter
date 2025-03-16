
import OpenAI from 'openai';
import { toast } from '@/components/ui/use-toast';

// Type for OpenAI configuration
export interface OpenAIConfig {
  apiKey: string;
}

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

// Function to initialize the OpenAI client
export const initializeOpenAI = (config: OpenAIConfig): OpenAI => {
  try {
    openaiClient = new OpenAI({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true, // Note: In production, API requests should go through a backend
    });
    return openaiClient;
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    toast({
      title: 'Error',
      description: 'Failed to initialize OpenAI. Please check your API key.',
      variant: 'destructive',
    });
    throw error;
  }
};

// Function to get the OpenAI client (initializing if needed)
export const getOpenAIClient = (): OpenAI => {
  if (!openaiClient) {
    throw new Error('OpenAI client is not initialized. Call initializeOpenAI first.');
  }
  return openaiClient;
};

// Transcribe audio using Whisper
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const client = getOpenAIClient();
    
    // Create a form with the audio data
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    
    // Make the API request
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${client.apiKey}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    toast({
      title: 'Transcription Error',
      description: 'Failed to transcribe audio. Please try again.',
      variant: 'destructive',
    });
    throw error;
  }
};

// Convert natural language to LaTeX using GPT-4o
export const textToLatex = async (text: string): Promise<string> => {
  try {
    const client = getOpenAIClient();
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a specialized mathematical notation converter. Convert natural language mathematical expressions to LaTeX. Return ONLY the LaTeX code with no explanation or additional text. Do not include backticks or code blocks in your response.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.1,
    });
    
    const latexResult = response.choices[0]?.message?.content?.trim() || '';
    return latexResult;
  } catch (error) {
    console.error('Error converting text to LaTeX:', error);
    toast({
      title: 'Conversion Error',
      description: 'Failed to convert text to LaTeX. Please try again.',
      variant: 'destructive',
    });
    throw error;
  }
};

// Convert LaTeX to natural language using GPT-4o
export const latexToText = async (latex: string): Promise<string> => {
  try {
    const client = getOpenAIClient();
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a specialized LaTeX interpreter. Convert LaTeX mathematical expressions to clear, spoken natural language that sounds natural when read aloud. Focus on clarity and readability.'
        },
        {
          role: 'user',
          content: latex
        }
      ],
      temperature: 0.3,
    });
    
    const textResult = response.choices[0]?.message?.content?.trim() || '';
    return textResult;
  } catch (error) {
    console.error('Error converting LaTeX to text:', error);
    toast({
      title: 'Conversion Error',
      description: 'Failed to convert LaTeX to text. Please try again.',
      variant: 'destructive',
    });
    throw error;
  }
};

// Generate speech from text using TTS
export const textToSpeech = async (text: string): Promise<ArrayBuffer> => {
  try {
    const client = getOpenAIClient();
    
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${client.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'nova',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    return await response.arrayBuffer();
  } catch (error) {
    console.error('Error generating speech:', error);
    toast({
      title: 'Speech Generation Error',
      description: 'Failed to generate speech. Please try again.',
      variant: 'destructive',
    });
    throw error;
  }
};
