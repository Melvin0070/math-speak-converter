import { transcribeAudio, textToSpeech, imageToLatex as openAIImageToLatex } from './openai';
import { 
  naturalLanguageToLatexMCP, 
  latexToNaturalLanguageMCP, 
  validateLatexMCP,
  imageToLatexMCP,
  solveEquationWithStepsMCP,
  explainMathExpressionMCP
} from './math-mcp';
import { useMCP } from './mcp';

export interface ConversionResult {
  text: string;
  latex: string;
  audioUrl?: string;
  reasoning?: string;  // Field to store MCP reasoning
}

// Enhanced textToLatex using MCP for better reasoning
export const textToLatex = async (text: string): Promise<string> => {
  try {
    return await naturalLanguageToLatexMCP(text);
  } catch (error) {
    console.error('Error in MCP text to LaTeX conversion:', error);
    throw error;
  }
};

// Enhanced latexToText using MCP for more accurate natural language
export const latexToText = async (latex: string): Promise<string> => {
  try {
    return await latexToNaturalLanguageMCP(latex);
  } catch (error) {
    console.error('Error in MCP LaTeX to text conversion:', error);
    throw error;
  }
};

// Convert speech to LaTeX using MCP
export const speechToLatex = async (audioBlob: Blob): Promise<ConversionResult> => {
  try {
    // Step 1: Transcribe the audio (no MCP here since Whisper is already optimized)
    const transcribedText = await transcribeAudio(audioBlob);
    
    // Step 2: Convert transcribed text to LaTeX with MCP
    const mcpResult = await useMCP<string>(
      'convert natural language mathematical expressions to LaTeX, particularly focusing on spoken math that may contain ambiguities',
      transcribedText,
      (output) => output.trim(),
      validateLatexMCP,
      { maxIterations: 3, temperature: 0.2, verbose: true }
    );
    
    return {
      text: transcribedText,
      latex: mcpResult.finalResult,
      reasoning: mcpResult.reasoning
    };
  } catch (error) {
    console.error('Error in MCP speech to LaTeX conversion:', error);
    throw error;
  }
};

// Enhanced imageToLatex using more advanced MCP approach
export const imageToLatex = async (imageFile: File): Promise<string> => {
  try {
    // Convert File to base64 for our MCP function
    const base64Image = await readFileAsBase64(imageFile);
    
    // Use the enhanced imageToLatexMCP function
    return await imageToLatexMCP(base64Image);
  } catch (error) {
    console.error('Error in MCP image to LaTeX conversion:', error);
    throw error;
  }
};

// Helper function to convert File to base64 string
const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// Convert image to LaTeX with speech using MCP
export const imageToSpeech = async (imageFile: File): Promise<ConversionResult> => {
  try {
    // Step 1: Convert image to LaTeX 
    const latex = await imageToLatex(imageFile);
    
    // Step 2: Convert LaTeX to natural language text using MCP
    const mcpTextResult = await useMCP<string>(
      'convert LaTeX mathematical expressions to clear, spoken natural language suitable for text-to-speech',
      latex,
      (output) => output.trim(),
      (text) => ({ 
        valid: text.length > 0 && !text.includes('\\') && !text.includes('$'),
        feedback: 'Ensure all LaTeX commands are properly converted to natural language.'
      }),
      { maxIterations: 2, temperature: 0.3, verbose: true }
    );
    
    const text = mcpTextResult.finalResult;
    
    // Step 3: Convert text to speech
    const audioBuffer = await textToSpeech(text);
    
    // Step 4: Create a URL for the audio
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    return {
      text,
      latex,
      audioUrl,
      reasoning: mcpTextResult.reasoning
    };
  } catch (error) {
    console.error('Error in MCP image to speech conversion:', error);
    throw error;
  }
};

// Convert LaTeX to speech using MCP
export const latexToSpeech = async (latex: string): Promise<ConversionResult> => {
  try {
    // Step 1: Convert LaTeX to natural language text with MCP
    const mcpResult = await useMCP<string>(
      'convert LaTeX mathematical expressions to clear, spoken natural language suitable for text-to-speech',
      latex,
      (output) => output.trim(),
      (text) => ({ 
        valid: text.length > 0 && !text.includes('\\') && !text.includes('$'),
        feedback: 'Ensure all LaTeX commands are properly converted to natural language.'
      }),
      { maxIterations: 3, temperature: 0.3, verbose: true }
    );
    
    const text = mcpResult.finalResult;
    
    // Step 2: Convert text to speech
    const audioBuffer = await textToSpeech(text);
    
    // Step 3: Create a URL for the audio
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    return {
      text,
      latex,
      audioUrl,
      reasoning: mcpResult.reasoning
    };
  } catch (error) {
    console.error('Error in MCP LaTeX to speech conversion:', error);
    throw error;
  }
};

/**
 * Advanced service to solve equations with step-by-step work
 */
export const solveEquationWithSteps = async (equation: string): Promise<{latex: string, steps: string[], audioUrl?: string}> => {
  try {
    // Use the specialized equation solving MCP
    const { latex, steps } = await solveEquationWithStepsMCP(equation);
    
    // Convert the solution explanation to speech
    const stepsText = steps.join(". ");
    const audioBuffer = await textToSpeech(stepsText);
    
    // Create audio URL
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    return {
      latex,
      steps,
      audioUrl
    };
  } catch (error) {
    console.error('Error in equation solving:', error);
    throw error;
  }
};

/**
 * Service to explain mathematical concepts with educational context
 */
export const explainMathExpression = async (
  expression: string, 
  level: 'elementary' | 'high-school' | 'undergraduate' | 'graduate' = 'high-school'
): Promise<{explanation: string, concepts: string[], audioUrl?: string}> => {
  try {
    // Use the specialized math explanation MCP
    const { explanation, concepts } = await explainMathExpressionMCP(expression, level);
    
    // Convert the explanation to speech
    const audioBuffer = await textToSpeech(explanation);
    
    // Create audio URL
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
    return {
      explanation,
      concepts,
      audioUrl
    };
  } catch (error) {
    console.error('Error in math explanation:', error);
    throw error;
  }
};
