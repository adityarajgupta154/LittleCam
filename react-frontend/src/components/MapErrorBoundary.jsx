import React from 'react';

class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // eslint-disable-next-line no-unused-vars
  componentDidCatch(error, errorInfo) {
    // Silently handle error for production
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#020617] text-[#64748B] dark:text-gray-400 p-8">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠</div>
            <h3 className="text-lg font-semibold text-[#111827] dark:text-[#F8FAFC] mb-2">Map temporarily unavailable</h3>
            <p className="text-sm mb-4">An error occurred while rendering the map view.</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-[#0F4C81] text-white text-sm font-medium hover:bg-[#0a3a63] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary;
