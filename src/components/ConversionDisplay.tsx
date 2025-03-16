
import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Volume, Check } from 'lucide-react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import { formatLatexForDisplay } from '@/utils/math';

interface ConversionDisplayProps {
  result: {
    text: string;
    latex: string;
    audioUrl?: string;
  } | null;
  conversionType: 'speechToLatex' | 'latexToSpeech';
}

const ConversionDisplay: React.FC<ConversionDisplayProps> = ({ result, conversionType }) => {
  const [copied, setCopied] = React.useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (copied) {
      timeout = setTimeout(() => setCopied(false), 2000);
    }
    return () => clearTimeout(timeout);
  }, [copied]);
  
  const handleCopyLatex = () => {
    if (result?.latex) {
      navigator.clipboard.writeText(result.latex);
      setCopied(true);
    }
  };
  
  const handlePlayAudio = () => {
    if (audioRef.current && result?.audioUrl) {
      audioRef.current.play();
    }
  };
  
  if (!result) return null;
  
  return (
    <div className="glass-card p-6 rounded-2xl animate-fade-in">
      <h2 className="text-xl font-medium mb-4">
        {conversionType === 'speechToLatex' ? 'Generated LaTeX' : 'Spoken Mathematics'}
      </h2>
      
      {conversionType === 'speechToLatex' ? (
        <>
          <div className="bg-secondary/50 p-4 rounded-lg mb-4 overflow-x-auto">
            <p className="text-sm font-medium mb-2 text-muted-foreground">LaTeX:</p>
            <pre className="text-sm font-mono overflow-x-auto whitespace-pre-wrap">
              {result.latex}
            </pre>
          </div>
          
          <div className="bg-secondary/50 p-4 rounded-lg mb-4 overflow-x-auto">
            <p className="text-sm font-medium mb-2 text-muted-foreground">Rendered:</p>
            <div className="text-lg">
              <Latex>{formatLatexForDisplay(result.latex)}</Latex>
            </div>
          </div>
          
          <div className="bg-secondary/50 p-4 rounded-lg mb-4">
            <p className="text-sm font-medium mb-2 text-muted-foreground">Transcribed Text:</p>
            <p className="text-base">{result.text}</p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleCopyLatex}
            className="w-full"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy LaTeX
              </>
            )}
          </Button>
        </>
      ) : (
        <>
          <div className="bg-secondary/50 p-4 rounded-lg mb-4">
            <p className="text-sm font-medium mb-2 text-muted-foreground">Natural Language:</p>
            <p className="text-base">{result.text}</p>
          </div>
          
          <div className="bg-secondary/50 p-4 rounded-lg mb-4 overflow-x-auto">
            <p className="text-sm font-medium mb-2 text-muted-foreground">Original LaTeX:</p>
            <div className="text-lg">
              <Latex>{formatLatexForDisplay(result.latex)}</Latex>
            </div>
          </div>
          
          {result.audioUrl && (
            <>
              <audio ref={audioRef} src={result.audioUrl} className="hidden" />
              <Button 
                variant="default" 
                onClick={handlePlayAudio}
                className="w-full"
              >
                <Volume className="mr-2 h-4 w-4" />
                Play Audio
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ConversionDisplay;
