import { motion, AnimatePresence } from 'framer-motion';

const Toast = ({ message, type, isVisible, onClose }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className="fixed bottom-10 right-10 z-50"
        >
          <div className={`
            px-6 py-4 rounded-2xl border-4 border-timber-800 shadow-[8px_8px_0px_0px_rgba(62,39,35,1)]
            flex items-center gap-4 min-w-[300px]
            ${type === 'success' ? 'bg-gold-leaf text-timber-900' : 'bg-red-500 text-white'}
          `}>
            <span className="text-2xl">{type === 'success' ? '✅' : '⚠️'}</span>
            <div className="flex flex-col">
              <p className="font-display font-black uppercase text-[10px] tracking-widest opacity-70">
                System Message
              </p>
              <p className="font-display font-black text-sm uppercase tracking-tight">
                {message}
              </p>
            </div>
            <button onClick={onClose} className="ml-auto font-black hover:scale-125 transition-transform">×</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;