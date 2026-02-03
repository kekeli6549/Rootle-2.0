import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an analytics provider here
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // --- BEAUTIFUL SYSTEM MAINTENANCE UI ---
      return (
        <div className="min-h-screen bg-[#F5F5DC] flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-8 relative">
            <div className="text-9xl font-black text-timber-800 opacity-10">500</div>
            <div className="absolute inset-0 flex items-center justify-center">
               {/* A nice big icon or emoji */}
               <span className="text-6xl">🛠️</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-black text-timber-800 uppercase tracking-tighter mb-4">
            Under Maintenance
          </h1>
          
          <p className="max-w-md text-timber-700 font-medium leading-relaxed mb-8">
            The Rootle engine is currently being tuned. We hit a small snag in the dashboard, 
            but our developers are already on the case. Please try again in a moment.
          </p>

          <button 
            onClick={() => window.location.href = '/'}
            className="px-8 py-3 bg-gold-leaf text-timber-900 font-bold uppercase tracking-widest hover:bg-gold-600 transition-all shadow-xl"
          >
            Back to Safety
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;