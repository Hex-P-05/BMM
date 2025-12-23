const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors()); // Permite que tu Frontend (puerto 5173) hable con este Backend (3001)
app.use(express.json());

// --- RUTAS DE EJEMPLO (Para probar que funciona) ---

// 1. Obtener todos los tickets (Para el Dashboard y Lista)
app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        client: true,       // Trae el nombre del cliente
        shippingLine: true, // Trae el nombre de la naviera
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tickets' });
  }
});

// 2. Crear un Ticket (Captura Revalidaciones)
app.post('/api/tickets', async (req, res) => {
  const { bl, containerNumber, shippingLineId, clientId, reason, eta, amount, createdById } = req.body;
  
  // Lógica del Concepto (Backend es más seguro para esto)
  // Aquí deberías buscar los nombres en la DB para armar el string, 
  // por simplicidad en este ejemplo asumimos que los envías o los buscas.
  
  try {
    const newTicket = await prisma.ticket.create({
      data: {
        bl,
        containerNumber,
        shippingLineId,
        clientId,
        reason,
        eta: new Date(eta), // Convertir string a Date
        amount,
        concept: "GEN-AUTOMATICO-BACKEND", // Pendiente: Lógica de generación
        createdById
      }
    });
    res.json(newTicket);
  } catch (error) {
    res.status(500).json({ error: 'No se pudo guardar el ticket' });
  }
});

// 3. Registrar Pago (Rol Pagos)
app.put('/api/tickets/:id/pay', async (req, res) => {
  const { id } = req.params;
  const { paidById } = req.body;
  const today = new Date();

  try {
    // Primero buscamos el ticket para ver el ETA y calcular retraso
    const ticket = await prisma.ticket.findUnique({ where: { id: Number(id) } });
    
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (ticket.isPaid) return res.status(400).json({ error: 'Ya está pagado' });

    // Cálculo de retraso
    const diffTime = today - new Date(ticket.eta);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const delay = diffDays > 0 ? diffDays : 0; // Solo si es positivo hay retraso

    const updatedTicket = await prisma.ticket.update({
      where: { id: Number(id) },
      data: {
        isPaid: true,
        paymentDate: today,
        paymentDelay: delay,
        paidById: paidById
      }
    });

    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar pago' });
  }
});

// Arrancar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend corriendo en http://localhost:${PORT}`);
});