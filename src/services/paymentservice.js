// src/services/payment.service.js
import { PagamentoModel } from '../models/pagamentoModel';
import { ENV } from '../config/env';
import { ApiService } from './api.service';
import { initMercadoPago } from '@mercadopago/sdk-react';

// Inicializar Mercado Pago ao carregar o módulo
if (ENV.MERCADO_PAGO_PUBLIC_KEY && ENV.isMercadoPagoConfigured()) {
  initMercadoPago(ENV.MERCADO_PAGO_PUBLIC_KEY, {
    locale: 'pt-BR'
  });
  console.log('✅ Mercado Pago inicializado');
} else {
  console.log('ℹ️ Mercado Pago não configurado - usando PIX/Cartão/Dinheiro');
}

export const PaymentService = {
  async processarPagamento({ 
    pedidoId, 
    formaPagamento, 
    valor, 
    dadosCartao = null,
    usuarioLogado,
    carrinho = [],
    tipoEntrega = 'Entrega'
  }) {
    try {
      const pagamento = {
        pedido_id: pedidoId,
        forma_pagamento: formaPagamento,
        valor: valor,
        valor_desconto: formaPagamento === 'PIX' ? valor * 0.05 : 0,
        itens: carrinho,
        tipo_entrega: tipoEntrega
      };

      switch (formaPagamento) {
        case 'PIX':
          return await this._processarPIX(pagamento, usuarioLogado);
        case 'Cartão':
          return await this._processarCartao(pagamento, dadosCartao);
        case 'Dinheiro':
          return await this._processarDinheiro(pagamento, valor);
        case 'Mercado Pago':
          return await this._processarMercadoPago(pagamento, usuarioLogado);
        default:
          throw new Error('Forma de pagamento inválida');
      }
    } catch (error) {
      console.error('Erro no processamento:', error);
      throw error;
    }
  },

  async _processarPIX(pagamento, usuarioLogado) {
    const chavePIX = ENV.PIX_KEY;
    const txid = pagamento.pedido_id ? 
      pagamento.pedido_id.substring(0, 8).toUpperCase() : 'FDEXP001';
    
    const pixCode = this._gerarPixCode({
      chave: chavePIX,
      valor: pagamento.valor - pagamento.valor_desconto,
      txid: txid,
      nome: 'FoodExpress Delivery',
      cidade: 'SAO PAULO'
    });

    const qrcodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}&margin=10&bgcolor=FFFFFF&color=000000`;

    const pagamentoCriado = await PagamentoModel.criar({
      ...pagamento,
      extras: {
        pix_copia_cola: pixCode,
        pix_qrcode_url: qrcodeUrl,
        pix_expiracao: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        ambiente: ENV.IS_DEV ? 'desenvolvimento' : 'producao'
      }
    });

    if (usuarioLogado?.email) {
      try {
        await ApiService.enviarNotificacao({
          email: usuarioLogado.email,
          nome: usuarioLogado.nome,
          pedidoId: pagamento.pedido_id,
          tipo: 'pix_gerado',
          valor: pagamento.valor - pagamento.valor_desconto,
          expiracao: '30 minutos'
        });
      } catch (notifError) {
        console.warn('Não foi possível enviar notificação PIX:', notifError);
      }
    }

    return {
      sucesso: true,
      pagamento: pagamentoCriado,
      pixCode,
      qrcodeUrl,
      expiracao: 30 * 60
    };
  },

  async _processarCartao(pagamento, dadosCartao) {
    if (!dadosCartao || !this._validarCartao(dadosCartao)) {
      throw new Error('Dados do cartão inválidos');
    }

    const aprovado = Math.random() > 0.1;

    if (!aprovado) {
      const pagamentoCriado = await PagamentoModel.criar({
        ...pagamento,
        status: 'recusado',
        extras: { motivo_recusa: 'Cartão sem limite disponível' }
      });

      return {
        sucesso: false,
        mensagem: 'Pagamento recusado. Verifique os dados do cartão.',
        pagamento: pagamentoCriado
      };
    }

    const pagamentoCriado = await PagamentoModel.criar({
      ...pagamento,
      status: 'confirmado',
      extras: {
        cartao_ultimos_digitos: dadosCartao.numero.slice(-4),
        cartao_bandeira: this._detectarBandeira(dadosCartao.numero),
        cartao_nome: dadosCartao.nome
      }
    });

    return {
      sucesso: true,
      pagamento: pagamentoCriado
    };
  },

  async _processarDinheiro(pagamento, valorTotal) {
    const pagamentoCriado = await PagamentoModel.criar({
      ...pagamento,
      status: 'confirmado',
      extras: {
        dinheiro_troco_para: Math.ceil(valorTotal / 10) * 10
      }
    });

    return {
      sucesso: true,
      pagamento: pagamentoCriado
    };
  },

  async _processarMercadoPago(pagamento, usuarioLogado) {
    try {
      if (!ENV.isMercadoPagoConfigured()) {
        console.log('⚠️ Mercado Pago não configurado, usando fallback PIX');
        return await this._processarPIX(pagamento, usuarioLogado);
      }

      console.log('🔄 Criando preferência no Mercado Pago...');
      
      const preferencia = await ApiService.criarPreferenciaMP({
        carrinho: pagamento.itens || [],
        tipoEntrega: pagamento.tipo_entrega || 'Entrega',
        usuarioLogado: usuarioLogado
      });

      console.log('✅ Preferência criada:', preferencia.preferenceId);

      // 🔴 Corrigido: Fallback duplo para o link de pagamento
      const linkPagamento = preferencia.initPoint ?? preferencia.sandboxInitPoint;

      const pagamentoCriado = await PagamentoModel.criar({
        ...pagamento,
        status: 'pendente',
        extras: {
          gateway: 'mercadopago',
          preference_id: preferencia.preferenceId,
          init_point: linkPagamento // Usa a variável com fallback
        }
      });

      return {
        sucesso: true,
        pagamento: pagamentoCriado,
        preferenceId: preferencia.preferenceId,
        initPoint: linkPagamento, // Retorna a variável com fallback
        aguardandoConfirmacao: true
      };
    } catch (error) {
      console.error('❌ Erro no Mercado Pago:', error);
      console.warn('🔄 Usando PIX como fallback');
      return await this._processarPIX(pagamento, usuarioLogado);
    }
  },

  _gerarPixCode({ chave, valor, txid, nome, cidade = 'SAO PAULO' }) {
    const valorFormatado = Number(valor).toFixed(2);
    const gui = 'BR.GOV.BCB.PIX';
    const chaveFormatada = `01${String(chave.length).padStart(2, '0')}${chave}`;
    const merchantInfo = `0014${gui}${chaveFormatada}`;
    const txidFormatado = `05${String(txid.length).padStart(2, '0')}${txid}`;
    
    const payload = [
      '00020126',
      `26${String(merchantInfo.length).padStart(2, '0')}${merchantInfo}`,
      '52040000',
      '5303986',
      `54${String(valorFormatado.length).padStart(2, '0')}${valorFormatado}`,
      '5802BR',
      `59${String(nome.length).padStart(2, '0')}${nome}`,
      `60${String(cidade.length).padStart(2, '0')}${cidade}`,
      `62${String(txidFormatado.length).padStart(2, '0')}${txidFormatado}`,
      '6304'
    ].join('');
    
    const crc = this._calculateCRC16(payload);
    return `${payload}${crc}`;
  },

  _calculateCRC16(payload) {
    const polinomio = 0x1021;
    let crc = 0xFFFF;
    
    for (let i = 0; i < payload.length; i++) {
      crc ^= (payload.charCodeAt(i) << 8);
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = ((crc << 1) ^ polinomio) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    
    return crc.toString(16).toUpperCase().padStart(4, '0');
  },

  _validarCartao(dados) {
    if (!dados) return false;
    
    const { numero, validade, cvv, nome } = dados;
    
    if (!numero || numero.replace(/\s/g, '').length < 13) return false;
    if (!validade || !/^\d{2}\/\d{2}$/.test(validade)) return false;
    if (!cvv || cvv.length < 3) return false;
    if (!nome || nome.trim().length < 3) return false;
    
    const [mes, ano] = validade.split('/');
    const hoje = new Date();
    const anoAtual = hoje.getFullYear() % 100;
    const mesAtual = hoje.getMonth() + 1;
    
    if (parseInt(ano) < anoAtual || 
        (parseInt(ano) === anoAtual && parseInt(mes) < mesAtual)) {
      return false;
    }
    
    return this._luhnCheck(numero.replace(/\s/g, ''));
  },

  _luhnCheck(numero) {
    if (!numero) return false;
    
    let sum = 0;
    let alternate = false;
    
    for (let i = numero.length - 1; i >= 0; i--) {
      let digit = parseInt(numero.charAt(i), 10);
      if (isNaN(digit)) return false;
      
      if (alternate) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      alternate = !alternate;
    }
    
    return sum % 10 === 0;
  },

  _detectarBandeira(numero) {
    if (!numero) return 'Desconhecida';
    
    const num = numero.replace(/\s/g, '');
    
    if (/^4/.test(num)) return 'Visa';
    if (/^5[1-5]/.test(num)) return 'Mastercard';
    if (/^3[47]/.test(num)) return 'American Express';
    if (/^(4011|4312|4389)/.test(num)) return 'Elo';
    if (/^6062/.test(num)) return 'Hipercard';
    if (/^(6362|6370|6371)/.test(num)) return 'Hipercard';
    
    return 'Desconhecida';
  }
};