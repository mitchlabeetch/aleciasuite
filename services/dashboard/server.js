const express = require('express');
const { engine } = require('express-handlebars');
const Docker = require('dockerode');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const PORT = process.env.PORT || 3100;

// Configuration Handlebars
app.engine('hbs', engine({ 
  extname: '.hbs',
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, 'views'),
  helpers: {
    eq: (a, b) => a === b
  }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Services Alecia Suite
const ALECIA_SERVICES = [
  { id: 'alecia-website', name: 'Site Web', icon: '🌐', url: 'https://alecia.markets' },
  { id: 'alecia-colab', name: 'Colab', icon: '📝', url: 'https://colab.alecia.markets' },
  { id: 'alecia-cms', name: 'CMS', icon: '📚', url: 'https://cms.alecia.markets' },
  { id: 'alecia-flows', name: 'Flows', icon: '🔄', url: 'https://flows.alecia.markets' },
  { id: 'alecia-hocuspocus', name: 'Collaboration', icon: '🤝', url: null },
  { id: 'postgres', name: 'Base de données', icon: '🗄️', url: null },
  { id: 'redis', name: 'Cache', icon: '⚡', url: null },
  { id: 'minio', name: 'Stockage', icon: '📦', url: null },
  { id: 'caddy', name: 'Reverse Proxy', icon: '🔐', url: null }
];

// Routes
app.get('/', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    
    const servicesStatus = await Promise.all(
      ALECIA_SERVICES.map(async (service) => {
        const container = containers.find(c => 
          c.Names.some(name => name.includes(service.id))
        );
        
        return {
          ...service,
          status: container ? container.State : 'absent',
          uptime: container ? container.Status : 'Non démarré',
          containerId: container ? container.Id.substring(0, 12) : null
        };
      })
    );

    res.render('index', { 
      title: 'Tableau de Bord Alecia Suite',
      services: servicesStatus 
    });
  } catch (error) {
    res.status(500).render('index', { 
      title: 'Erreur',
      error: 'Impossible de récupérer l\'état des services' 
    });
  }
});

// API: Démarrer tous les services
app.post('/api/start-all', async (req, res) => {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    await execPromise('docker-compose -f /app/docker-compose.production.yml up -d');
    
    res.json({ success: true, message: 'Tous les services sont en cours de démarrage' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Arrêter tous les services
app.post('/api/stop-all', async (req, res) => {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    await execPromise('docker-compose -f /app/docker-compose.production.yml down');
    
    res.json({ success: true, message: 'Tous les services sont arrêtés' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Redémarrer un service spécifique
app.post('/api/service/:name/restart', async (req, res) => {
  try {
    const serviceName = req.params.name;
    const containers = await docker.listContainers({ all: true });
    const container = containers.find(c => 
      c.Names.some(name => name.includes(serviceName))
    );
    
    if (!container) {
      return res.status(404).json({ success: false, error: 'Service non trouvé' });
    }
    
    const containerObj = docker.getContainer(container.Id);
    await containerObj.restart();
    
    res.json({ success: true, message: `Service ${serviceName} redémarré` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Arrêter un service spécifique
app.post('/api/service/:name/stop', async (req, res) => {
  try {
    const serviceName = req.params.name;
    const containers = await docker.listContainers();
    const container = containers.find(c => 
      c.Names.some(name => name.includes(serviceName))
    );
    
    if (!container) {
      return res.status(404).json({ success: false, error: 'Service non trouvé ou déjà arrêté' });
    }
    
    const containerObj = docker.getContainer(container.Id);
    await containerObj.stop();
    
    res.json({ success: true, message: `Service ${serviceName} arrêté` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Récupérer les logs d'un service
app.get('/api/service/:name/logs', async (req, res) => {
  try {
    const serviceName = req.params.name;
    const containers = await docker.listContainers({ all: true });
    const container = containers.find(c => 
      c.Names.some(name => name.includes(serviceName))
    );
    
    if (!container) {
      return res.status(404).json({ success: false, error: 'Service non trouvé' });
    }
    
    const containerObj = docker.getContainer(container.Id);
    const logs = await containerObj.logs({
      stdout: true,
      stderr: true,
      tail: 100
    });
    
    res.json({ success: true, logs: logs.toString('utf-8') });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Mettre à jour depuis GitHub
app.post('/api/update', async (req, res) => {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execPromise = promisify(exec);
    
    // Pull latest changes
    await execPromise('cd /app && git pull origin main');
    
    // Rebuild and restart services
    await execPromise('docker-compose -f /app/docker-compose.production.yml up -d --build');
    
    res.json({ success: true, message: 'Mise à jour effectuée avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Page des logs
app.get('/logs/:service', async (req, res) => {
  const service = ALECIA_SERVICES.find(s => s.id === req.params.service);
  
  if (!service) {
    return res.status(404).send('Service non trouvé');
  }
  
  res.render('logs', { 
    title: `Logs - ${service.name}`,
    service: service
  });
});

// WebSocket pour logs en temps réel
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws, request) => {
  const serviceName = new URL(request.url, 'http://localhost').searchParams.get('service');
  
  if (!serviceName) {
    ws.close();
    return;
  }
  
  docker.listContainers({ all: true }).then(containers => {
    const container = containers.find(c => 
      c.Names.some(name => name.includes(serviceName))
    );
    
    if (!container) {
      ws.send(JSON.stringify({ error: 'Service non trouvé' }));
      ws.close();
      return;
    }
    
    const containerObj = docker.getContainer(container.Id);
    
    containerObj.logs({
      follow: true,
      stdout: true,
      stderr: true,
      tail: 50
    }).then(stream => {
      stream.on('data', (chunk) => {
        ws.send(chunk.toString('utf-8'));
      });
      
      ws.on('close', () => {
        stream.destroy();
      });
    });
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Dashboard Alecia Suite démarré sur le port ${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
