// Temporarily disabled Apollo Client imports to fix build issues
// import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
// import { setContext } from '@apollo/client/link/context';
// import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
// import { createClient } from 'graphql-ws';
// import { getMainDefinition } from '@apollo/client/utilities';

// Temporarily disabled all Apollo Client configuration to fix build issues
// TODO: Re-enable once import issues are resolved

/*
// Get the base URL from environment or use localhost for development
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin
    return window.location.origin;
  }
  // Server-side: use environment variable or default
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
};

const getWebSocketUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin with wss for HTTPS or ws for HTTP
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
  // Server-side: use environment variable or default
  const protocol = process.env.NODE_ENV === 'production' ? 'wss:' : 'ws:';
  return `${protocol}//${process.env.NEXT_PUBLIC_WS_HOST || 'localhost:4000'}`;
};

// HTTP link for queries and mutations
const httpLink = createHttpLink({
  uri: `${getBaseUrl()}/graphql`,
  credentials: 'include', // Include cookies for authentication
});

// WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(createClient({
  url: `${getWebSocketUrl()}/graphql-ws`,
  connectionParams: () => {
    // Get auth token from cookie if available
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];
    
    return {
      authorization: token ? `Bearer ${token}` : '',
    };
  },
  // Handle connection errors
  on: {
    error: (error) => {
      console.error('WebSocket connection error:', error);
    },
    closed: (event) => {
      console.log('WebSocket connection closed:', event);
    },
  },
}));

// Auth link to add authentication headers
const authLink = setContext((_, { headers }) => {
  // Get auth token from cookie if available
  const token = typeof document !== 'undefined' 
    ? document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1]
    : null;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Split link to use WebSocket for subscriptions and HTTP for queries/mutations
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink)
);
*/

// Temporarily disabled Apollo Client creation to fix build issues
// TODO: Re-enable once import issues are resolved

// Placeholder export
export const apolloClient = null as any;
export default apolloClient;
