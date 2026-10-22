import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from '../App';

describe('App Layout Shell & Routing', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('renders app navigation and skip to content link', () => {
    render(<App />);

    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByText('MindRail Studio')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Templates' })).toBeInTheDocument();
  });

  it('renders landing view hero on root path', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /Turn messy ideas into structured, visual work/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Software Architecture & Tasks')).toBeInTheDocument();
  });
});
