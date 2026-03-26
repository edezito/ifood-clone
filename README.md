# 🍔 FoodExpress — Arquitetura MVC

## Estrutura de pastas

```
src/
├── models/                     ← MODEL: acesso a dados (Supabase / APIs externas)
│   ├── authModel.js            Firebase Auth + Supabase OTP
│   ├── clienteModel.js         CRUD da tabela `clientes`
│   ├── itensPedidoModel.js     CRUD da tabela `itens_pedido`
│   ├── pedidoModel.js          CRUD + Realtime da tabela `pedidos`
│   ├── produtoModel.js         CRUD da tabela `produtos`
│   └── restauranteModel.js     CRUD + geocoding da tabela `restaurantes`
│
├── controllers/                ← CONTROLLER: lógica de negócio (custom hooks)
│   ├── useAdminController.js   Painel do parceiro (restaurantes, produtos, pedidos)
│   ├── useAcompanhamentoController.js  Pedido em tempo real (Realtime)
│   ├── useAuthController.js    Login admin (Firebase) e cliente (OTP)
│   ├── useClienteController.js App de delivery (carrinho, finalização)
│   └── useHistoricoController.js  Histórico de pedidos por telefone
│
├── views/                      ← VIEW: componentes React (só renderização)
│   ├── admin/
│   │   └── AdminDashboard.jsx
│   ├── auth/
│   │   ├── LoginAdmin.jsx
│   │   └── LoginCliente.jsx
│   └── cliente/
│       ├── AcompanhamentoPedido.jsx
│       ├── ClienteApp.jsx
│       └── HistoricoPedidos.jsx
│
├── services/                   ← SERVICES: instâncias e utilitários reutilizáveis
│   ├── firebaseClient.js       Instância do Firebase Auth
│   ├── notificacaoService.js   Envio de notificações/NF
│   └── supabaseClient.js       Instância do Supabase
│
├── App.jsx                     ← Roteamento principal entre telas
└── main.jsx                    ← Entry point do React
```

---

## Como o padrão MVC foi aplicado

### Model (`src/models/`)
- **Única responsabilidade:** comunicar-se com fontes de dados externas (Supabase, Firebase, APIs REST).
- Não conhece React, não tem estado, não renderiza nada.
- Cada arquivo expõe um objeto com métodos `async` puros.

```js
// Exemplo: restauranteModel.js
export const RestauranteModel = {
  async listarTodos() { ... },
  async criar(dados)  { ... },
  async excluir(id)   { ... },
};
```

### Controller (`src/controllers/`)
- Implementado como **custom hooks React** (`use...`).
- Responsável por: estado local, regras de negócio, orquestrar chamadas aos Models.
- Retorna apenas dados e funções que a View precisa — sem JSX.

```js
// Exemplo: useAdminController.js
export function useAdminController() {
  const [restaurantes, setRestaurantes] = useState([]);
  // ... lógica de salvar, excluir, validar
  return { restaurantes, salvarRestaurante, excluirRestaurante, ... };
}
```

### View (`src/views/`)
- Componentes React com **zero lógica de negócio**.
- Recebe tudo do controller via hook e apenas renderiza.
- Pode ter pequenos estados de UI (ex.: modal aberto), mas não faz chamadas ao banco.

```jsx
// Exemplo: AdminDashboard.jsx
function AdminDashboard({ onLogout }) {
  const ctrl = useAdminController(); // ← toda a lógica aqui
  return ( /* ... JSX puro ... */ );
}
```

### Services (`src/services/`)
- Instâncias compartilhadas (Supabase, Firebase) e utilitários transversais.
- Importados pelos Models — nunca pelas Views.

---

## Fluxo de dados

```
View  →  Controller (hook)  →  Model  →  Supabase / Firebase
 ↑              |
 └──── estado ──┘
```

1. O usuário interage com a **View** (clique em botão, submit de form).
2. A View chama uma função do **Controller** (ex.: `ctrl.salvarRestaurante(e)`).
3. O Controller valida os dados e chama o **Model** (ex.: `RestauranteModel.criar(payload)`).
4. O Model faz a requisição ao **Supabase** e retorna o resultado.
5. O Controller atualiza o estado local e a View re-renderiza.

---

## Regras para manter a arquitetura limpa

| Camada      | Pode importar       | Não pode importar |
|-------------|---------------------|-------------------|
| Model       | services/           | views/, controllers/ |
| Controller  | models/, services/  | views/            |
| View        | controllers/        | models/, services/ |
| Service     | —                   | models/, controllers/, views/ |

---

## Instalação e execução

```bash
npm install
npm run dev
```

Copie o arquivo `.env.example` para `.env` e preencha com suas chaves do Firebase.