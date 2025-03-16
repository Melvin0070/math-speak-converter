
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Volume, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { isValidLatex } from '@/utils/math';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

interface LaTeXInputProps {
  onLatexSubmitted: (latex: string) => void;
  onImageSubmitted: (imageData: File) => void;
  isProcessing: boolean;
}

const LaTeXInput: React.FC<LaTeXInputProps> = ({ onLatexSubmitted, onImageSubmitted, isProcessing }) => {
  const [latexInput, setLatexInput] = useState('');
  const [previewLatex, setPreviewLatex] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLatexInput(newValue);
    
    // Validate LaTeX on each keystroke
    const valid = isValidLatex(newValue);
    setIsValid(valid);
    
    // Update preview if valid
    if (valid && newValue.trim()) {
      setPreviewLatex(newValue);
    }
  };

  const handleSubmit = () => {
    if (latexInput.trim() && isValid) {
      onLatexSubmitted(latexInput);
    } else {
      // Focus the textarea if input is invalid
      textAreaRef.current?.focus();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Reset LaTeX input when image is uploaded
      setLatexInput('');
      setPreviewLatex('');
      
      // Preview the image
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Submit the image for processing
      onImageSubmitted(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl animate-fade-in">
      <div className="flex flex-col">
        <h2 className="text-xl font-medium mb-4">LaTeX Input or Image Upload</h2>
        
        <div className="mb-4 flex gap-2">
          <Button 
            variant="outline" 
            type="button" 
            onClick={triggerFileInput}
            className="flex gap-2 items-center"
            disabled={isProcessing}
          >
            <Upload className="h-4 w-4" />
            Upload Image
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={isProcessing}
          />
          
          {uploadedImage && (
            <Button
              variant="outline"
              type="button"
              onClick={clearImage}
              className="flex gap-2 items-center"
              disabled={isProcessing}
            >
              Clear Image
            </Button>
          )}
        </div>
        
        {uploadedImage && (
          <div className="bg-secondary/50 p-4 rounded-lg mb-4 overflow-x-auto">
            <p className="text-sm font-medium mb-2 text-muted-foreground">Uploaded Image:</p>
            <div className="relative">
              <img 
                src={uploadedImage} 
                alt="Uploaded math expression" 
                className="max-w-full h-auto max-h-48 rounded-md"
              />
            </div>
          </div>
        )}
        
        <Textarea
          ref={textAreaRef}
          placeholder="Enter LaTeX notation (e.g., \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}) or upload an image with math expressions"
          value={latexInput}
          onChange={handleInputChange}
          className={`min-h-32 mb-4 font-mono text-sm ${!isValid && latexInput ? 'border-destructive' : ''}`}
          disabled={isProcessing || !!uploadedImage}
        />
        
        {!isValid && latexInput && (
          <p className="text-destructive text-sm mb-4">
            Please check your LaTeX syntax.
          </p>
        )}
        
        {isValid && previewLatex && (
          <div className="bg-secondary/50 p-4 rounded-lg mb-4 overflow-x-auto">
            <p className="text-sm font-medium mb-2 text-muted-foreground">Preview:</p>
            <div className="text-lg">
              <Latex>{`$${previewLatex}$`}</Latex>
            </div>
          </div>
        )}
        
        <Button
          onClick={handleSubmit}
          disabled={(!latexInput || !isValid || isProcessing) && !uploadedImage}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Volume className="mr-2 h-4 w-4" />
              Convert to Speech
            </>
          )}
        </Button>
        
        <p className="mt-4 text-xs text-center text-muted-foreground">
          Enter valid LaTeX or upload an image with math expressions to convert it to spoken mathematics.
        </p>
      </div>
    </div>
  );
};

export default LaTeXInput;
