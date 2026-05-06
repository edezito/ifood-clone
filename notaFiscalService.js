export async function gerarEEnviarNota({
  pedido,
  carrinho,
  usuario,
  tipoEntrega,
  formaPagamento
}) {
  try {
    console.log("🔥 Enviando pedido para gerar nota...");

    const response = await fetch('http://localhost:3000/enviar-nota', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pedido,
        carrinho,
        usuario,
        tipoEntrega,
        formaPagamento
      })
    });

    if (!response.ok) {
      throw new Error('Erro ao gerar nota');
    }

    // 👇 ISSO AQUI É O QUE FALTAVA
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `nota-${pedido.id}.pdf`;
    a.click();

    window.URL.revokeObjectURL(url);

    console.log('✅ PDF baixado com sucesso');

  } catch (error) {
    console.error('❌ Erro ao gerar nota:', error);
  }
}