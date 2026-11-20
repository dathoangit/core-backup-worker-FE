import { Component, type ErrorInfo, type ReactNode } from 'react';
import { wbClass } from './wallboard-theme';

type WallboardChartBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type WallboardChartBoundaryState = {
  error: Error | null;
};

/**
 * Isolates chart crashes (Highcharts / Recharts size races on refresh)
 * so one panel failure does not white-screen the whole wallboard.
 */
export class WallboardChartBoundary extends Component<
  WallboardChartBoundaryProps,
  WallboardChartBoundaryState
> {
  state: WallboardChartBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): WallboardChartBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Wallboard chart crashed', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <p
          className={`flex h-full min-h-[4rem] items-center justify-center px-2 text-center text-xs ${wbClass.muted}`}>
          Chart unavailable
        </p>
      );
    }
    return this.props.children;
  }
}
