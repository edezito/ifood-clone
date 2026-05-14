// ============================================================
// CONTROLLER: useAdminController
// Responsabilidade: lógica do painel administrativo.
// Conecta os Models de Restaurante, Produto e Pedido
// com as Views do Admin.
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { RestauranteModel } from '../models/restauranteModel';
import { ProdutoModel } from '../models/produtoModel';
import { PedidoModel } from '../models/pedidoModel';
import NotificacaoService from '../services/Notificacaoservice';

export function useAdminController() {
  // ---- Estado de dados ----
  const [restaurantes, setRestaurantes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [pedidos, setPedidos] = useState([]);

  // ---- Estado de UI ----
  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState('info');
  const [abaAtiva, setAbaAtiva] = useState('pedidos');
  const [showFormulario, setShowFormulario] = useState(false);
  const [buscandoCoordenadas, setBuscandoCoordenadas] = useState(false);

  // ---- Estado de formulário – Restaurante ----
  const [nomeRest, setNomeRest] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [endereco, setEndereco] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [editandoRestId, setEditandoRestId] = useState(null);

  // ---- Estado de formulário – Produto ----
  const [nomeProd, setNomeProd] = useState('');
  const [preco, setPreco] = useState('');
  const [restauranteSelecionado, setRestauranteSelecionado] = useState('');
  const [editandoProdId, setEditandoProdId] = useState(null);

  // ----------------------------------------------------------
  // Carregamento inicial
  // ----------------------------------------------------------
  const carregarDados = useCallback(async () => {
    try {
      const [rests, prods, peds] = await Promise.all([
        RestauranteModel.listarTodos(),
        ProdutoModel.listarTodos(),
        PedidoModel.listarTodos(),
      ]);
      setRestaurantes(rests ?? []);
      setProdutos(prods ?? []);
      setPedidos(peds ?? []);
    } catch (err) {
      mostrarMensagem(`Erro ao carregar dados: ${err.message}`, 'error');
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // ----------------------------------------------------------
  // Helpers de UI
  // ----------------------------------------------------------
  const mostrarMensagem = (texto, tipo = 'info') => {
    setMensagem(texto);
    setTipoMensagem(tipo);
    setTimeout(() => setMensagem(''), 5000);
  };

  // ----------------------------------------------------------
  // Restaurantes
  // ----------------------------------------------------------
  const buscarCoordenadas = async () => {
    if (!endereco) return mostrarMensagem('Digite um endereço primeiro', 'error');
    setBuscandoCoordenadas(true);
    mostrarMensagem('Buscando coordenadas...', 'info');
    try {
      const coords = await RestauranteModel.buscarCoordenadas(endereco);
      if (coords) {
        setLatitude(coords.lat);
        setLongitude(coords.lng);
        mostrarMensagem(`Coordenadas: ${coords.lat}, ${coords.lng}`, 'success');
      } else {
        setLatitude('');
        setLongitude('');
        mostrarMensagem('Endereço não encontrado.', 'error');
      }
    } finally {
      setBuscandoCoordenadas(false);
    }
  };

  const salvarRestaurante = async (e) => {
    e.preventDefault();
    if (!endereco) return mostrarMensagem('Digite o endereço completo', 'error');

    let lat = latitude;
    let lng = longitude;

    if (!lat || !lng) {
      mostrarMensagem('Buscando coordenadas...', 'info');
      const coords = await RestauranteModel.buscarCoordenadas(endereco);
      if (!coords) return mostrarMensagem('Não foi possível localizar o endereço.', 'error');
      lat = coords.lat;
      lng = coords.lng;
    }

    const payload = { nome: nomeRest, cnpj, endereco, latitude: lat, longitude: lng };

    try {
      if (editandoRestId) {
        const atualizado = await RestauranteModel.atualizar(editandoRestId, payload);
        setRestaurantes((prev) => prev.map((r) => (r.id === editandoRestId ? atualizado : r)));
        mostrarMensagem('Loja atualizada!', 'success');
      } else {
        const novo = await RestauranteModel.criar(payload);
        setRestaurantes((prev) => [...prev, novo]);
        mostrarMensagem('Loja cadastrada!', 'success');
      }
      cancelarEdicaoRest();
      setShowFormulario(false);
    } catch (err) {
      mostrarMensagem(`Erro: ${err.message}`, 'error');
    }
  };

  const excluirRestaurante = async (id, nome) => {
    if (!window.confirm(`Excluir "${nome}" e TODOS os produtos? Esta ação é irreversível!`)) return;
    try {
      await RestauranteModel.excluir(id);
      setRestaurantes((prev) => prev.filter((r) => r.id !== id));
      setProdutos((prev) => prev.filter((p) => p.restaurante_id !== id));
      mostrarMensagem('Loja excluída!', 'success');
    } catch (err) {
      mostrarMensagem(`Erro: ${err.message}`, 'error');
    }
  };

  const prepararEdicaoRestaurante = (rest) => {
    setNomeRest(rest.nome);
    setCnpj(rest.cnpj);
    setEndereco(rest.endereco);
    setLatitude(rest.latitude ?? '');
    setLongitude(rest.longitude ?? '');
    setEditandoRestId(rest.id);
    setShowFormulario(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicaoRest = () => {
    setNomeRest('');
    setCnpj('');
    setEndereco('');
    setLatitude('');
    setLongitude('');
    setEditandoRestId(null);
  };

  // ----------------------------------------------------------
  // Produtos
  // ----------------------------------------------------------
  const salvarProduto = async (e) => {
    e.preventDefault();
    if (!restauranteSelecionado)
      return mostrarMensagem('Selecione uma loja para vincular o produto.', 'error');

    const payload = {
      nome: nomeProd,
      preco: parseFloat(preco.toString().replace(',', '.')),
      restaurante_id: restauranteSelecionado,
    };

    try {
      if (editandoProdId) {
        const atualizado = await ProdutoModel.atualizar(editandoProdId, payload);
        setProdutos((prev) => prev.map((p) => (p.id === editandoProdId ? atualizado : p)));
        mostrarMensagem('Produto atualizado!', 'success');
      } else {
        const novo = await ProdutoModel.criar(payload);
        setProdutos((prev) => [...prev, novo]);
        mostrarMensagem('Produto adicionado!', 'success');
      }
      cancelarEdicaoProd();
    } catch (err) {
      mostrarMensagem(`Erro: ${err.message}`, 'error');
    }
  };

  const excluirProduto = async (id, nome) => {
    if (!window.confirm(`Remover "${nome}"?`)) return;
    try {
      await ProdutoModel.excluir(id);
      setProdutos((prev) => prev.filter((p) => p.id !== id));
      mostrarMensagem('Produto removido!', 'success');
    } catch (err) {
      mostrarMensagem(`Erro: ${err.message}`, 'error');
    }
  };

  const prepararEdicaoProduto = (prod) => {
    setNomeProd(prod.nome);
    setPreco(prod.preco.toString());
    setRestauranteSelecionado(prod.restaurante_id);
    setEditandoProdId(prod.id);
    setAbaAtiva('catalogo');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicaoProd = () => {
    setNomeProd('');
    setPreco('');
    setRestauranteSelecionado('');
    setEditandoProdId(null);
  };

  // ----------------------------------------------------------
  // Pedidos
  // ----------------------------------------------------------
  const atualizarStatusPedido = async (pedidoId, novoStatus) => {
    try {
      await PedidoModel.atualizarStatus(pedidoId, novoStatus);
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? { ...p, status: novoStatus } : p))
      );
      await NotificacaoService.notificarMudancaStatus(pedidoId, novoStatus);
      mostrarMensagem(`Pedido atualizado: ${novoStatus}`, 'success');
    } catch (err) {
      mostrarMensagem(`Erro: ${err.message}`, 'error');
    }
  };

  return {
    // Dados
    restaurantes,
    produtos,
    pedidos,

    // UI
    mensagem,
    tipoMensagem,
    abaAtiva,
    setAbaAtiva,
    showFormulario,
    setShowFormulario,
    buscandoCoordenadas,

    // Form – Restaurante
    nomeRest, setNomeRest,
    cnpj, setCnpj,
    endereco, setEndereco,
    latitude,
    longitude,
    editandoRestId,
    buscarCoordenadas,
    salvarRestaurante,
    excluirRestaurante,
    prepararEdicaoRestaurante,
    cancelarEdicaoRest,

    // Form – Produto
    nomeProd, setNomeProd,
    preco, setPreco,
    restauranteSelecionado, setRestauranteSelecionado,
    editandoProdId,
    salvarProduto,
    excluirProduto,
    prepararEdicaoProduto,
    cancelarEdicaoProd,

    // Pedidos
    atualizarStatusPedido,
  };
}