import OpenAI from 'openai';
import { getOpenAIClient } from './openai';

// Interface for MCP options
export interface MCPOptions {
  maxIterations?: number;
  temperature?: number;
  verbose?: boolean;
  model?: string;
  fallbackModel?: string; // Added fallback model option
  timeout?: number; // Added timeout option
  useCache?: boolean; // Added caching option
  confidenceThreshold?: number; // Added confidence threshold option
}

// Interface for validation result
export interface ValidationResult {
  valid: boolean;
  feedback?: string;
  confidence?: number; // Added confidence score
}

// Interface for MCP result
export interface MCPResult<T> {
  finalResult: T;
  iterations: number;
  reasoning: string;
  initialResult?: T;
  confidence?: number; // Added confidence score
  model: string; // Track which model was used
  processingTimeMs: number; // Track processing time
}

// Simple in-memory cache for MCP results
interface CacheEntry<T> {
  result: MCPResult<T>;
  timestamp: number;
  task: string;
}

const mcpCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 3600000; // 1 hour cache lifetime

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
    model = 'gpt-4o',
    fallbackModel = 'gpt-3.5-turbo',
    timeout = 30000,
    useCache = true,
    confidenceThreshold = 0.8
  } = options;

  // Check cache if enabled
  const cacheKey = `${task}_${input}_${model}_${temperature}`;
  if (useCache && mcpCache.has(cacheKey)) {
    const cacheEntry = mcpCache.get(cacheKey)!;
    // Return cached result if valid and not expired
    if (Date.now() - cacheEntry.timestamp < CACHE_TTL_MS && cacheEntry.task === task) {
      if (verbose) console.log('Using cached MCP result');
      return cacheEntry.result;
    } else {
      mcpCache.delete(cacheKey); // Clear expired cache entry
    }
  }

  const startTime = Date.now();
  try {
    const client = getOpenAIClient();
    let iterations = 0;
    let currentReasoning = '';
    let initialResult: T | undefined;
    let usedModel = model;
    let confidence = 0;
    
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('MCP processing timeout')), timeout);
    });
    
    // Main MCP processing logic
    const processingPromise = (async () => {
      // Initial prompt
      const initialPrompt = constructMCPPrompt(task, input);
      
      try {
        // First iteration
        const initialResponse = await sendMCPRequest(client, initialPrompt, usedModel, temperature);
        
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
        
        // Store confidence from validation
        confidence = validation.confidence || 0.5;
        
        // Iterative refinement if needed and if iterations remain
        while ((!validation.valid || confidence < confidenceThreshold) && iterations < maxIterations) {
          const refinementPrompt = constructRefinementPrompt(
            task, 
            input, 
            rawResult, 
            validation.feedback || 'The result needs improvement.', 
            currentReasoning,
            confidence
          );
          
          const refinementResponse = await sendMCPRequest(client, refinementPrompt, usedModel, temperature);
          
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
          confidence = validation.confidence || confidence;
          iterations++;
        }
        
        const mcpResult: MCPResult<T> = {
          finalResult: processedResult,
          iterations,
          reasoning: currentReasoning,
          initialResult,
          confidence,
          model: usedModel,
          processingTimeMs: Date.now() - startTime
        };
        
        // Store in cache if caching is enabled
        if (useCache) {
          mcpCache.set(cacheKey, {
            result: mcpResult,
            timestamp: Date.now(),
            task
          });
        }
        
        return mcpResult;
        
      } catch (error) {
        // Try fallback model if available and error occurs with primary model
        if (usedModel !== fallbackModel && fallbackModel) {
          console.warn(`Error with ${usedModel}, falling back to ${fallbackModel}`);
          usedModel = fallbackModel;
          
          const fallbackResponse = await sendMCPRequest(client, constructMCPPrompt(task, input), usedModel, temperature);
          const { thinking, result: rawResult } = extractMCPComponents(fallbackResponse);
          
          currentReasoning = `[FALLBACK MODEL] ${thinking || ''}`;
          const processedResult = processOutput(rawResult);
          
          return {
            finalResult: processedResult,
            iterations: 1,
            reasoning: currentReasoning,
            confidence: 0.5, // Lower confidence for fallback
            model: usedModel,
            processingTimeMs: Date.now() - startTime
          };
        }
        throw error;
      }
    })();
    
    // Race the processing against timeout
    return await Promise.race([processingPromise, timeoutPromise]);
    
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
6. Assign a confidence score (0.0-1.0) to your solution

IMPORTANT: Your response MUST follow this exact format:
<thinking>
[Detail your step-by-step reasoning process]
</thinking>

<confidence>
[A number between 0.0 and 1.0 indicating your confidence in this result]
</confidence>

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
  previousThinking: string,
  confidence: number = 0
): string => {
  return `You are a specialized mathematical reasoning assistant that follows the Model Context Protocol (MCP).
Your task is to ${task}.

Your previous attempt had issues. Here's the feedback:
${feedback}

Current confidence score: ${confidence.toFixed(2)}

Here was your previous thinking:
${previousThinking}

Your previous result was:
${previousResult}

Please refine your approach and provide a more accurate result.

IMPORTANT: Your response MUST follow this exact format:
<thinking>
[Detail your step-by-step refinement process, explaining how you're addressing the issues]
</thinking>

<confidence>
[A number between 0.0 and 1.0 indicating your confidence in this refined result]
</confidence>

<result>
[ONLY the improved final result with no explanations or additional text]
</result>

Input:
${input}`;
};

/**
 * Extracts thinking and result components from MCP response
 */
const extractMCPComponents = (response: string): { thinking: string; result: string; confidence: number } => {
  // Extract thinking using regex
  const thinkingMatch = response.match(/<thinking>([\s\S]*?)<\/thinking>/i);
  const thinking = thinkingMatch ? thinkingMatch[1].trim() : '';
  
  // Extract confidence using regex
  const confidenceMatch = response.match(/<confidence>([\s\S]*?)<\/confidence>/i);
  let confidence = 0.5; // Default confidence
  if (confidenceMatch) {
    const confidenceStr = confidenceMatch[1].trim();
    const parsedConfidence = parseFloat(confidenceStr);
    if (!isNaN(parsedConfidence) && parsedConfidence >= 0 && parsedConfidence <= 1) {
      confidence = parsedConfidence;
    }
  }
  
  // Extract result using regex
  const resultMatch = response.match(/<result>([\s\S]*?)<\/result>/i);
  const result = resultMatch ? resultMatch[1].trim() : '';
  
  // If the response doesn't match the expected format, treat the whole response as the result
  if (!thinking && !result) {
    return { thinking: '', result: response.trim(), confidence };
  }
  
  return { thinking, result, confidence };
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

/**
 * Clears the MCP cache
 */
export const clearMCPCache = (): void => {
  mcpCache.clear();
};

/**
 * Gets cache stats
 */
export const getMCPCacheStats = (): { size: number, entries: string[] } => {
  return {
    size: mcpCache.size,
    entries: Array.from(mcpCache.keys())
  };
};
