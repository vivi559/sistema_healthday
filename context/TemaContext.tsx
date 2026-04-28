/**
 * context/TemaContext.tsx   ← salve nesta pasta: app/context/TemaContext.tsx
 * Basta envolver o layout raiz com <TemaProvider> e usar useTema() em qualquer tela.
 */

import { getTema, salvarTema } from '@/constants/Storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type TemaContextType = {
  temaDark: boolean;
  setTemaDark: (valor: boolean) => Promise<void>;
};

const TemaContext = createContext<TemaContextType>({
  temaDark: false,
  setTemaDark: async () => {},
});

export function TemaProvider({ children }: { children: ReactNode }) {
  const [temaDark, _setTemaDark] = useState(false);

  // Carrega preferência salva ao iniciar
  useEffect(() => {
    getTema().then(_setTemaDark);
  }, []);

  // Atualiza estado + persiste no storage
  async function setTemaDark(valor: boolean) {
    _setTemaDark(valor);
    await salvarTema(valor);
  }

  return (
    <TemaContext.Provider value={{ temaDark, setTemaDark }}>
      {children}
    </TemaContext.Provider>
  );
}

/** Hook para consumir o tema em qualquer tela */
export function useTema() {
  return useContext(TemaContext);
}