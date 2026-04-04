import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import bodyParser from 'body-parser';

const JWT_SECRET = 'pharmacie-mampikony-secret-key';
const DB_FILE = path.join(process.cwd(), 'db.json');

// Initial DB structure
const initialDb = {
  users: [],
  products: [],
  sales: []
};

// Helper to read/write DB
const getDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
};

const saveDb = (data: any) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(bodyParser.json());

  // --- Auth Routes ---
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, displayName, role } = req.body;
    const db = getDb();

    if (db.users.find((u: any) => u.email === email)) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      displayName,
      role,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    saveDb(db);

    const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET);
    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ user: userWithoutPassword, token });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const db = getDb();
    const user = db.users.find((u: any) => u.email === email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  });

  app.get('/api/auth/me', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Non autorisé' });

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const db = getDb();
      const user = db.users.find((u: any) => u.id === decoded.id);
      if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      res.status(401).json({ message: 'Token invalide' });
    }
  });

  // --- Product Routes ---
  app.get('/api/products', (req, res) => {
    const db = getDb();
    res.json(db.products);
  });

  app.post('/api/products', (req, res) => {
    const db = getDb();
    const newProduct = { ...req.body, id: Date.now().toString(), updatedAt: new Date().toISOString() };
    db.products.push(newProduct);
    saveDb(db);
    res.json(newProduct);
  });

  app.put('/api/products/:id', (req, res) => {
    const db = getDb();
    const index = db.products.findIndex((p: any) => p.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Produit non trouvé' });

    db.products[index] = { ...db.products[index], ...req.body, updatedAt: new Date().toISOString() };
    saveDb(db);
    res.json(db.products[index]);
  });

  app.delete('/api/products/:id', (req, res) => {
    const db = getDb();
    db.products = db.products.filter((p: any) => p.id !== req.params.id);
    saveDb(db);
    res.json({ message: 'Produit supprimé' });
  });

  // --- Sales Routes ---
  app.get('/api/sales', (req, res) => {
    const db = getDb();
    res.json(db.sales);
  });

  app.post('/api/sales', (req, res) => {
    const db = getDb();
    const newSale = { ...req.body, id: Date.now().toString(), createdAt: new Date().toISOString() };
    
    // Update stock
    newSale.items.forEach((item: any) => {
      const product = db.products.find((p: any) => p.id === item.productId);
      if (product) {
        product.quantity -= item.quantity;
      }
    });

    db.sales.push(newSale);
    saveDb(db);
    res.json(newSale);
  });

  app.patch('/api/sales/:id', (req, res) => {
    const db = getDb();
    const index = db.sales.findIndex((s: any) => s.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Vente non trouvée' });

    db.sales[index] = { ...db.sales[index], ...req.body };
    saveDb(db);
    res.json(db.sales[index]);
  });

  app.delete('/api/sales/:id', (req, res) => {
    const db = getDb();
    db.sales = db.sales.filter((s: any) => s.id !== req.params.id);
    saveDb(db);
    res.json({ message: 'Vente supprimée' });
  });

  // --- Vite Integration ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
