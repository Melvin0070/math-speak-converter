import OpenAI from 'openai';
import { getOpenAIClient } from './openai';

// Interface for MCP options
export interface MCPOptions {
  maxIterations?: number;
  temperature?: number;
  verbose?: boolean;
  model?: string;
}

// Interface for validation result
export interface ValidationResult {
  valid: boolean;
  feedback?: string;
}

// Interface for MCP result
export interface MCPResult<T> {
  finalResult: T;
  iterations: number;
  reasoning: string;
  initialResult?: T;
}

/**
 * Uses the Model Context Protocol to improve accuracy of AI outputs
 * @param task Description of the task to perform
 * @param input The input data to process
 * @param processOutput Function to process the raw output from the AI
 * @param validateResult Function to validate the processed result
 * @param options Configuration options for MCP
 * @returns The final result after iterative improvement
 */
export const useMCP = async <T>(
  task: string,
  input: string,
  processOutput: (output: string) => T,
  validateResult: (result: T) => ValidationResult,
  options: MCPOptions = {}
): Promise<MCPResult<T>> => {
  const {
    maxIterations = 2,
    temperature = 0.2,
    verbose = false,
    model = 'gpt-4o'
  } = options;

  try {
    const client = getOpenAIClient();
    let iterations = 0;
    let currentReasoning = '';
    let initialResult: T | undefined;
    
    // Initial prompt
    const initialPrompt = constructMCPPrompt(task, input);
    
    // First iteration
    const initialResponse = await sendMCPRequest(client, initialPrompt, model, temperature);
    
    // Extract thinking and result from the response
    const { thinking, result: rawResult } = extractMCPComponents(initialResponse);
    currentReasoning = thinking || '';
    
    // Process the output
    let processedResult = processOutput(rawResult);
    initialResult = processedResult;
    
    if (verbose) {
      console.log('Initial MCP thinking:', thinking);
      console.log('Initial MCP result:', rawResult);
    }
    
    // Validate the result
    let validation = validateResult(processedResult);
    iterations++;
    
    // Iterative refinement if needed and if iterations remain
    while (!validation.valid && iterations < maxIterations) {
      const refinementPrompt = constructRefinementPrompt(
        task, 
        input, 
        rawResult, 
        validation.feedback || 'The result needs improvement.', 
        currentReasoning
      );
      
      const refinementResponse = await sendMCPRequest(client, refinementPrompt, model, temperature);
      
      // Extract thinking and result from the refined response
      const refinement = extractMCPComponents(refinementResponse);
      
      // Update reasoning
      if (refinement.thinking) {
        currentReasoning += '\n\nRefinement Iteration ' + iterations + ':\n' + refinement.thinking;
      }
      
      // Process the refined output
      processedResult = processOutput(refinement.result);
      
      if (verbose) {
        console.log(`Refinement iteration ${iterations} thinking:`, refinement.thinking);
        console.log(`Refinement iteration ${iterations} result:`, refinement.result);
      }
      
      // Validate the refined result
      validation = validateResult(processedResult);
      iterations++;
    }
    
    return {
      finalResult: processedResult,
      iterations,
      reasoning: currentReasoning,
      initialResult
    };
  } catch (error) {
    console.error('Error in MCP processing:', error);
    throw error;
  }
};

/**
 * Constructs an initial MCP prompt
 */
const constructMCPPrompt = (task: string, input: string): string => {
  return `You are a specialized mathematical reasoning assistant that follows the Model Context Protocol (MCP).
Your task is to ${task}.

Follow these steps:
1. Carefully analyze the input
2. Identify the key components and their relationships
3. Apply mathematical reasoning to solve the problem
4. Ensure accuracy and precision in your work
5. Double-check your solution for errors

IMPORTANT: Your response MUST follow this exact format:
<thinking>
[Detail your step-by-step reasoning process]
</thinking>

<result>
[ONLY the final result with no explanations or additional text]
</result>

Input:
${input}`;
};

/**
 * Constructs a refinement prompt for iteration
 */
const constructRefinementPrompt = (
  task: string, 
  input: string, 
  previousResult: string, 
  feedback: string, 
  previousThinking: string
): string => {
  return `You are a specialized mathematical reasoning assistant that follows the Model Context Protocol (MCP).
Your task is to ${task}.

Your previous attempt had issues. Here's the feedback:
${feedback}

Here was your previous thinking:
${previousThinking}

Your previous result was:
${previousResult}

Please refine your approach and provide a more accurate result.

IMPORTANT: Your response MUST follow this exact format:
<thinking>
[Detail your step-by-step refinement process, explaining how you're addressing the issues]
</thinking>

<result>
[ONLY the improved final result with no explanations or additional text]
</result>

Input:
${input}`;
};

/**
 * Extracts thinking and result components from MCP response
 */
const extractMCPComponents = (response: string): { thinking: string; result: string } => {
  // Extract thinking using regex
  const thinkingMatch = response.match(/<thinking>([\s\S]*?)<\/thinking>/i);
  const thinking = thinkingMatch ? thinkingMatch[1].trim() : '';
  
  // Extract result using regex
  const resultMatch = response.match(/<result>([\s\S]*?)<\/result>/i);
  const result = resultMatch ? resultMatch[1].trim() : '';
  
  // If the response doesn't match the expected format, treat the whole response as the result
  if (!thinking && !result) {
    return { thinking: '', result: response.trim() };
  }
  
  return { thinking, result };
};

/**
 * Sends a request to the OpenAI API with MCP prompt
 */
const sendMCPRequest = async (
  client: OpenAI,
  prompt: string,
  model: string,
  temperature: number
): Promise<string> => {
  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: prompt
      }
    ],
    temperature,
  });
  
  return response.choices[0]?.message?.content?.trim() || '';
};
