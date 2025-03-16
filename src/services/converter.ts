
import { transcribeAudio, textToLatex, latexToText, textToSpeech } from './openai';

export interface ConversionResult {
  text: string;
  latex: string;
  audioUrl?: string;
}

// Convert speech to LaTeX
export const speechToLatex = async (audioBlob: Blob): Promise<ConversionResult> => {
  try {
    // Step 1: Transcribe the audio
    const transcribedText = await transcribeAudio(audioBlob);
    
    // Step 2: Convert transcribed text to LaTeX
    const latex = await textToLatex(transcribedText);
    
    return {
      text: transcribedText,
      latex,
    };
  } catch (error) {
    console.error('Error in speech to LaTeX conversion:', error);
    throw error;
  }
};

// Convert LaTeX to speech
export const latexToSpeech = async (latex: string): Promise<ConversionResult> => {
  try {
    // Step 1: Convert LaTeX to natural language text
    const text = await latexToText(latex);
    
    // Step 2: Convert text to speech
    const audioBuffer = await textToSpeech(text);
    
    // Step 3: Create a URL for the audio
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    return {
      text,
      latex,
      audioUrl,
    };
  } catch (error) {
    console.error('Error in LaTeX to speech conversion:', error);
    throw error;
  }
};
