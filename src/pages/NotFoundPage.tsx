import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 text-center">
      <div className="space-y-6 max-w-md">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto shadow-glow-primary">
          <Compass className="w-10 h-10 animate-spin" style={{ animationDuration: '12s' }} />
        </div>
        <h1 className="font-display font-black text-6xl text-white">404</h1>
        <h2 className="font-display font-bold text-2xl text-white">Uncharted Territory</h2>
        <p className="text-xs sm:text-sm text-surface-400 leading-relaxed">
          The coordinates you entered do not match any known sanctuary in the Voyage atlas.
        </p>
        <Link to="/">
          <Button variant="primary" size="md">
            Return to Atlas
          </Button>
        </Link>
      </div>
    </div>
  );
};
