import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

const Ctx = createContext({ data: null, error: null });

export function CatalogProvider({ children }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => { api.get('/catalog').then(setData).catch((e) => setError(e.message)); }, []);
  return <Ctx.Provider value={{ data, error, reload: () => api.get('/catalog').then(setData) }}>{children}</Ctx.Provider>;
}
export const useCatalog = () => useContext(Ctx);
