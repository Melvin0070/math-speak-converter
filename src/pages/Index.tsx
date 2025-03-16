
import React, { useState } from 'react';
import Header from '@/components/Header';
import AudioInput from '@/components/AudioInput';
import LaTeXInput from '@/components/LaTeXInput';
import ConversionDisplay from '@/components/ConversionDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { initializeOpenAI } from '@/services/openai';
import { speechToLatex, latexToSpeech, imageToSpeech } from '@/services/converter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

type ConversionType = 'speechToLatex' | 'latexToSpeech' | 'imageToSpeech';
type ConversionResult = {
  text: string;
  latex: string;
  audioUrl?: string;
};

const Index: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyDialog, setShowApiKeyDialog] = useState<boolean>(true);
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('speech-to-latex');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<ConversionResult | null>(null);
  const [conversionType, setConversionType] = useState<ConversionType>('speechToLatex');
  const { toast } = useToast();

  const handleApiKeySubmit = () => {
    if (!apiKey.trim()) {
      toast({
        title: 'API Key Required',
        description: 'Please enter your OpenAI API key.',
        variant: 'destructive',
      });
      return;
    }

    try {
      initializeOpenAI({ apiKey });
      setIsApiKeySet(true);
      setShowApiKeyDialog(false);
      toast({
        title: 'API Key Set',
        description: 'Your OpenAI API key has been set successfully.',
      });
    } catch (error) {
      console.error('Error setting API key:', error);
      toast({
        title: 'Invalid API Key',
        description: 'Failed to initialize with the provided API key.',
        variant: 'destructive',
      });
    }
  };

  const handleAudioRecorded = async (audioBlob: Blob) => {
    if (!isApiKeySet) {
      setShowApiKeyDialog(true);
      return;
    }

    setIsProcessing(true);
    try {
      const result = await speechToLatex(audioBlob);
      setCurrentResult(result);
      setConversionType('speechToLatex');
      toast({
        title: 'Conversion Complete',
        description: 'Your speech has been converted to LaTeX.',
      });
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: 'Conversion Error',
        description: 'Failed to convert your speech to LaTeX.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLatexSubmitted = async (latex: string) => {
    if (!isApiKeySet) {
      setShowApiKeyDialog(true);
      return;
    }

    setIsProcessing(true);
    try {
      const result = await latexToSpeech(latex);
      setCurrentResult(result);
      setConversionType('latexToSpeech');
      toast({
        title: 'Conversion Complete',
        description: 'Your LaTeX has been converted to speech.',
      });
    } catch (error) {
      console.error('Error processing LaTeX:', error);
      toast({
        title: 'Conversion Error',
        description: 'Failed to convert your LaTeX to speech.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageSubmitted = async (imageFile: File) => {
    if (!isApiKeySet) {
      setShowApiKeyDialog(true);
      return;
    }

    setIsProcessing(true);
    try {
      const result = await imageToSpeech(imageFile);
      setCurrentResult(result);
      setConversionType('imageToSpeech');
      toast({
        title: 'Conversion Complete',
        description: 'Your image has been converted to LaTeX and speech.',
      });
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: 'Conversion Error',
        description: 'Failed to convert your image to LaTeX and speech.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex flex-col">
      <Header />
      
      <main className="flex-1 container px-4 py-8">
        <Tabs 
          defaultValue="speech-to-latex" 
          className="max-w-4xl mx-auto"
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            setCurrentResult(null);
          }}
        >
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="speech-to-latex">Speech to LaTeX</TabsTrigger>
            <TabsTrigger value="latex-to-speech">LaTeX to Speech</TabsTrigger>
          </TabsList>
          
          <div className="grid gap-8 md:grid-cols-2">
            <TabsContent value="speech-to-latex" className="mt-0">
              <AudioInput 
                onAudioRecorded={handleAudioRecorded} 
                isProcessing={isProcessing} 
              />
            </TabsContent>
            
            <TabsContent value="latex-to-speech" className="mt-0">
              <LaTeXInput 
                onLatexSubmitted={handleLatexSubmitted}
                onImageSubmitted={handleImageSubmitted} 
                isProcessing={isProcessing} 
              />
            </TabsContent>
            
            {currentResult && (
              <div className="md:col-span-2">
                <ConversionDisplay 
                  result={currentResult} 
                  conversionType={conversionType === 'imageToSpeech' ? 'latexToSpeech' : conversionType} 
                />
              </div>
            )}
          </div>
        </Tabs>
        
        {isProcessing && !currentResult && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Processing your request...</p>
            </div>
          </div>
        )}
      </main>
      
      <footer className="py-6 px-4 border-t bg-background/80 backdrop-blur-sm">
        <div className="container text-center text-sm text-muted-foreground">
          <p>
            Math Speak Converter — Powered by OpenAI APIs
          </p>
        </div>
      </footer>
      
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>OpenAI API Key</DialogTitle>
            <DialogDescription>
              Please enter your OpenAI API key to use the application. This key is required for speech recognition and text-to-speech conversion.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Input
              placeholder="Enter your OpenAI API key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally in your browser and is never sent to our servers. 
              It's only used to make direct API calls to OpenAI from your browser.
            </p>
          </div>
          
          <DialogFooter>
            <Button onClick={handleApiKeySubmit} type="submit">
              Save API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
