// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardLayout from './DashboardLayout';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';

// Mock dependencies
vi.mock('@/_core/hooks/useAuth');
vi.mock('wouter');
vi.mock('@/hooks/useMobile', () => ({
  useIsMobile: () => false,
}));
vi.mock('./DashboardLayoutSkeleton', () => ({
  DashboardLayoutSkeleton: () => <div>Loading...</div>,
}));

describe('DashboardLayout Navigation Groups', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render all 9 navigation groups', () => {
    const mockUseAuth = useAuth as any;
    mockUseAuth.mockReturnValue({
      loading: false,
      user: { name: 'Test User', email: 'test@example.com' },
      logout: vi.fn(),
    });

    const mockUseLocation = useLocation as any;
    mockUseLocation.mockReturnValue(['/', vi.fn()]);

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Sales & Orders')).toBeInTheDocument();
    expect(screen.getByText('Menu & Recipes')).toBeInTheDocument();
    expect(screen.getByText('Inventory & Supply')).toBeInTheDocument();
    expect(screen.getByText('Staff & Operations')).toBeInTheDocument();
    expect(screen.getByText('Customers & Marketing')).toBeInTheDocument();
    expect(screen.getByText('Reservations & Seating')).toBeInTheDocument();
    expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
    expect(screen.getByText('Settings & Admin')).toBeInTheDocument();
  });

  it('should expand group when clicked', async () => {
    const mockUseAuth = useAuth as any;
    mockUseAuth.mockReturnValue({
      loading: false,
      user: { name: 'Test User', email: 'test@example.com' },
      logout: vi.fn(),
    });

    const mockUseLocation = useLocation as any;
    mockUseLocation.mockReturnValue(['/', vi.fn()]);

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const salesOrdersButton = screen.getByText('Sales & Orders').closest('button');
    expect(salesOrdersButton).toBeInTheDocument();

    fireEvent.click(salesOrdersButton!);

    await waitFor(() => {
      expect(screen.getByText('POS')).toBeInTheDocument();
      expect(screen.getByText('Kitchen (KDS)')).toBeInTheDocument();
    });
  });

  it('should collapse group when clicked again', async () => {
    const mockUseAuth = useAuth as any;
    mockUseAuth.mockReturnValue({
      loading: false,
      user: { name: 'Test User', email: 'test@example.com' },
      logout: vi.fn(),
    });

    const mockUseLocation = useLocation as any;
    mockUseLocation.mockReturnValue(['/', vi.fn()]);

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const salesOrdersButton = screen.getByText('Sales & Orders').closest('button');

    // First click to expand
    fireEvent.click(salesOrdersButton!);
    await waitFor(() => {
      expect(screen.getByText('POS')).toBeInTheDocument();
    });

    // Second click to collapse
    fireEvent.click(salesOrdersButton!);
    await waitFor(() => {
      expect(screen.queryByText('POS')).not.toBeInTheDocument();
    });
  });

  it('should persist expanded groups in localStorage', async () => {
    const mockUseAuth = useAuth as any;
    mockUseAuth.mockReturnValue({
      loading: false,
      user: { name: 'Test User', email: 'test@example.com' },
      logout: vi.fn(),
    });

    const mockUseLocation = useLocation as any;
    mockUseLocation.mockReturnValue(['/', vi.fn()]);

    const { unmount } = render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    const salesOrdersButton = screen.getByText('Sales & Orders').closest('button');
    fireEvent.click(salesOrdersButton!);

    await waitFor(() => {
      expect(screen.getByText('POS')).toBeInTheDocument();
    });

    // Check localStorage
    const savedGroups = localStorage.getItem('expanded-groups');
    expect(savedGroups).toBeTruthy();
    const parsed = JSON.parse(savedGroups!);
    expect(parsed).toContain('sales');

    unmount();

    // Re-render and check if state is restored
    mockUseLocation.mockReturnValue(['/', vi.fn()]);
    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('POS')).toBeInTheDocument();
    });
  });

  it('should auto-expand group when navigating to item in that group', async () => {
    const mockUseAuth = useAuth as any;
    mockUseAuth.mockReturnValue({
      loading: false,
      user: { name: 'Test User', email: 'test@example.com' },
      logout: vi.fn(),
    });

    const mockUseLocation = useLocation as any;
    mockUseLocation.mockReturnValue(['/pos', vi.fn()]);

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    // Sales & Orders group should be auto-expanded because /pos is in that group
    await waitFor(() => {
      expect(screen.getByText('POS')).toBeInTheDocument();
    });
  });

  it('should show dividers between sub-sections', async () => {
    const mockUseAuth = useAuth as any;
    mockUseAuth.mockReturnValue({
      loading: false,
      user: { name: 'Test User', email: 'test@example.com' },
      logout: vi.fn(),
    });

    const mockUseLocation = useLocation as any;
    mockUseLocation.mockReturnValue(['/pos', vi.fn()]);

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    // Sales & Orders should be expanded with dividers
    await waitFor(() => {
      expect(screen.getByText('POS')).toBeInTheDocument();
      expect(screen.getByText('Payments')).toBeInTheDocument();
    });

    // Check for divider elements (border-t border-border/30)
    const dividers = document.querySelectorAll('.border-t');
    expect(dividers.length).toBeGreaterThan(0);
  });

  it('should highlight active menu item', async () => {
    const mockUseAuth = useAuth as any;
    mockUseAuth.mockReturnValue({
      loading: false,
      user: { name: 'Test User', email: 'test@example.com' },
      logout: vi.fn(),
    });

    const mockUseLocation = useLocation as any;
    mockUseLocation.mockReturnValue(['/pos', vi.fn()]);

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    await waitFor(() => {
      const posButton = screen.getByText('POS').closest('button');
      expect(posButton).toHaveClass('bg-primary');
    });
  });

  it('should navigate when menu item is clicked', async () => {
    const mockSetLocation = vi.fn();
    const mockUseAuth = useAuth as any;
    mockUseAuth.mockReturnValue({
      loading: false,
      user: { name: 'Test User', email: 'test@example.com' },
      logout: vi.fn(),
    });

    const mockUseLocation = useLocation as any;
    mockUseLocation.mockReturnValue(['/', mockSetLocation]);

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    // Expand Sales & Orders
    const salesOrdersButton = screen.getByText('Sales & Orders').closest('button');
    fireEvent.click(salesOrdersButton!);

    await waitFor(() => {
      expect(screen.getByText('POS')).toBeInTheDocument();
    });

    // Click POS menu item
    const posButton = screen.getByText('POS').closest('button');
    fireEvent.click(posButton!);

    expect(mockSetLocation).toHaveBeenCalledWith('/pos');
  });

  it('should show loading skeleton when auth is loading', () => {
    const mockUseAuth = useAuth as any;
    mockUseAuth.mockReturnValue({
      loading: true,
      user: null,
      logout: vi.fn(),
    });

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show login button when user is not authenticated', () => {
    const mockUseAuth = useAuth as any;
    mockUseAuth.mockReturnValue({
      loading: false,
      user: null,
      logout: vi.fn(),
    });

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('should display user info in footer', () => {
    const mockUseAuth = useAuth as any;
    mockUseAuth.mockReturnValue({
      loading: false,
      user: { name: 'John Doe', email: 'john@example.com' },
      logout: vi.fn(),
    });

    const mockUseLocation = useLocation as any;
    mockUseLocation.mockReturnValue(['/', vi.fn()]);

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should call logout when sign out is clicked', async () => {
    const mockLogout = vi.fn();
    const mockUseAuth = useAuth as any;
    mockUseAuth.mockReturnValue({
      loading: false,
      user: { name: 'Test User', email: 'test@example.com' },
      logout: mockLogout,
    });

    const mockUseLocation = useLocation as any;
    mockUseLocation.mockReturnValue(['/', vi.fn()]);

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    );

    // Click user avatar to open dropdown
    const userButton = screen.getByText('Test User').closest('button');
    fireEvent.click(userButton!);

    // Click sign out
    const signOutButton = screen.getByText('Sign out');
    fireEvent.click(signOutButton);

    expect(mockLogout).toHaveBeenCalled();
  });
});
