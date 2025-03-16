import { useMCP, ValidationResult, clearMCPCache } from './mcp';

/**
 * Specialized MCP for LaTeX validation with mathematical context
 */
export const validateLatexMCP = (latex: string): ValidationResult => {
  // Check for balanced delimiters
  const bracketBalance = (str: string, open: string, close: string) => {
    let count = 0;
    for (const char of str) {
      if (char === open) count++;
      if (char === close) count--;
      if (count < 0) return false;
    }
    return count === 0;
  };
  
  // Basic structural validation
  const hasBalancedBraces = bracketBalance(latex, '{', '}');
  const hasBalancedBrackets = bracketBalance(latex, '[', ']');
  const hasBalancedParens = bracketBalance(latex, '(', ')');
  const hasMathDollarSigns = bracketBalance(latex, '$', '$');
  
  // Check for common LaTeX environments
  const environmentMatches = latex.match(/\\begin\{([^}]+)\}/g) || [];
  const beginEnvs = environmentMatches.map(m => m.match(/\\begin\{([^}]+)\}/)?.[1]).filter(Boolean);
  
  const endEnvironmentMatches = latex.match(/\\end\{([^}]+)\}/g) || [];
  const endEnvs = endEnvironmentMatches.map(m => m.match(/\\end\{([^}]+)\}/)?.[1]).filter(Boolean);
  
  const hasBalancedEnvironments = beginEnvs.length === endEnvs.length && 
    beginEnvs.every((env, i) => env === endEnvs[i]);
  
  // Check for common mathematical syntax errors
  const hasUnresolvedCommands = /\\[a-zA-Z]+\s[a-zA-Z]/g.test(latex); // Command without braces followed by text
  const hasMissingOperators = /[0-9][a-zA-Z]/g.test(latex); // Number directly followed by variable without operator
  
  // Build detailed feedback
  let feedbackItems = [];
  
  if (!hasBalancedBraces) feedbackItems.push('unbalanced curly braces {}');
  if (!hasBalancedBrackets) feedbackItems.push('unbalanced square brackets []');
  if (!hasBalancedParens) feedbackItems.push('unbalanced parentheses ()');
  if (!hasMathDollarSigns) feedbackItems.push('unbalanced dollar signs $');
  if (!hasBalancedEnvironments) feedbackItems.push('unbalanced LaTeX environments');
  if (hasUnresolvedCommands) feedbackItems.push('commands without proper braces');
  if (hasMissingOperators) feedbackItems.push('missing operators between numbers and variables');
  
  const valid = hasBalancedBraces && hasBalancedBrackets && hasBalancedParens && 
               hasMathDollarSigns && hasBalancedEnvironments && 
               !hasUnresolvedCommands && !hasMissingOperators;
  
  return {
    valid,
    feedback: valid ? undefined : `LaTeX has issues: ${feedbackItems.join(', ')}.`
  };
};

/**
 * MCP for converting natural language to LaTeX with mathematical accuracy
 */
export const naturalLanguageToLatexMCP = async (text: string): Promise<string> => {
  const result = await useMCP<string>(
    'convert natural language mathematical expressions to accurate LaTeX',
    text,
    (output) => output.trim(),
    validateLatexMCP,
    { 
      maxIterations: 3, 
      temperature: 0.2, 
      verbose: false,
      model: 'gpt-4o'
    }
  );
  
  return result.finalResult;
};

/**
 * MCP for checking mathematical correctness of LaTeX expressions
 */
export const verifyMathematicalCorrectnessMCP = async (latex: string): Promise<boolean> => {
  const result = await useMCP<string>(
    'verify the mathematical correctness of the following LaTeX expression',
    latex,
    (output) => output.toLowerCase().trim(),
    (result) => ({
      valid: result === 'correct' || result === 'mathematically valid',
      feedback: 'Please explicitly state if the expression is "correct" or "mathematically valid"'
    }),
    { 
      maxIterations: 2, 
      temperature: 0.1, 
      verbose: false,
      model: 'gpt-4o'
    }
  );
  
  return result.finalResult === 'correct' || result.finalResult === 'mathematically valid';
};

/**
 * MCP for simplifying complex LaTeX expressions
 */
export const simplifyLatexMCP = async (latex: string): Promise<string> => {
  const result = await useMCP<string>(
    'simplify the following LaTeX expression while preserving its mathematical meaning',
    latex,
    (output) => output.trim(),
    validateLatexMCP,
    { 
      maxIterations: 3, 
      temperature: 0.2, 
      verbose: false,
      model: 'gpt-4o'
    }
  );
  
  return result.finalResult;
};

/**
 * MCP for converting LaTeX to clear, accessible natural language
 */
export const latexToNaturalLanguageMCP = async (latex: string): Promise<string> => {
  const result = await useMCP<string>(
    'convert LaTeX mathematical expressions to clear, accessible natural language suitable for text-to-speech',
    latex,
    (output) => output.trim(),
    (text) => ({ 
      valid: text.length > 0 && !text.includes('\\') && !text.includes('$'),
      feedback: 'Ensure all LaTeX commands are properly converted to natural language.'
    }),
    { 
      maxIterations: 3, 
      temperature: 0.3, 
      verbose: false,
      model: 'gpt-4o'
    }
  );
  
  return result.finalResult;
};

/**
 * MCP for extracting mathematical expressions from images
 * Uses OpenAI's vision capabilities and applies MCP for refinement
 */
export const imageToLatexMCP = async (imageBase64: string): Promise<string> => {
  // Import the openAI function dynamically to avoid circular dependencies
  const { imageToLatex } = await import('./openai');
  
  // Create a File object from the base64 string
  const binaryData = atob(imageBase64.split(',')[1]);
  const byteArray = new Uint8Array(binaryData.length);
  for (let i = 0; i < binaryData.length; i++) {
    byteArray[i] = binaryData.charCodeAt(i);
  }
  const blob = new Blob([byteArray], { type: 'image/png' });
  const imageFile = new File([blob], 'image.png', { type: 'image/png' });
  
  try {
    // First pass: Get initial LaTeX from the image using OpenAI's vision model
    const initialLatex = await imageToLatex(imageFile);
    
    // Second pass: Refine the LaTeX using MCP for mathematical accuracy
    const result = await useMCP<string>(
      'verify and refine the LaTeX extracted from an image for mathematical accuracy and consistency',
      initialLatex,
      (output) => output.trim(),
      validateLatexMCP,
      { 
        maxIterations: 3, 
        temperature: 0.1, 
        verbose: false,
        model: 'gpt-4o'
      }
    );
    
    return result.finalResult;
  } catch (error) {
    console.error('Error in MCP image to LaTeX conversion:', error);
    throw error;
  }
};

/**
 * Advanced MCP for step-by-step equation solving with detailed work
 */
export const solveEquationWithStepsMCP = async (equation: string): Promise<{latex: string, steps: string[]}> => {
  const result = await useMCP<{latex: string, steps: string[]}>(
    'solve the mathematical equation step-by-step with clear explanations',
    equation,
    (output) => {
      try {
        // Try to parse JSON output if it's in that format
        if (output.startsWith('{') && output.endsWith('}')) {
          return JSON.parse(output);
        }
        
        // Otherwise, try to extract solution and steps
        const solutionMatch = output.match(/Solution:\s*(.*?)(?:\n|$)/i);
        const solution = solutionMatch ? solutionMatch[1].trim() : '';
        
        const steps = output
          .split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => line.trim());
        
        return {
          latex: solution,
          steps: steps.filter(step => step !== solution)
        };
      } catch (e) {
        // Fallback if parsing fails
        return {
          latex: output.trim(),
          steps: ["Could not parse steps from the solution"]
        };
      }
    },
    (result) => {
      const hasSolution = result.latex && result.latex.length > 0;
      const hasSteps = result.steps && result.steps.length > 0;
      
      return {
        valid: hasSolution && hasSteps,
        feedback: !hasSolution 
          ? 'Missing final solution in LaTeX format' 
          : (!hasSteps ? 'Missing solution steps' : undefined),
        confidence: hasSolution && hasSteps ? 0.9 : 0.5
      };
    },
    { 
      maxIterations: 3, 
      temperature: 0.2,
      verbose: false,
      model: 'gpt-4o',
      confidenceThreshold: 0.8
    }
  );
  
  return result.finalResult;
};

/**
 * MCP for handling complex mathematical proofs
 */
export const generateMathProofMCP = async (theorem: string): Promise<{proof: string, latex: string}> => {
  const result = await useMCP<{proof: string, latex: string}>(
    'generate a rigorous mathematical proof for the given theorem or statement',
    theorem,
    (output) => {
      const proofTextMatch = output.match(/Proof:\s*([\s\S]*?)(?:\n\nLaTeX:|$)/i);
      const proofText = proofTextMatch ? proofTextMatch[1].trim() : output.trim();
      
      const latexMatch = output.match(/LaTeX:\s*([\s\S]*?)$/i);
      const latex = latexMatch ? latexMatch[1].trim() : '';
      
      return {
        proof: proofText,
        latex: latex
      };
    },
    (result) => {
      const validProof = result.proof && result.proof.length > 50; // Arbitrary minimum length
      const validLatex = result.latex && validateLatexMCP(result.latex).valid;
      
      return {
        valid: validProof && validLatex,
        feedback: !validProof 
          ? 'The proof is not detailed enough' 
          : (!validLatex ? 'The LaTeX formatting has issues' : undefined),
        confidence: validProof && validLatex ? 0.9 : 0.6
      };
    },
    { 
      maxIterations: 3, 
      temperature: 0.3,
      verbose: false,
      model: 'gpt-4o',
      confidenceThreshold: 0.8
    }
  );
  
  return result.finalResult;
};

/**
 * MCP for converting between different mathematical notation systems
 */
export const convertNotationSystemMCP = async (
  expression: string, 
  fromSystem: 'latex' | 'asciimath' | 'mathml' | 'wolfram', 
  toSystem: 'latex' | 'asciimath' | 'mathml' | 'wolfram'
): Promise<string> => {
  const result = await useMCP<string>(
    `convert mathematical notation from ${fromSystem} to ${toSystem}`,
    expression,
    (output) => output.trim(),
    (result) => {
      // Basic validation based on target notation system
      let valid = result.length > 0;
      
      if (toSystem === 'latex') {
        valid = validateLatexMCP(result).valid;
      } else if (toSystem === 'mathml') {
        valid = result.includes('<math') && result.includes('</math>');
      } else if (toSystem === 'asciimath') {
        valid = !result.includes('\\') && !result.includes('<math');
      } else if (toSystem === 'wolfram') {
        valid = !result.includes('\\') && !result.includes('<math');
      }
      
      return {
        valid,
        feedback: !valid ? `The result doesn't appear to be valid ${toSystem}` : undefined,
        confidence: valid ? 0.85 : 0.5
      };
    },
    { 
      maxIterations: 2, 
      temperature: 0.2,
      verbose: false,
      model: 'gpt-4o'
    }
  );
  
  return result.finalResult;
};

/**
 * MCP for analyzing mathematical expressions and providing educational explanations
 */
export const explainMathExpressionMCP = async (expression: string, level: 'elementary' | 'high-school' | 'undergraduate' | 'graduate' = 'high-school'): Promise<{explanation: string, concepts: string[]}> => {
  const result = await useMCP<{explanation: string, concepts: string[]}>(
    `explain this mathematical expression at a ${level} level with key concepts identified`,
    expression,
    (output) => {
      // Try to parse as JSON first
      try {
        if (output.startsWith('{') && output.endsWith('}')) {
          const parsed = JSON.parse(output);
          if (parsed.explanation && parsed.concepts) {
            return parsed;
          }
        }
      } catch (e) {
        // Fall through to manual parsing
      }
      
      // Manual parsing
      const explanationMatch = output.match(/Explanation:\s*([\s\S]*?)(?:\n\nConcepts:|$)/i);
      const explanation = explanationMatch ? explanationMatch[1].trim() : output.trim();
      
      const conceptsMatch = output.match(/Concepts:\s*([\s\S]*?)$/i);
      let concepts: string[] = [];
      if (conceptsMatch) {
        concepts = conceptsMatch[1]
          .split('\n')
          .map(line => line.replace(/^[•\-*]\s*/, '').trim())
          .filter(Boolean);
      }
      
      return {
        explanation,
        concepts
      };
    },
    (result) => {
      const validExplanation = result.explanation && result.explanation.length > 50;
      const validConcepts = result.concepts && result.concepts.length > 0;
      
      return {
        valid: validExplanation && validConcepts,
        feedback: !validExplanation 
          ? 'The explanation is not detailed enough' 
          : (!validConcepts ? 'No key concepts were identified' : undefined),
        confidence: validExplanation && validConcepts ? 0.9 : 0.6
      };
    },
    { 
      maxIterations: 2, 
      temperature: 0.3,
      verbose: false,
      model: 'gpt-4o',
      confidenceThreshold: 0.8
    }
  );
  
  return result.finalResult;
};

/**
 * Reset the MCP system by clearing caches
 */
export const resetMathMCPSystem = (): void => {
  clearMCPCache();
};
