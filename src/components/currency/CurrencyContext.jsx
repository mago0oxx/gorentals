import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};

// Exchange rates (actualizar periódicamente)
const EXCHANGE_RATES = {
  USD: 1,
  ARS: 1000  // 1 USD = ~1000 ARS (aproximado)
};

// Price ranges by currency
const PRICE_RANGES = {
  USD: { min: 0, max: 500, step: 10 },
  ARS: { min: 0, max: 500000, step: 10000 }
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('currency') || 'USD';
  });

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const formatPrice = (amount, options = {}) => {
    if (!amount && amount !== 0) return '-';
    
    const { 
      showSymbol = true, 
      decimals = 2,
      compact = false 
    } = options;
    
    const convertedAmount = amount * EXCHANGE_RATES[currency];
    
    if (compact && convertedAmount >= 1000) {
      const formatted = (convertedAmount / 1000).toFixed(1);
      return showSymbol 
        ? `${getCurrencySymbol()}${formatted}K` 
        : `${formatted}K`;
    }
    
    const formatted = convertedAmount.toFixed(decimals);
    const symbol = getCurrencySymbol();
    
    if (currency === 'ARS') {
      // Format with thousands separator for ARS
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return showSymbol ? `${symbol}${parts.join(',')}` : parts.join(',');
    }
    
    return showSymbol ? `${symbol}${formatted}` : formatted;
  };

  const getCurrencySymbol = () => {
    return currency === 'ARS' ? '$' : '$';
  };

  const getCurrencyCode = () => currency;

  const convertPrice = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    const usdAmount = amount / EXCHANGE_RATES[fromCurrency];
    return usdAmount * EXCHANGE_RATES[toCurrency];
  };

  const getPriceRange = () => PRICE_RANGES[currency];

  const setSuggestedCurrency = (branchCity) => {
    const suggestedCurrency = branchCity === 'Buenos Aires' ? 'ARS' : 'USD';
    if (suggestedCurrency !== currency) {
      setCurrency(suggestedCurrency);
    }
  };

  return (
    <CurrencyContext.Provider 
      value={{ 
        currency, 
        setCurrency, 
        formatPrice, 
        getCurrencySymbol,
        getCurrencyCode,
        convertPrice,
        getPriceRange,
        setSuggestedCurrency,
        exchangeRates: EXCHANGE_RATES
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};