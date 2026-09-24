import { motion, AnimatePresence } from 'framer-motion';

const Toast = ({ message, type, isVisible, onClose }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:bottom-10 md:right-10 z-[200] pointer-events-none"
        >
          <div className={`
            pointer-events-auto px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl border-2 md:border-4 border-timber-800 shadow-[4px_4px_0px_0px_rgba(62,39,35,1)] md:shadow-[8px_8px_0px_0px_rgba(62,39,35,1)]
            flex items-center gap-3 md:gap-4 w-full md:w-auto md:min-w-[300px]
            ${type === 'success' ? 'bg-gold-leaf text-timber-900' : 'bg-red-500 text-white'}
          `}>
            <span className="text-xl md:text-2xl flex-shrink-0">{type === 'success' ? '✅' : '⚠️'}</span>
            <div className="flex flex-col flex-1 min-w-0">
              <p className="font-display font-black uppercase text-[9px] md:text-[10px] tracking-widest opacity-70">
                System Message
              </p>
              <p className="font-display font-black text-xs md:text-sm uppercase tracking-tight truncate">
                {message}
              </p>
            </div>
            <button onClick={onClose} className="ml-auto font-black text-lg p-1 hover:scale-125 transition-transform flex-shrink-0">×</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;