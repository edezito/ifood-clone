// ============================================================
// CONTEXT: CestaContext
// Responsabilidade: Estado global do carrinho e persistência
// ============================================================
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';

export const CestaContext = createContext({});

const CESTA_STORAGE_KEY = '@SeuApp:cesta';

export function CestaProvider({ children }) {
  // Inicializa pegando do LocalStorage
  const [itens, setItens] = useState(() => {
    try {
      const dadosSalvos = localStorage.getItem(CESTA_STORAGE_KEY);
      return dadosSalvos ? JSON.parse(dadosSalvos) : [];
    } catch {
      return [];
    }
  });

  // Salva no LocalStorage sempre que houver alteração
  useEffect(() => {
    localStorage.setItem(CESTA_STORAGE_KEY, JSON.stringify(itens));
  }, [itens]);

  // Função central para alterar quantidade
  const alterarQuantidade = useCallback((produtoId, delta) => {
    setItens(itensAtuais => {
      return itensAtuais.map(item => {
        if (item.produto.id === produtoId) {
          return { ...item, quantidade: item.quantidade + delta };
        }
        return item;
      }).filter(item => item.quantidade > 0); // Remove se for 0
    });
  }, []);

  const adicionarItem = useCallback((produto, quantidade = 1) => {
    setItens(itensAtuais => {
      const itemExistente = itensAtuais.find(i => i.produto.id === produto.id);
      if (itemExistente) {
        return itensAtuais.map(i => 
          i.produto.id === produto.id 
            ? { ...i, quantidade: i.quantidade + quantidade }
            : i
        );
      }
      return [...itensAtuais, { produto, quantidade }];
    });
  }, []);

  const limparCesta = useCallback(() => {
    setItens([]);
  }, []);

  // Calcula totais automaticamente
  const totais = useMemo(() => {
    return itens.reduce((acc, item) => ({
      quantidadeTotal: acc.quantidadeTotal + item.quantidade,
      subtotal: acc.subtotal + (item.produto.preco * item.quantidade)
    }), { quantidadeTotal: 0, subtotal: 0 });
  }, [itens]);

  const valorContexto = {
    itens,
    ...totais,
    adicionarItem,
    alterarQuantidade,
    aumentarQuantidade: (id) => alterarQuantidade(id, 1),
    diminuirQuantidade: (id) => alterarQuantidade(id, -1),
    limparCesta
  };

  return (
    <CestaContext.Provider value={valorContexto}>
      {children}
    </CestaContext.Provider>
  );
}