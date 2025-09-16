
import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CyberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const CyberInput = forwardRef<HTMLInputElement, CyberInputProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <motion.div
        className="relative w-full"
        whileFocus={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {label && (
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            className={cn(
              "w-full px-4 py-3 bg-card/50 border border-border rounded-lg",
              "text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-neon-blue/50",
              "focus:border-neon-blue focus:neon-glow",
              "transition-all duration-300",
              "backdrop-blur-sm",
              className
            )}
            ref={ref}
            {...props}
          />
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
      </motion.div>
    );
  }
);

CyberInput.displayName = "CyberInput";

export { CyberInput };
