// Simple logger for GraphQL resolvers
export const logger = {
  info: (message: string, data?: any, category?: string) => {
    console.log(`[${category || 'INFO'}] ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message: string, error: any, category?: string) => {
    console.error(`[${category || 'ERROR'}] ${message}`, error);
  },
  debug: (message: string, data?: any, category?: string) => {
    // Debug logs disabled
    // if (process.env.NODE_ENV === 'development') {
    //   console.debug(`[${category || 'DEBUG'}] ${message}`, data ? JSON.stringify(data) : '');
    // }
  }
};
