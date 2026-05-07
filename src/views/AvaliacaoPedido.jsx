import React, { useState, useEffect } from 'react';
import { Star, X, CheckCircle2 } from 'lucide-react';
import { AvaliacaoModel } from '../models/avaliacaoModel';

const TAGS = ['Sabor', 'Tempo de entrega', 'Embalagem', 'Preço', 'Atendimento', 'Porção'];

export default function AvaliacaoPedido({ pedido, usuarioLogado, onFechar }) {
  const [nota, setNota] = useState(0);
  const [hover, setHover] = useState(0);
  const [tagsSelecionadas, setTagsSelecionadas] = useState([]);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [avaliacaoExistente, setAvaliacaoExistente] = useState(null);

  useEffect(() => {
    AvaliacaoModel.buscarPorPedido(pedido.id).then(av => {
      if (av) {
        setAvaliacaoExistente(av);
        setNota(av.nota);
        setTagsSelecionadas(av.tags || []);
        setComentario(av.comentario || '');
        setEnviado(true);
      }
    });
  }, [pedido.id]);

  const toggleTag = (tag) => {
    setTagsSelecionadas(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleEnviar = async () => {
    if (nota === 0) return alert('Selecione uma nota antes de enviar.');
    setLoading(true);
    try {
      await AvaliacaoModel.criar({
        pedido_id: pedido.id,
        cliente_id: usuarioLogado?.id,
        restaurante_id: pedido.restaurante_id,
        nota,
        tags: tagsSelecionadas,
        comentario: comentario.trim() || null,
      });
      setEnviado(true);
    } catch (err) {
      alert(`Erro ao enviar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const labelNota = ['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'];

  return (
    <>
      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div
        onClick={onFechar}
        style={{
          position: 'fixed', inset: 0, zIndex: 80,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'white', borderRadius: 20, width: '100%', maxWidth: 420,
            padding: '28px 28px 24px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
            animation: 'fadeInModal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>🍔</div>
              <div>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 16, color: '#1a1a1a', margin: 0 }}>
                  {enviado ? 'Sua avaliação' : 'Avalie seu pedido'}
                </p>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                  #{String(pedido.id).slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
            <button
              onClick={onFechar}
              style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={15} color="#6b7280" />
            </button>
          </div>

          {enviado ? (
            /* Estado: avaliação enviada */
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <CheckCircle2 size={48} color="#50A773" style={{ marginBottom: 12 }} />
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 18, color: '#1a1a1a', marginBottom: 8 }}>
                Obrigado pelo feedback!
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 14 }}>
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={24} fill={i <= nota ? '#EF9F27' : 'none'} color={i <= nota ? '#EF9F27' : '#d1d5db'} />
                ))}
              </div>

              {tagsSelecionadas.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
                  {tagsSelecionadas.map(t => (
                    <span key={t} style={{
                      fontSize: 12, padding: '3px 10px', borderRadius: 999,
                      background: '#FFF0F0', color: '#C8101E', border: '1px solid #EA1D2C',
                    }}>{t}</span>
                  ))}
                </div>
              )}

              {comentario && (
                <p style={{
                  fontSize: 13, color: '#6b7280', background: '#f9fafb',
                  borderRadius: 10, padding: '10px 14px', textAlign: 'left',
                  fontStyle: 'italic', margin: '0 0 16px',
                }}>"{comentario}"</p>
              )}

              <button
                onClick={onFechar}
                style={{
                  width: '100%', padding: 12, borderRadius: 12, border: 'none',
                  background: '#EA1D2C', color: '#fff',
                  fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                }}
              >
                Fechar
              </button>
            </div>
          ) : (
            /* Estado: formulário */
            <>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>Como foi sua experiência?</p>

              {/* Estrelas */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                {[1,2,3,4,5].map(i => (
                  <Star
                    key={i}
                    size={32}
                    style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
                    fill={(hover || nota) >= i ? '#EF9F27' : 'none'}
                    color={(hover || nota) >= i ? '#EF9F27' : '#d1d5db'}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setNota(i)}
                  />
                ))}
                {(hover || nota) > 0 && (
                  <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 4 }}>
                    {labelNota[hover || nota]}
                  </span>
                )}
              </div>

              {/* Tags */}
              <p style={{ fontSize: 13, color: '#6b7280', margin: '16px 0 8px' }}>O que mais gostou?</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {TAGS.map(tag => {
                  const ativo = tagsSelecionadas.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      style={{
                        fontSize: 12, padding: '5px 12px', borderRadius: 999, cursor: 'pointer',
                        border: `1.5px solid ${ativo ? '#EA1D2C' : '#e5e7eb'}`,
                        background: ativo ? '#FFF0F0' : '#f9fafb',
                        color: ativo ? '#C8101E' : '#6b7280',
                        fontFamily: 'DM Sans, sans-serif', fontWeight: ativo ? 700 : 500,
                        transition: 'all 0.15s',
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Comentário */}
              <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 6px' }}>
                Comentário <span style={{ color: '#d1d5db' }}>(opcional)</span>
              </p>
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="Conte como foi sua experiência..."
                maxLength={300}
                style={{
                  width: '100%', boxSizing: 'border-box', height: 80, resize: 'none',
                  borderRadius: 12, border: '1.5px solid #e5e7eb', padding: '10px 12px',
                  fontSize: 13, fontFamily: 'DM Sans, sans-serif', color: '#1f2937',
                  outline: 'none', background: '#f9fafb',
                }}
                onFocus={e => { e.target.style.borderColor = '#EA1D2C'; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
              />
              <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'right', margin: '4px 0 16px' }}>
                {comentario.length}/300
              </p>

              <button
                onClick={handleEnviar}
                disabled={loading || nota === 0}
                style={{
                  width: '100%', padding: 14, borderRadius: 12, border: 'none',
                  background: nota === 0 ? '#f3f4f6' : 'linear-gradient(135deg, #EA1D2C, #C8101E)',
                  color: nota === 0 ? '#9ca3af' : '#fff',
                  fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15,
                  cursor: nota === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: nota > 0 ? '0 4px 12px rgba(234,29,44,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? 'Enviando...' : 'Enviar avaliação'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}