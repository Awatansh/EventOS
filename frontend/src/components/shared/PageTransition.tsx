import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: React.ReactNode;
}

/**
 * Wraps page content in Framer Motion for route transition animations.
 * Subtle fade + slide-up on enter, fade out on exit.
 */
export const PageTransition: React.FC<Props> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};
