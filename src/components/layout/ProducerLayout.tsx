import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ProducerLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export const ProducerLayout = ({ sidebar, children }: ProducerLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-72 bg-muted border-r border-border flex flex-col"
      >
        {sidebar}
      </motion.aside>

      {/* Main Content */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex-1 flex flex-col min-h-screen bg-background"
      >
        {children}
      </motion.main>
    </div>
  );
};