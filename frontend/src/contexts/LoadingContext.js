import React, { createContext, useState, useContext, useMemo } from 'react';

const LoadingContext = createContext();

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Yükleniyor...'); // Opsiyonel mesaj

  const showLoading = (message = 'Yükleniyor...') => {
    setLoadingMessage(message);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
    setLoadingMessage('Yükleniyor...'); // Mesajı sıfırla
  };

  // useMemo, gereksiz render'ları önlemek için kullanılır
  const value = useMemo(() => ({
    isLoading,
    loadingMessage,
    showLoading,
    hideLoading
  }), [isLoading, loadingMessage]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}; 