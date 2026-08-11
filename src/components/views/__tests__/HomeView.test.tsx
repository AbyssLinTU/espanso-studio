import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { HomeView } from '../HomeView';
import { useStore } from '../../../store/useStore';

describe('HomeView Component', () => {
  beforeEach(() => {
    useStore.setState({
      macros: [],
      currentView: 'home',
      editorMode: 'quick',
    });
  });

  it('renders empty state when no macros exist', () => {
    render(<HomeView />);
    expect(screen.getByText("You haven't created any macros yet.")).toBeInTheDocument();
  });

  it('renders macro cards and matches count', () => {
    useStore.setState({
      macros: [
        { trigger: ':greet', replace: 'Hello World', folder: 'Work' },
        { trigger: ':sig', replace: 'Kind regards', folder: 'Work' },
      ],
    });

    render(<HomeView />);
    expect(screen.getByText(':greet')).toBeInTheDocument();
    expect(screen.getByText(':sig')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getByText('My Matches')).toBeInTheDocument();
  });

  it('filters macros by search input', () => {
    useStore.setState({
      macros: [
        { trigger: ':apple', replace: 'Red fruit' },
        { trigger: ':banana', replace: 'Yellow fruit' },
      ],
    });

    render(<HomeView />);
    const searchInput = screen.getByPlaceholderText('Search triggers or folders...');
    fireEvent.change(searchInput, { target: { value: 'apple' } });

    expect(screen.getByText(':apple')).toBeInTheDocument();
    expect(screen.queryByText(':banana')).not.toBeInTheDocument();
  });

  it('filters macros by folder tab selection', () => {
    useStore.setState({
      macros: [
        { trigger: ':job1', replace: 'Job', folder: 'Work' },
        { trigger: ':home1', replace: 'Home', folder: 'Personal' },
      ],
    });

    render(<HomeView />);
    
    // Select Work tab
    const workButton = screen.getByRole('button', { name: /Work/i });
    expect(workButton).toBeInTheDocument();

    fireEvent.click(workButton);

    expect(screen.getByText(':job1')).toBeInTheDocument();
    expect(screen.queryByText(':home1')).not.toBeInTheDocument();
  });
});
