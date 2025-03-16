import { useMCP, ValidationResult } from './mcp';

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
 * This is a placeholder - the actual image processing will be handled elsewhere
 */
export const imageToLatexMCP = async (imageBase64: string): Promise<string> => {
  // This function is a placeholder since we don't have direct image processing here
  // The actual implementation will be in openai.ts using GPT-4 Vision
  return 'Placeholder for image processing result';
};
