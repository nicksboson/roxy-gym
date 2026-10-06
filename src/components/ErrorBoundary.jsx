import React, { Component } from 'react';
import ErrorPage from '../pages/ErrorPage';

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in their child component tree,
 * logs those errors, and displays the fallback ErrorPage instead of crashing.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    if (typeof this.props.onReset === 'function') {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          onReset: this.handleReset
        });
      }

      return (
        <ErrorPage
          type="error"
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleReset}
          inline={this.props.inline || false}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
