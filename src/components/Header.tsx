
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full pt-8 pb-4 px-8 flex justify-center items-center">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex mb-3 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium tracking-wider uppercase animate-fade-in">
          Mathematical Expression Converter
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Math <span className="text-primary">Speak</span>
        </h1>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto text-sm md:text-base">
          Convert between spoken math and LaTeX notation in real-time with precision and elegance.
        </p>
      </div>
    </header>
  );
};

export default Header;
