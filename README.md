# Delícias da Karen — Site com Banco de Dados e Painel Admin

Este projeto contém:

- Site principal de vendas: `public/index.html`
- Painel administrativo: `public/admin.html`
- Backend/API em Node.js: `server.js`
- Banco de dados SQLite: criado automaticamente como `database.sqlite`

## Como rodar o projeto

### 1. Instalar dependências

Abra o terminal dentro da pasta do projeto e rode:

```bash
npm install
```

### 2. Configurar senha do painel

Copie o arquivo `.env.example` e renomeie para `.env`.

No Windows, você pode duplicar o arquivo manualmente.

No terminal Linux/macOS:

```bash
cp .env.example .env
```

Dentro do `.env`, ajuste a senha:

```env
PORT=3000
ADMIN_PASSWORD=karen123
DB_PATH=database.sqlite
```

### 3. Iniciar o servidor

```bash
npm start
```

### 4. Acessar no navegador

Site principal:

```txt
http://localhost:3000
```

Painel administrativo:

```txt
http://localhost:3000/admin
```

Senha padrão do painel:

```txt
karen123
```

## Como funciona

1. O cliente preenche o formulário no site.
2. O site envia os dados para a rota `POST /api/orders`.
3. O backend salva o pedido no banco SQLite.
4. O WhatsApp abre para o cliente confirmar o pedido com a Karen.
5. A Karen entra no painel admin e vê os pedidos salvos.
6. No painel, ela pode alterar o status, chamar o cliente no WhatsApp, excluir pedidos de teste e exportar CSV.

## Campos salvos no banco

- Nome
- Telefone
- Produto
- Sabor
- Quantidade
- Data desejada
- Forma de recebimento
- Endereço
- Observações
- Status
- Data/hora em que o pedido foi criado

## Observação importante

Este login é simples e adequado para apresentação de faculdade/protótipo. Para um sistema real em produção, o ideal seria implementar autenticação mais segura, com usuário, senha criptografada, sessão, HTTPS e hospedagem adequada.

## Imagens

As imagens usadas no HTML continuam com os nomes originais do seu projeto. Para aparecerem corretamente, coloque os arquivos de imagem dentro da pasta `public`, junto com o `index.html`.
