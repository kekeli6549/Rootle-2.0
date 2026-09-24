import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F5DC] flex flex-col items-center justify-center p-4 sm:p-6 text-center">
          <div className="mb-6 md:mb-8 relative">
            <div className="text-7xl md:text-9xl font-black text-timber-800 opacity-10">500</div>
            <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-4xl md:text-6xl">🛠️</span>
            </div>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-black text-timber-800 uppercase tracking-tighter mb-3 md:mb-4">
            Under Maintenance
          </h1>
          
          <p className="max-w-xs md:max-w-md text-sm md:text-base text-timber-700 font-medium leading-relaxed mb-6 md:mb-8">
            The Rootle engine is currently being tuned. We hit a small snag in the dashboard, 
            but our developers are already on the case. Please try again in a moment.
          </p>

          <button 
            onClick={() => window.location.href = '/'}
            className="w-full sm:w-auto px-6 md:px-8 py-3 bg-gold-leaf text-timber-900 font-bold uppercase tracking-widest hover:bg-gold-600 transition-all shadow-xl rounded-xl sm:rounded-none"
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