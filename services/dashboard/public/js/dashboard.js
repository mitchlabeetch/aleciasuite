// Notification system
function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = `notification ${type}`;
  
  setTimeout(() => {
    notification.classList.add('hidden');
  }, 3000);
}

// API call helper
async function apiCall(endpoint, method = 'POST') {
  try {
    const response = await fetch(endpoint, { method });
    const data = await response.json();
    
    if (data.success) {
      showNotification(data.message, 'success');
      setTimeout(() => window.location.reload(), 2000);
    } else {
      showNotification(data.error, 'error');
    }
  } catch (error) {
    showNotification('Erreur de connexion', 'error');
  }
}

// Global actions
function startAll() {
  if (confirm('Démarrer tous les services ?')) {
    apiCall('/api/start-all');
  }
}

function stopAll() {
  if (confirm('Arrêter tous les services ?')) {
    apiCall('/api/stop-all');
  }
}

function updateFromGitHub() {
  if (confirm('Mettre à jour depuis GitHub ? Les services seront redémarrés.')) {
    apiCall('/api/update');
  }
}

// Service actions
function restartService(serviceName) {
  if (confirm(`Redémarrer le service ${serviceName} ?`)) {
    apiCall(`/api/service/${serviceName}/restart`);
  }
}

function stopService(serviceName) {
  if (confirm(`Arrêter le service ${serviceName} ?`)) {
    apiCall(`/api/service/${serviceName}/stop`);
  }
}
