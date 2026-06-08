const clientsByUserId = new Map();

function sendEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function addClient(userId, res) {
  const clients = clientsByUserId.get(userId) || new Set();
  clients.add(res);
  clientsByUserId.set(userId, clients);

  sendEvent(res, "connected", { ok: true });

  return () => {
    clients.delete(res);
    if (clients.size === 0) {
      clientsByUserId.delete(userId);
    }
  };
}

function sendToUser(userId, notification) {
  const clients = clientsByUserId.get(userId);
  if (!clients) return;

  for (const client of clients) {
    sendEvent(client, "notification", notification);
  }
}

module.exports = Object.freeze({
  addClient,
  sendToUser,
});
