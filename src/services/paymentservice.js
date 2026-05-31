import { PagamentoModel } from '../models/pagamentoModel';
import { ENV } from '../config/env';
import { ApiService } from './api.service';
import { initMercadoPago } from '@mercadopago/sdk-react';

if (ENV.MERCADO_PAGO_PUBLIC_KEY && ENV.isMercadoPagoConfigured()) {
  initMercadoPago(ENV.MERCADO_PAGO_PUBLIC_KEY, { locale: 'pt-BR' });
  console.log('✅ Mercado Pago inicializado');
} else {
  console.log('⚠️ Mercado Pago não configurado');
}

export const PaymentService = {
  async processarPagamento({ 
    pedidoId, 
    formaPagamento, 
    valor, 
    usuarioLogado,
    carrinho = [],
    tipoEntrega = 'Entrega',
    taxaFrete = 0
  }) {
    try {
      console.log('🔍 PaymentService.processarPagamento recebeu:', {
        pedidoId,
        formaPagamento,
        valor,
        tipoEntrega,
        taxaFrete,
        carrinhoLength: carrinho?.length
      });

      const pagamento = {
        pedido_id: pedidoId,
        forma_pagamento: formaPagamento,
        valor: valor,
        valor_desconto: 0,
        itens: carrinho,
        tipo_entrega: tipoEntrega,
        taxa_frete: taxaFrete
      };

      console.log('📦 Objeto pagamento criado:', pagamento);

      switch (formaPagamento) {
        case 'Mercado Pago':
          return await this._processarMercadoPago(pagamento, usuarioLogado);
        case 'Dinheiro':
          return await this._processarDinheiro(pagamento, valor);
        case 'Cartão':
          return await this._processarCartaoPresencial(pagamento);
        default:
          throw new Error(`Forma de pagamento inválida: ${formaPagamento}`);
      }
    } catch (error) {
      console.error('❌ Erro no processamento:', error);
      throw error;
    }
  },

  async _processarCartaoPresencial(pagamento) {
    const pagamentoCriado = await PagamentoModel.criar({ ...pagamento, status: 'confirmado' });
    return { sucesso: true, pagamento: pagamentoCriado };
  },

  async _processarDinheiro(pagamento, valorTotal) {
    const pagamentoCriado = await PagamentoModel.criar({
      ...pagamento,
      status: 'confirmado',
      extras: { dinheiro_troco_para: Math.ceil(valorTotal / 10) * 10 }
    });
    return { sucesso: true, pagamento: pagamentoCriado };
  },

  async _processarMercadoPago(pagamento, usuarioLogado) {
    try {
      if (!ENV.isMercadoPagoConfigured()) {
        throw new Error('Mercado Pago não está configurado.');
      }

      console.log('🔄 Criando preferência no Mercado Pago...');
      console.log('📦 Dados enviados para API:', {
        carrinho: pagamento.itens?.length,
        tipoEntrega: pagamento.tipo_entrega,
        taxaFrete: pagamento.taxa_frete,
        pedidoId: pagamento.pedido_id
      });
      
      const preferencia = await ApiService.criarPreferenciaMP({
        carrinho: pagamento.itens || [],
        tipoEntrega: pagamento.tipo_entrega || 'Entrega',
        taxaFrete: pagamento.taxa_frete,
        usuarioLogado: usuarioLogado,
        pedidoId: pagamento.pedido_id
      });

      console.log('✅ Preferência criada:', preferencia.preferenceId);
      console.log('Link de pagamento:', preferencia.initPoint);

      const linkPagamento = preferencia.initPoint ?? preferencia.sandboxInitPoint;

      const pagamentoCriado = await PagamentoModel.criar({
        ...pagamento,
        status: 'pendente',
        extras: {
          gateway: 'mercadopago',
          preference_id: preferencia.preferenceId,
          init_point: linkPagamento
        }
      });

      return {
        sucesso: true,
        pagamento: pagamentoCriado,
        preferenceId: preferencia.preferenceId,
        initPoint: linkPagamento,
        aguardandoConfirmacao: true
      };
    } catch (error) {
      console.error('❌ Erro no Mercado Pago:', error);
      return { 
        sucesso: false, 
        mensagem: 'Ocorreu um erro ao conectar com o Mercado Pago. Tente novamente.' 
      };
    }
  }
};