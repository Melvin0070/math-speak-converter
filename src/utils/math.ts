
// Function to check if a string is valid LaTeX
export const isValidLatex = (latex: string): boolean => {
  // This is a simple validation - in a real application, you might want more sophisticated validation
  if (!latex || typeof latex !== 'string') return false;
  
  // Check for balanced braces
  let braceCount = 0;
  for (let i = 0; i < latex.length; i++) {
    if (latex[i] === '{') braceCount++;
    else if (latex[i] === '}') braceCount--;
    
    // If at any point we have more closing braces than opening, it's invalid
    if (braceCount < 0) return false;
  }
  
  // At the end, we should have the same number of opening and closing braces
  return braceCount === 0;
};

// Function to format LaTeX for display (adding $ delimiters if needed)
export const formatLatexForDisplay = (latex: string): string => {
  if (!latex) return '';
  
  // If the latex already starts and ends with dollar signs, return as is
  if ((latex.startsWith('$') && latex.endsWith('$')) || 
      (latex.startsWith('$$') && latex.endsWith('$$'))) {
    return latex;
  }
  
  // Add dollar signs for inline math
  return `$${latex}$`;
};

// Function to extract pure LaTeX from display format (removing $ delimiters)
export const extractPureLatex = (displayLatex: string): string => {
  if (!displayLatex) return '';
  
  // Remove dollar signs
  let result = displayLatex;
  if (result.startsWith('$$') && result.endsWith('$$')) {
    result = result.slice(2, -2);
  } else if (result.startsWith('$') && result.endsWith('$')) {
    result = result.slice(1, -1);
  }
  
  return result;
};

// Example LaTeX expressions for testing
export const exampleLatexExpressions = [
  '\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
  'E = mc^2',
  '\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}',
  '\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}',
  'P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)}'
];
