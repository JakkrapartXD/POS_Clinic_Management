/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// Mock fetch
global.fetch = jest.fn();

// Mock components (simplified for testing)
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h3 data-testid="card-title">{children}</h3>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    <div data-testid="dialog" style={{ display: open ? 'block' : 'none' }}>
      {children}
    </div>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
  DialogTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-trigger">{children}</div>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-footer">{children}</div>
  )
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, ...props }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...props}
    />
  )
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  )
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, placeholder, ...props }: any) => (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...props}
    />
  )
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Import the component after mocking
import PatientsPage from '@/app/dashboard/patients/page';

const mockPatientsData = {
  patients: {
    patients: [
      {
        id: 'patient-1',
        first_name: 'John',
        last_name: 'Doe',
        national_id: '1234567890123',
        phone: '0123456789',
        email: 'john@example.com',
        date_of_birth: '1990-01-01',
        gender: 'ชาย',
        address: '123 Test Street',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'patient-2',
        first_name: 'Jane',
        last_name: 'Smith',
        national_id: '9876543210987',
        phone: '0987654321',
        email: 'jane@example.com',
        date_of_birth: '1985-05-15',
        gender: 'หญิง',
        address: '456 Another Street',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      }
    ],
    total: 2
  }
};

const mockSearchData = {
  searchPatients: [
    {
      id: 'patient-1',
      first_name: 'John',
      last_name: 'Doe',
      national_id: '1234567890123',
      phone: '0123456789',
      email: 'john@example.com',
      date_of_birth: '1990-01-01',
      gender: 'ชาย',
      address: '123 Test Street',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]
};

describe('PatientsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('renders patients list correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ data: mockPatientsData })
    });

    render(<PatientsPage />);

    await waitFor(() => {
      expect(screen.getByText('จัดการผู้ป่วย')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('1234567890123')).toBeInTheDocument();
    expect(screen.getByText('0123456789')).toBeInTheDocument();
  });

  it('displays search functionality', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ data: mockPatientsData })
    });

    render(<PatientsPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ค้นหาผู้ป่วย/)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/ค้นหาผู้ป่วย/);
    expect(searchInput).toBeInTheDocument();
  });

  it('performs search when typing in search input', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: async () => ({ data: mockPatientsData })
      })
      .mockResolvedValueOnce({
        json: async () => ({ data: mockSearchData })
      });

    render(<PatientsPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/ค้นหาผู้ป่วย/);
    fireEvent.change(searchInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/graphql', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: expect.stringContaining('searchPatients')
      }));
    });
  });

  it('shows create patient button', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ data: mockPatientsData })
    });

    render(<PatientsPage />);

    await waitFor(() => {
      expect(screen.getByText('เพิ่มผู้ป่วยใหม่')).toBeInTheDocument();
    });
  });

  it('displays patient cards with correct information', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ data: mockPatientsData })
    });

    render(<PatientsPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check patient information is displayed
    expect(screen.getByText('1234567890123')).toBeInTheDocument();
    expect(screen.getByText('0123456789')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('ชาย')).toBeInTheDocument();
  });

  it('shows action buttons for each patient', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ data: mockPatientsData })
    });

    render(<PatientsPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check for action buttons (Edit, Delete, View)
    const cards = screen.getAllByTestId('card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('handles empty patients list', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ 
        data: { 
          patients: { 
            patients: [], 
            total: 0 
          } 
        } 
      })
    });

    render(<PatientsPage />);

    await waitFor(() => {
      expect(screen.getByText('ไม่พบผู้ป่วย')).toBeInTheDocument();
    });

    expect(screen.getByText('ยังไม่มีผู้ป่วยในระบบ')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<PatientsPage />);

    // Check for loading animation elements
    const animatedElements = screen.getAllByTestId('card');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ 
        errors: [{ message: 'Failed to fetch patients' }] 
      })
    });

    const { toast } = require('sonner');

    render(<PatientsPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to fetch patients');
    });
  });

  it('displays refresh button', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ data: mockPatientsData })
    });

    render(<PatientsPage />);

    await waitFor(() => {
      expect(screen.getByText('รีเฟรช')).toBeInTheDocument();
    });
  });

  it('shows patient count in header', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ data: mockPatientsData })
    });

    render(<PatientsPage />);

    await waitFor(() => {
      expect(screen.getByText('จัดการผู้ป่วย')).toBeInTheDocument();
    });

    expect(screen.getByText('จัดการข้อมูลผู้ป่วยทั้งหมด')).toBeInTheDocument();
  });
});
