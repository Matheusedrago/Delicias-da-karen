require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'karen123';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database(DB_PATH, (error) => {
  if (error) {
    console.error('Erro ao conectar ao banco SQLite:', error.message);
    process.exit(1);
  }
  console.log('Banco conectado:', DB_PATH);
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL,
      produto TEXT NOT NULL,
      sabor TEXT NOT NULL,
      quantidade TEXT NOT NULL,
      data_entrega TEXT,
      tipo_entrega TEXT,
      endereco TEXT,
      observacoes TEXT,
      status TEXT NOT NULL DEFAULT 'pendente'
    )
  `);
});

function normalizarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function validarPedido(body) {
  const pedido = {
    nome: normalizarTexto(body.nome),
    telefone: normalizarTexto(body.telefone),
    produto: normalizarTexto(body.produto),
    sabor: normalizarTexto(body.sabor),
    quantidade: normalizarTexto(body.quantidade),
    dataEntrega: normalizarTexto(body.dataEntrega),
    tipoEntrega: normalizarTexto(body.tipoEntrega) || 'A combinar',
    endereco: normalizarTexto(body.endereco),
    obs: normalizarTexto(body.obs)
  };

  const camposObrigatorios = [
    ['nome', 'nome'],
    ['telefone', 'telefone'],
    ['produto', 'produto'],
    ['sabor', 'sabor'],
    ['quantidade', 'quantidade']
  ];

  for (const [campo, rotulo] of camposObrigatorios) {
    if (!pedido[campo]) {
      return { error: `O campo ${rotulo} é obrigatório.` };
    }
  }

  if (pedido.telefone.length < 8) {
    return { error: 'Informe um telefone válido.' };
  }

  return { pedido };
}

function exigirSenhaAdmin(req, res, next) {
  const senha = req.header('x-admin-password');

  if (!senha || senha !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha do painel administrativo inválida.' });
  }

  next();
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'API da Delícias da Karen funcionando.' });
});

app.post('/api/orders', (req, res) => {
  const validacao = validarPedido(req.body);

  if (validacao.error) {
    return res.status(400).json({ error: validacao.error });
  }

  const p = validacao.pedido;

  const sql = `
    INSERT INTO orders
    (nome, telefone, produto, sabor, quantidade, data_entrega, tipo_entrega, endereco, observacoes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente')
  `;

  const params = [
    p.nome,
    p.telefone,
    p.produto,
    p.sabor,
    p.quantidade,
    p.dataEntrega,
    p.tipoEntrega,
    p.endereco,
    p.obs
  ];

  db.run(sql, params, function (error) {
    if (error) {
      console.error('Erro ao salvar pedido:', error.message);
      return res.status(500).json({ error: 'Erro interno ao salvar pedido.' });
    }

    return res.status(201).json({
      ok: true,
      message: 'Pedido salvo com sucesso.',
      orderId: this.lastID
    });
  });
});

app.get('/api/admin/orders', exigirSenhaAdmin, (req, res) => {
  const sql = `
    SELECT
      id,
      created_at AS createdAt,
      nome,
      telefone,
      produto,
      sabor,
      quantidade,
      data_entrega AS dataEntrega,
      tipo_entrega AS tipoEntrega,
      endereco,
      observacoes AS obs,
      status
    FROM orders
    ORDER BY id DESC
  `;

  db.all(sql, [], (error, rows) => {
    if (error) {
      console.error('Erro ao buscar pedidos:', error.message);
      return res.status(500).json({ error: 'Erro interno ao buscar pedidos.' });
    }

    res.json({ ok: true, orders: rows });
  });
});

app.patch('/api/admin/orders/:id/status', exigirSenhaAdmin, (req, res) => {
  const id = Number(req.params.id);
  const status = normalizarTexto(req.body.status).toLowerCase();
  const statusPermitidos = ['pendente', 'em preparo', 'finalizado', 'cancelado'];

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID do pedido inválido.' });
  }

  if (!statusPermitidos.includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' });
  }

  db.run('UPDATE orders SET status = ? WHERE id = ?', [status, id], function (error) {
    if (error) {
      console.error('Erro ao atualizar status:', error.message);
      return res.status(500).json({ error: 'Erro interno ao atualizar status.' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    res.json({ ok: true, message: 'Status atualizado com sucesso.' });
  });
});

app.delete('/api/admin/orders/:id', exigirSenhaAdmin, (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'ID do pedido inválido.' });
  }

  db.run('DELETE FROM orders WHERE id = ?', [id], function (error) {
    if (error) {
      console.error('Erro ao excluir pedido:', error.message);
      return res.status(500).json({ error: 'Erro interno ao excluir pedido.' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    res.json({ ok: true, message: 'Pedido excluído com sucesso.' });
  });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Painel admin em http://localhost:${PORT}/admin`);
});
