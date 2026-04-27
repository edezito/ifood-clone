// services/payment.service.js
import { PagamentoModel } from '../models/pagamentoModel';
import { PedidoModel } from '../models/pedidoModel';
import { ClienteModel } from '../models/clienteModel';

export const PaymentService = {
  /**
   * Processa pagamento de acordo com a forma escolhida
   */
  async processarPagamento({ 
    pedidoId, 
    formaPagamento, 
    valor, 
    dadosCartao = null,
    usuarioLogado 
  }) {
    try {
      const pagamento = {
        pedido_id: pedidoId,
        forma_pagamento: formaPagamento,
        valor: valor,
        valor_desconto: formaPagamento === 'PIX' ? valor * 0.05 : 0
      };

      switch (formaPagamento) {
        case 'PIX':
          return await this._processarPIX(pagamento);
        
        case 'Cartão':
          return await this._processarCartao(pagamento, dadosCartao);
        
        case 'Dinheiro':
          return await this._processarDinheiro(pagamento, valor);
        
        default:
          throw new Error('Forma de pagamento inválida');
      }
    } catch (error) {
      console.error('Erro no processamento:', error);
      throw error;
    }
  },

  /**
   * Gera código PIX simulado (em produção, integrar com API de PIX)
   */
  async _processarPIX(pagamento) {
    const chavePIX = process.env.PIX_KEY || 'foodexpress@seudominio.com.br';
    const txid = pagamento.pedido_id.substring(0, 8).toUpperCase();
    
    // Gerar código PIX copia-e-cola (formato EMV)
    const pixCode = this._gerarPixCode({
      chave: chavePIX,
      valor: pagamento.valor - pagamento.valor_desconto,
      txid: txid,
      nome: 'FoodExpress Delivery'
    });

    // Gerar QR Code via API gratuita
    const qrcodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}&margin=10`;

    // Criar registro de pagamento
    const pagamentoCriado = await PagamentoModel.criar({
      ...pagamento,
      extras: {
        pix_copia_cola: pixCode,
        pix_qrcode_url: qrcodeUrl,
        pix_expiracao: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min
      }
    });

    return {
      sucesso: true,
      pagamento: pagamentoCriado,
      pixCode,
      qrcodeUrl,
      expiracao: 30 * 60 // 30 minutos em segundos
    };
  },

  /**
   * Valida e registra pagamento com cartão
   */
  async _processarCartao(pagamento, dadosCartao) {
    // Validar dados do cartão
    if (!this._validarCartao(dadosCartao)) {
      throw new Error('Dados do cartão inválidos');
    }

    // Em produção: integrar com gateway de pagamento
    // Simulação de aprovação (90% de chance)
    const aprovado = Math.random() > 0.1;

    if (!aprovado) {
      const pagamentoCriado = await PagamentoModel.criar({
        ...pagamento,
        status: 'recusado',
        extras: {
          motivo_recusa: 'Cartão sem limite disponível'
        }
      });

      return {
        sucesso: false,
        mensagem: 'Pagamento recusado. Verifique os dados do cartão.',
        pagamento: pagamentoCriado
      };
    }

    // Criar pagamento aprovado
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

  /**
   * Registra pagamento em dinheiro
   */
  async _processarDinheiro(pagamento, valorTotal) {
    const pagamentoCriado = await PagamentoModel.criar({
      ...pagamento,
      status: 'confirmado',
      extras: {
        dinheiro_troco_para: Math.ceil(valorTotal / 10) * 10 // Arredonda pra cima
      }
    });

    return {
      sucesso: true,
      pagamento: pagamentoCriado
    };
  },

  /**
   * Gera código PIX (formato EMV simplificado)
   */
  _gerarPixCode({ chave, valor, txid, nome }) {
    const valorFormatado = Number(valor).toFixed(2);
    
    // Estrutura simplificada do PIX
    const merchantAccountInfo = [
      '0014BR.GOV.BCB.PIX',
      `01${String(chave.length).padStart(2, '0')}${chave}`
    ].join('');
    
    const payload = [
      '00020126',                                    // Payload Format Indicator
      String(merchantAccountInfo.length).padStart(2, '0'),
      merchantAccountInfo,
      '52040000',                                     // Merchant Category Code
      '5303986',                                      // Currency (986 = BRL)
      `54${String(valorFormatado.length).padStart(2, '0')}${valorFormatado}`,
      '5802BR',                                       // Country Code
      `59${String(nome.length).padStart(2, '0')}${nome}`,
      '6008BRASILIA',                                 // City
      `62${String(10 + txid.length).padStart(2, '0')}05${txid}`,
      '6304'                                          // CRC16 placeholder
    ].join('');
    
    // CRC16 calculation (simplificado)
    const crc = this._calculateCRC16(payload);
    
    return payload.replace('6304', `6304${crc}`);
  },

  _calculateCRC16(payload) {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  },

  _validarCartao(dados) {
    const { numero, validade, cvv } = dados;
    
    // Validação básica
    if (!numero || numero.replace(/\s/g, '').length < 13) return false;
    if (!validade || !/^\d{2}\/\d{2}$/.test(validade)) return false;
    if (!cvv || cvv.length < 3) return false;
    
    // Validar algoritmo de Luhn
    return this._luhnCheck(numero.replace(/\s/g, ''));
  },

  _luhnCheck(numero) {
    let sum = 0;
    let alternate = false;
    for (let i = numero.length - 1; i >= 0; i--) {
      let digit = parseInt(numero.charAt(i), 10);
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
    const num = numero.replace(/\s/g, '');
    
    if (/^4/.test(num)) return 'Visa';
    if (/^5[1-5]/.test(num)) return 'Mastercard';
    if (/^3[47]/.test(num)) return 'American Express';
    if (/^(4011|4312|4389)/.test(num)) return 'Elo';
    if (/^6062/.test(num)) return 'Hipercard';
    
    return 'Desconhecida';
  }
};