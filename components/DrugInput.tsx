import React from 'react';
import { Search, FlaskConical } from 'lucide-react';

interface DrugInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onEnter?: () => void;
  placeholder: string;
}

const DrugInput: React.FC<DrugInputProps> = ({ label, value, onChange, onEnter, placeholder }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onEnter) {
      onEnter();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
        <FlaskConical className="w-4 h-4" />
        {label}
      </label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 dark:group-focus-within:text-purple-400 transition-colors" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="block w-full pl-10 pr-3 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg 
                     text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 
                     focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export default DrugInput;