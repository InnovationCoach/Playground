import { Component } from 'react';

/**
 * Keeps a crash in one part of a page from blanking the whole app: the rest of
 * the screen and the menu stay usable, and the learner can try again.
 */
export class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error(`[ErrorBoundary] ${this.props.name || 'section'}:`, error, info?.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="gh-card" role="alert">
        <p>Something went wrong showing the {this.props.name || 'section'}.</p>
        <button type="button" className="gh-btn gh-btn-ghost" onClick={() => this.setState({ failed: false })}>Try again</button>
      </div>
    );
  }
}
