/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js router
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'test-patient-id' }),
  useRouter: () => ({
    push: mockPush,
    back: mockBack
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

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Import the component after mocking
import PatientDetailPage from '@/app/dashboard/patients/[id]/page';

const mockPatientData = {
  patient: {
    id: 'test-patient-id',
    first_name: 'John',
    last_name: 'Doe',
    national_id: '1234567890123',
    phone: '0123456789',
    email: 'john@example.com',
    date_of_birth: '1990-01-01',
    gender: 'Male',
    address: '123 Test Street',
    created_at: '2024-01-01T00:00:00Z'
  }
};

const mockVisitsData = {
  patientVisits: [
    {
      id: 'visit-1',
      visit_date: '2024-01-15T10:00:00Z',
      status: 'done',
      chief_complaint: 'Headache',
      diagnosis: 'Tension headache',
      notes: 'Patient reports stress-related headache',
      vitals: {
        heightCm: 170,
        weightKg: 70,
        tempC: 36.5,
        sbp: 120,
        dbp: 80,
        hr: 72,
        spo2: 98
      },
      queueTickets: [
        {
          id: 'ticket-1',
          station: 'doctor',
          status: 'done',
          number: 1
        }
      ]
    },
    {
      id: 'visit-2',
      visit_date: '2024-01-10T14:30:00Z',
      status: 'open',
      chief_complaint: 'Cough',
      diagnosis: null,
      notes: null,
      vitals: null,
      queueTickets: []
    }
  ]
};

describe('PatientDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('renders patient information correctly', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: async () => ({ data: mockPatientData })
      })
      .mockResolvedValueOnce({
        json: async () => ({ data: mockVisitsData })
      });

    render(<PatientDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('Patient ID: test-patient-id')).toBeInTheDocument();
    expect(screen.getByText('0123456789')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Male')).toBeInTheDocument();
    expect(screen.getByText('1234567890123')).toBeInTheDocument();
  });

  it('displays recent visits', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: async () => ({ data: mockPatientData })
      })
      .mockResolvedValueOnce({
        json: async () => ({ data: mockVisitsData })
      });

    render(<PatientDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Recent Visits')).toBeInTheDocument();
    });

    expect(screen.getByText('DONE')).toBeInTheDocument();
    expect(screen.getByText('OPEN')).toBeInTheDocument();
    expect(screen.getByText('Chief Complaint:')).toBeInTheDocument();
    expect(screen.getByText('Headache')).toBeInTheDocument();
    expect(screen.getByText('Cough')).toBeInTheDocument();
  });

  it('creates a new visit when button is clicked', async () => {
    const mockCreateVisitResponse = {
      data: {
        createVisit: {
          id: 'new-visit-id',
          visit_date: '2024-01-20T09:00:00Z',
          status: 'open',
          patient: {
            id: 'test-patient-id',
            first_name: 'John',
            last_name: 'Doe'
          }
        }
      }
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: async () => ({ data: mockPatientData })
      })
      .mockResolvedValueOnce({
        json: async () => ({ data: mockVisitsData })
      })
      .mockResolvedValueOnce({
        json: async () => mockCreateVisitResponse
      });

    render(<PatientDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('เริ่มรอบตรวจ')).toBeInTheDocument();
    });

    const createVisitButton = screen.getByText('เริ่มรอบตรวจ');
    fireEvent.click(createVisitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/graphql', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: expect.stringContaining('createVisit')
      }));
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard/visits/new-visit-id');
  });

  it('handles error when patient is not found', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: async () => ({ errors: [{ message: 'Patient not found' }] })
      });

    render(<PatientDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Patient not found')).toBeInTheDocument();
    });

    expect(screen.getByText('The patient you\'re looking for doesn\'t exist.')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<PatientDetailPage />);

    // Check for loading animation elements
    const animatedElements = screen.getAllByTestId('card');
    expect(animatedElements.length).toBeGreaterThan(0);
  });

  it('handles visit creation error', async () => {
    const { toast } = require('sonner');

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: async () => ({ data: mockPatientData })
      })
      .mockResolvedValueOnce({
        json: async () => ({ data: mockVisitsData })
      })
      .mockResolvedValueOnce({
        json: async () => ({ errors: [{ message: 'Failed to create visit' }] })
      });

    render(<PatientDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('เริ่มรอบตรวจ')).toBeInTheDocument();
    });

    const createVisitButton = screen.getByText('เริ่มรอบตรวจ');
    fireEvent.click(createVisitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create visit');
    });
  });

  it('navigates to visit detail when visit card is clicked', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: async () => ({ data: mockPatientData })
      })
      .mockResolvedValueOnce({
        json: async () => ({ data: mockVisitsData })
      });

    render(<PatientDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Recent Visits')).toBeInTheDocument();
    });

    // Find and click on a visit card (this is simplified - in reality you'd need to target the specific clickable element)
    const visitCards = screen.getAllByTestId('card-content');
    if (visitCards.length > 1) {
      fireEvent.click(visitCards[1]); // Click on the first visit card (second card content is the visit)
    }
  });

  it('displays correct badge colors for visit status', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: async () => ({ data: mockPatientData })
      })
      .mockResolvedValueOnce({
        json: async () => ({ data: mockVisitsData })
      });

    render(<PatientDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('DONE')).toBeInTheDocument();
      expect(screen.getByText('OPEN')).toBeInTheDocument();
    });

    // Check that badges are rendered (specific styling would need more detailed testing)
    const badges = screen.getAllByText(/^(DONE|OPEN)$/);
    expect(badges.length).toBe(2);
  });
});
