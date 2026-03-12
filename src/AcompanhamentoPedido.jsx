import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; // ou './firebase' se alterou o nome do ficheiro

function AcompanhamentoPedido({ pedidoId, onVoltarAoMenu }) {
  const [pedido, setPedido] = useState(null);

  useEffect(() => {
    // 1. Ir buscar o estado inicial do pedido
    const fetchPedido = async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single();
      
      if (data) setPedido(data);
    };
    
    fetchPedido();

    // 2. A MÁGICA: Subscrever às mudanças em Tempo Real
    const subscription = supabase
      .channel(`escutar-pedido-${pedidoId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `id=eq.${pedidoId}` // Ouve apenas o pedido deste cliente
        },
        (payload) => {
          console.log('O estado do pedido mudou!', payload.new);
          setPedido(payload.new); // Atualiza o ecrã instantaneamente
        }
      )
      .subscribe();

    // Limpar a subscrição quando o cliente sair deste ecrã
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [pedidoId]);

  if (!pedido) return <div style={{ padding: '40px', textAlign: 'center' }}>A carregar o seu pedido... ⏳</div>;

  // Função auxiliar para saber qual a cor da barra de progresso
  const getProgresso = () => {
    switch (pedido.status) {
      case 'Aguardando': return '25%';
      case 'Em Preparação': return '50%';
      case 'Em Trânsito': return '75%';
      case 'Entregue': return '100%';
      default: return '0%';
    }
  };

  return (
    <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h2 style={{ textAlign: 'center', color: '#0f172a' }}>Acompanhar Pedido</h2>
      <p style={{ textAlign: 'center', color: '#64748b' }}>Pedido #{pedido.id.split('-')[0]}</p>

      {/* Barra de Progresso Visual */}
      <div style={{ background: '#f1f5f9', height: '8px', borderRadius: '4px', margin: '30px 0', overflow: 'hidden' }}>
        <div style={{ width: getProgresso(), background: '#10b981', height: '100%', transition: 'width 1s ease-in-out' }}></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
        <StatusItem texto="1. Aguardando confirmação" ativo={true} />
        <StatusItem texto="2. Em Preparação" ativo={pedido.status === 'Em Preparação' || pedido.status === 'Em Trânsito' || pedido.status === 'Entregue'} />
        <StatusItem texto="3. Em Trânsito (A caminho!)" ativo={pedido.status === 'Em Trânsito' || pedido.status === 'Entregue'} />
        <StatusItem texto="4. Entregue" ativo={pedido.status === 'Entregue'} />
      </div>

      {/* BLOCO DE SEGURANÇA: Só aparece quando está em trânsito */}
      {pedido.status === 'Em Trânsito' && (
        <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '12px', border: '2px dashed #f59e0b', textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ margin: '0 0 10px 0', color: '#92400e', fontWeight: 'bold' }}>⚠️ O estafeta está a chegar!</p>
          <p style={{ margin: '0 0 10px 0', color: '#b45309', fontSize: '0.9rem' }}>Forneça este PIN ao estafeta para receber o seu pedido.</p>
          <h1 style={{ margin: 0, color: '#d97706', fontSize: '3rem', letterSpacing: '8px' }}>
            {pedido.pin_entrega}
          </h1>
        </div>
      )}

      {pedido.status === 'Entregue' && (
        <div style={{ background: '#d1fae5', padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '20px', color: '#065f46', fontWeight: 'bold' }}>
          🎉 Pedido entregue com sucesso! Bom apetite.
        </div>
      )}

      <button onClick={onVoltarAoMenu} style={{ width: '100%', padding: '15px', background: '#f8fafc', border: '1px solid #cbd5e0', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', color: '#334155' }}>
        Voltar ao Menu
      </button>
    </div>
  );
}

// Subcomponente para as linhas de estado ficarem bonitas
function StatusItem({ texto, ativo }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: ativo ? '#0f172a' : '#cbd5e0', fontWeight: ativo ? 'bold' : 'normal' }}>
      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: ativo ? '#10b981' : '#e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {ativo && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
      </div>
      <span>{texto}</span>
    </div>
  );
}

export default AcompanhamentoPedido;