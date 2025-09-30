// Temporarily disabled Apollo Client imports to fix build issues
// import { useSubscription } from '@apollo/client';
import { useEffect, useRef } from 'react';

interface UseGraphQLSubscriptionOptions {
  query: any;
  variables?: Record<string, any>;
  onData?: (data: any) => void;
  onError?: (error: any) => void;
  onComplete?: () => void;
  skip?: boolean;
}

export function useGraphQLSubscription({
  query,
  variables,
  onData,
  onError,
  onComplete,
  skip = false,
}: UseGraphQLSubscriptionOptions) {
  // Temporarily disabled Apollo Client subscription to fix build issues
  // TODO: Re-enable once import issues are resolved
  const data = null;
  const error = null;
  const loading = false;

  const onErrorRef = useRef(onError);
  const onCompleteRef = useRef(onComplete);

  // Update refs when callbacks change
  useEffect(() => {
    onErrorRef.current = onError;
    onCompleteRef.current = onComplete;
  }, [onError, onComplete]);

  // Handle errors
  useEffect(() => {
    if (error && onErrorRef.current) {
      onErrorRef.current(error);
    }
  }, [error]);

  return {
    data,
    error,
    loading,
  };
}

// Example subscription queries
export const SUBSCRIPTION_QUERIES = {
  // Queue ticket updates
  QUEUE_TICKET_UPDATES: `
    subscription QueueTicketUpdates($station: QueueStation) {
      queueTicketUpdated(station: $station) {
        id
        number
        station
        status
        priority
        patientId
        called_at
        started_at
        done_at
        created_at
        patient {
          id
          first_name
          last_name
          phone
          email
        }
        visit {
          id
          status
          chief_complaint
        }
        events {
          id
          status
          at
          byUserId
          note
        }
      }
    }
  `,

  // Triage queue updates
  TRIAGE_QUEUE_UPDATES: `
    subscription TriageQueueUpdates {
      triageQueueUpdated {
        id
        number
        status
        station
        patientId
        priority
        called_at
        started_at
        done_at
        created_at
        patient {
          id
          first_name
          last_name
          phone
          email
        }
        visit {
          id
          status
          chief_complaint
        }
        events {
          id
          status
          at
          byUserId
          note
        }
      }
    }
  `,

  // Stock alerts
  STOCK_ALERTS: `
    subscription StockAlerts {
      stockAlert {
        id
        alert_type
        alert_message
        created_at
        acknowledged
        product {
          id
          product_name
          stock_quantity
          reorder_point
        }
      }
    }
  `,

  // Order updates
  ORDER_UPDATES: `
    subscription OrderUpdates {
      orderUpdated {
        id
        order_date
        status
        total_amount
        is_walkin
        created_at
        updated_at
        patient {
          id
          first_name
          last_name
        }
        user {
          id
          username
        }
        orderItems {
          id
          quantity
          unit_price
          total_price
          product_name
          product_unit
        }
      }
    }
  `,

  // Patient updates
  PATIENT_UPDATES: `
    subscription PatientUpdates {
      patientUpdated {
        id
        first_name
        last_name
        national_id
        phone
        email
        updated_at
      }
    }
  `,

  // Visit updates
  VISIT_UPDATES: `
    subscription VisitUpdates {
      visitUpdated {
        id
        visit_date
        status
        chief_complaint
        diagnosis
        notes
        patient {
          id
          first_name
          last_name
        }
        updated_at
      }
    }
  `,
};

// Hook for queue ticket updates
export function useQueueTicketUpdates(station?: string, onUpdate?: (data: any) => void) {
  return useGraphQLSubscription({
    query: SUBSCRIPTION_QUERIES.QUEUE_TICKET_UPDATES,
    variables: station ? { station } : undefined,
    onData: onUpdate,
    onError: (error) => {
      console.error('Queue ticket subscription error:', error);
    },
  });
}

// Hook for triage queue updates
export function useTriageQueueUpdates(onUpdate?: (data: any) => void) {
  return useGraphQLSubscription({
    query: SUBSCRIPTION_QUERIES.TRIAGE_QUEUE_UPDATES,
    onData: onUpdate,
    onError: (error) => {
      console.error('Triage queue subscription error:', error);
    },
  });
}

// Hook for stock alerts
export function useStockAlerts(onAlert?: (data: any) => void) {
  return useGraphQLSubscription({
    query: SUBSCRIPTION_QUERIES.STOCK_ALERTS,
    onData: onAlert,
    onError: (error) => {
      console.error('Stock alert subscription error:', error);
    },
  });
}

// Hook for order updates
export function useOrderUpdates(onUpdate?: (data: any) => void) {
  return useGraphQLSubscription({
    query: SUBSCRIPTION_QUERIES.ORDER_UPDATES,
    onData: onUpdate,
    onError: (error) => {
      console.error('Order subscription error:', error);
    },
  });
}
