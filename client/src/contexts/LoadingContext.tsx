import React, { createContext, useContext, useState } from 'react';

interface LoadingContextType {
  loading: boolean;
  message: string;
  setLoading: (loading: boolean, message?: string) => void;
}

const LoadingContext = createContext<LoadingContextType>({
  loading: false,
  message: '',
  setLoading: () => {}
});

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: React.ReactNode;
}

export const LoadingProvider = ({ children }: LoadingProviderProps) => {
  const [loading, setLoadingState] = useState(false);
  const [message, setMessage] = useState('');

  const setLoading = (loading: boolean, message = 'Please wait...') => {
    setLoadingState(loading);
    setMessage(message);
  };

  return (
    <LoadingContext.Provider value={{ loading, message, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};