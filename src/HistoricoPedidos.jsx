import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { ChevronLeft, Clock, CheckCircle2, ChevronRight } from 'lucide-react';

const HistoricoPedidos = ({ telefone, onVoltar, onVerDetalhes }) => {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    const fetchHistorico = async () => {
      const { data } = await supabase
        .from('pedidos')
        .select('*, restaurantes(nome)')
        .eq('telefone', telefone)
        .order('id', { ascending: false });
      if (data) setPedidos(data);
    };
    fetchHistorico();
  }, [telefone]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 pt-10">
      <button onClick={onVoltar} className="flex items-center gap-2 text-gray-600 mb-6">
        <ChevronLeft /> <span className="font-bold">Voltar</span>
      </button>

      <h2 className="text-2xl font-black mb-6">Meus Pedidos</h2>

      <div className="space-y-4">
        {pedidos.map(p => (
          <div 
            key={p.id} 
            onClick={() => onVerDetalhes(p.id)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer"
          >
            <div>
              <p className="font-bold text-gray-800">{p.restaurantes?.nome || 'Restaurante'}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>R$ {p.total.toFixed(2)}</span>
                <span>•</span>
                <span className={p.status === 'Entregue' ? 'text-green-600' : 'text-orange-500 font-bold'}>
                  {p.status}
                </span>
              </div>
            </div>
            <ChevronRight className="text-gray-300" />
          </div>
        ))}
        {pedidos.length === 0 && <p className="text-center text-gray-400">Nenhum pedido encontrado.</p>}
      </div>
    </div>
  );
};

export default HistoricoPedidos;