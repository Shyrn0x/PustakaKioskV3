import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import { Server } from "socket.io";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected to WebSocket");
    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  app.use(cors());
  app.use(express.json());

  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Database connection
  let db: mysql.Connection | null = null;
  
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "pustaka_kiosk",
    });
    console.log("Connected to MySQL database");
  } catch (err) {
    console.error("Failed to connect to MySQL database:", err);
  }

  // --- Mock Data for Demo/Preview Mode ---
  let mockMembers = [
    { id: 1, rfid_uid: "user123", name: "Zaidan Arrifqi", student_id: "3.33.23.1.24", role: "SISWA" }
  ];
  let mockBooks = [
    { id: 1, qr_code: "buku123", title: "Rancang Bangun IOT", author: "Dzaki Syafiq", isbn: "123-456", category: "Teknik", total_copies: 5, available_copies: 5 }
  ];
  let mockTransactions: any[] = [];

  // --- API Routes ---

  // Get all members
  app.get("/api/members", async (req, res) => {
    if (!db) return res.json(mockMembers);
    try {
      const [rows] = await db.execute("SELECT * FROM members ORDER BY created_at DESC");
      res.json(rows);
    } catch (err) {
      res.json(mockMembers);
    }
  });

  // Add Member
  app.post("/api/members", async (req, res) => {
    const { rfid_uid, name, student_id, role } = req.body;
    if (!db) {
      const newMember = { id: mockMembers.length + 1, rfid_uid, name, student_id, role };
      mockMembers.push(newMember);
      return res.json({ message: "Member added (Demo Mode)" });
    }
    try {
      await db.execute(
        "INSERT INTO members (rfid_uid, name, student_id, role) VALUES (?, ?, ?, ?)",
        [rfid_uid, name, student_id, role || 'SISWA']
      );
      res.json({ message: "Member added successfully" });
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "RFID or Student ID already exists" });
      res.status(500).json({ error: "Failed to add member" });
    }
  });

  // Get all books
  app.get("/api/books", async (req, res) => {
    const { search } = req.query;
    if (!db) {
      if (search) {
        const s = String(search).toLowerCase();
        return res.json(mockBooks.filter(b => b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s)));
      }
      return res.json(mockBooks);
    }
    try {
      let query = "SELECT * FROM books";
      let params = [];
      if (search) {
        query += " WHERE title LIKE ? OR author LIKE ? OR category LIKE ?";
        const val = `%${search}%`;
        params = [val, val, val];
      }
      const [rows] = await db.execute(query, params);
      res.json(rows);
    } catch (err) {
      res.json(mockBooks);
    }
  });

  // Add Book
  app.post("/api/books", async (req, res) => {
    const { qr_code, title, author, isbn, category, total_copies, publisher } = req.body;
    if (!db) {
      const newBook = { id: mockBooks.length + 1, qr_code, title, author, isbn, category, total_copies, available_copies: total_copies, publisher };
      mockBooks.push(newBook);
      return res.json({ message: "Book added (Demo Mode)" });
    }
    try {
      await db.execute(
        "INSERT INTO books (qr_code, title, author, isbn, category, total_copies, available_copies, publisher) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [qr_code, title, author, isbn, category, total_copies, total_copies, publisher || '']
      );
      res.json({ message: "Book added successfully" });
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "QR Code already exists" });
      res.status(500).json({ error: "Failed to add book: " + err.message });
    }
  });

  // Delete Book
  app.delete("/api/books/:id", async (req, res) => {
    const id = req.params.id;
    console.log("DELETE /api/books/:id", id);
    if (!db) {
      const initialCount = mockBooks.length;
      mockBooks = mockBooks.filter(b => b.id.toString() !== id);
      console.log(`Mock delete: initial=${initialCount}, final=${mockBooks.length}`);
      return res.json({ message: "Book deleted (Demo Mode)" });
    }
    try {
      const [result]: any = await db.execute("DELETE FROM books WHERE id = ?", [Number(id)]);
      console.log("Database delete result:", result);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Book not found" });
      }
      res.json({ message: "Book deleted" });
    } catch (err: any) {
      console.error("Delete book error:", err);
      res.status(500).json({ error: "Delete failed: " + err.message });
    }
  });

  // Update Book
  app.put("/api/books/:id", async (req, res) => {
    console.log("PUT /api/books/:id", req.params.id, req.body);
    const { qr_code, title, author, isbn, category, total_copies, publisher } = req.body;
    if (!db) {
      const book = mockBooks.find(b => b.id.toString() === req.params.id);
      if (book) Object.assign(book, { qr_code, title, author, isbn, category, total_copies, publisher });
      return res.json({ message: "Book updated" });
    }
    try {
      await db.execute(
        "UPDATE books SET qr_code = ?, title = ?, author = ?, isbn = ?, category = ?, total_copies = ?, publisher = ? WHERE id = ?",
        [qr_code, title, author, isbn, category, total_copies, publisher || '', req.params.id]
      );
      res.json({ message: "Book updated" });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Update failed: " + err.message });
    }
  });

  // Delete Member
  app.delete("/api/members/:id", async (req, res) => {
    const id = req.params.id;
    console.log("DELETE /api/members/:id", id);
    if (!db) {
      const initialCount = mockMembers.length;
      mockMembers = mockMembers.filter(m => m.id.toString() !== id);
      console.log(`Mock delete member: initial=${initialCount}, final=${mockMembers.length}`);
      return res.json({ message: "Member deleted (Demo Mode)" });
    }
    try {
      const [result]: any = await db.execute("DELETE FROM members WHERE id = ?", [Number(id)]);
      console.log("Database delete member result:", result);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Member not found" });
      }
      res.json({ message: "Member deleted" });
    } catch (err: any) {
      console.error("Delete member error:", err);
      res.status(500).json({ error: "Delete failed: " + err.message });
    }
  });

  // Update Member
  app.put("/api/members/:id", async (req, res) => {
    console.log("PUT /api/members/:id", req.params.id, req.body);
    const { rfid_uid, name, student_id, role } = req.body;
    if (!db) {
      const member = mockMembers.find(m => m.id.toString() === req.params.id);
      if (member) Object.assign(member, { rfid_uid, name, student_id, role });
      return res.json({ message: "Member updated" });
    }
    try {
      await db.execute(
        "UPDATE members SET rfid_uid = ?, name = ?, student_id = ?, role = ? WHERE id = ?",
        [rfid_uid, name, student_id, role, req.params.id]
      );
      res.json({ message: "Member updated" });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Update failed: " + err.message });
    }
  });

  // Get Transactions / Report
  app.get("/api/transactions", async (req, res) => {
    if (!db) return res.json(mockTransactions);
    try {
      const [rows] = await db.execute(`
        SELECT t.*, m.name as member_name, b.title as book_title 
        FROM transactions t
        JOIN members m ON t.member_id = m.id
        JOIN books b ON t.book_id = b.id
        ORDER BY t.transaction_date DESC
      `);
      res.json(rows);
    } catch (err) {
      res.json(mockTransactions);
    }
  });

  // Endpoint to receive RFID scan from Raspberry Pi Python Script
  app.post("/api/rfid/scan", (req, res) => {
    const { uid } = req.body;
    if (uid) {
      console.log("Hardware RFID Scan received:", uid);
      io.emit("rfid_scanned", uid);
      res.json({ success: true, message: "Scan broadcasted" });
    } else {
      res.status(400).json({ error: "Missing uid" });
    }
  });

  // Check Member by RFID
  app.get("/api/members/:rfid_uid", async (req, res) => {
    if (!db) {
      const m = mockMembers.find(m => m.rfid_uid === req.params.rfid_uid);
      return m ? res.json(m) : res.status(404).json({ error: "Not found" });
    }
    try {
      const [rows]: any = await db.execute(
        "SELECT * FROM members WHERE rfid_uid = ?", 
        [req.params.rfid_uid]
      );
      if (rows.length === 0) return res.status(404).json({ error: "Member not found" });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Check Book by QR Code
  app.get("/api/books/:qr_code", async (req, res) => {
    if (!db) {
      const b = mockBooks.find(b => b.qr_code === req.params.qr_code);
      return b ? res.json(b) : res.status(404).json({ error: "Not found" });
    }
    try {
      const [rows]: any = await db.execute(
        "SELECT * FROM books WHERE qr_code = ?", 
        [req.params.qr_code]
      );
      if (rows.length === 0) return res.status(404).json({ error: "Book not found" });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Post Transaction (Pinjam/Kembali)
  app.post("/api/transactions", async (req, res) => {
    const { member_id, book_id, type } = req.body;
    
    if (!db) {
      const mem = mockMembers.find(m => m.id === member_id);
      const bk = mockBooks.find(b => b.id === book_id);
      if (!mem || !bk) return res.status(400).json({ error: "Data invalid" });

      if (type === 'PINJAM') {
        if (bk.available_copies <= 0) return res.status(400).json({ error: "Stok habis" });
        bk.available_copies--;
        mockTransactions.unshift({
          id: mockTransactions.length + 1,
          member_id,
          book_id,
          member_name: mem.name,
          book_title: bk.title,
          type: 'PINJAM',
          status: 'BERJALAN',
          transaction_date: new Date().toISOString()
        });
      } else {
        const tx = mockTransactions.find(t => t.member_id === member_id && t.book_id === book_id && t.status === 'BERJALAN');
        if (!tx) return res.status(400).json({ error: "Tidak ada pinjaman aktif" });
        tx.status = 'SELESAI';
        tx.type = 'KEMBALI';
        tx.return_date = new Date().toISOString();
        bk.available_copies++;
      }
      return res.json({ message: "Transaction success (Demo Mode)" });
    }

    try {
      if (type === 'PINJAM') {
        const [book]: any = await db.execute("SELECT available_copies FROM books WHERE id = ?", [book_id]);
        if (book[0].available_copies <= 0) return res.status(400).json({ error: "Book out of stock" });
        
        await db.execute(
          "INSERT INTO transactions (member_id, book_id, type, due_date) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))",
          [member_id, book_id, type]
        );
        await db.execute("UPDATE books SET available_copies = available_copies - 1 WHERE id = ?", [book_id]);
      } else {
        const [activeTx]: any = await db.execute(
          "SELECT id FROM transactions WHERE member_id = ? AND book_id = ? AND type = 'PINJAM' AND status = 'BERJALAN' LIMIT 1",
          [member_id, book_id]
        );
        
        if (activeTx.length === 0) return res.status(400).json({ error: "No active loan found" });
        
        await db.execute(
          "UPDATE transactions SET type = 'KEMBALI', status = 'SELESAI', return_date = NOW() WHERE id = ?",
          [activeTx[0].id]
        );
        await db.execute("UPDATE books SET available_copies = available_copies + 1 WHERE id = ?", [book_id]);
      }
      res.json({ message: "Transaction successful" });
    } catch (err) {
      res.status(500).json({ error: "Transaction failed" });
    }
  });

  // Staff Login
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    
    // Default Admin Login
    if (username === 'admin' && (password === 'admin123' || !db)) {
      return res.json({ 
        success: true, 
        user: { username: 'admin', role: 'ADMIN' },
        remoteUrl: process.env.APP_URL || "http://localhost:3000"
      });
    }

    if (!db) return res.status(401).json({ error: "Invalid demo credentials" });

    try {
      const [rows]: any = await db.execute("SELECT * FROM admins WHERE username = ?", [username]);
      if (rows.length > 0) {
        res.json({ 
          success: true, 
          user: { username: rows[0].username, role: rows[0].role },
          remoteUrl: process.env.APP_URL || "http://localhost:3000"
        });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (err) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Analytics
  app.get("/api/stats", async (req, res) => {
    if (!db) {
      return res.json({
        totalBooks: mockBooks.reduce((acc, b) => acc + b.total_copies, 0),
        borrowedBooks: mockTransactions.filter(t => t.status === 'BERJALAN').length,
        activeMembers: mockMembers.length
      });
    }
    try {
      const [totalBooks]: any = await db.execute("SELECT SUM(total_copies) as count FROM books");
      const [borrowedBooks]: any = await db.execute("SELECT COUNT(*) as count FROM transactions WHERE status = 'BERJALAN'");
      const [activeMembers]: any = await db.execute("SELECT COUNT(*) as count FROM members");
      res.json({
        totalBooks: totalBooks[0].count || 0,
        borrowedBooks: borrowedBooks[0].count || 0,
        activeMembers: activeMembers[0].count || 0,
      });
    } catch (err) {
      res.status(500).json({ error: "Stats failed" });
    }
  });

  // --- Serve Frontend ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`PustakaKiosk Server running on http://localhost:${PORT}`);
  });
}

startServer();
