import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Dialog } from '../components/Dialog';
import { Input } from '../components/FormControls';

describe('Design System Primitives', () => {
  it('renders a button and fires onClick', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled state on button', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Disabled' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders badges with semantic text', () => {
    render(<Badge variant="blue">Architecture</Badge>);
    expect(screen.getByText('Architecture')).toBeInTheDocument();
  });

  it('renders Input with accessible error message and aria-invalid', () => {
    render(<Input label="Project Name" error="Title cannot be empty" />);
    const input = screen.getByLabelText('Project Name');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Title cannot be empty');
  });

  it('renders Dialog when open and calls onClose on Escape or close button', () => {
    const handleClose = vi.fn();
    const { rerender } = render(
      <Dialog isOpen={false} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Dialog>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(
      <Dialog isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal content</p>
      </Dialog>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();

    // Close button
    const closeBtn = screen.getByRole('button', { name: 'Close dialog' });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
