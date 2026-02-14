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
async function apiCall(endpoint, method = 'POST', buttonElement = null) {
  if (buttonElement) {
    const originalText = buttonElement.textContent;
    buttonElement.disabled = true;
    buttonElement.textContent = '⏳ Chargement...';
  }
  
  try {
    const response = await fetch(endpoint, { method });
    const data = await response.json();
    
    if (data.success) {
      showNotification(data.message, 'success');
      setTimeout(() => window.location.reload(), 2000);
    } else {
      showNotification(data.error, 'error');
      if (buttonElement) {
        buttonElement.disabled = false;
        buttonElement.textContent = originalText;
      }
    }
  } catch (error) {
    showNotification('Erreur de connexion', 'error');
    if (buttonElement) {
      buttonElement.disabled = false;
      buttonElement.textContent = originalText;
    }
  }
}

// Global actions
function startAll() {
  if (confirm('Démarrer tous les services ?')) {
    apiCall('/api/start-all', 'POST', event.target);
  }
}

function stopAll() {
  if (confirm('Arrêter tous les services ?')) {
    apiCall('/api/stop-all', 'POST', event.target);
  }
}

function updateFromGitHub() {
  if (confirm('Mettre à jour depuis GitHub ? Les services seront redémarrés.')) {
    apiCall('/api/update', 'POST', event.target);
  }
}

// Service actions
function restartService(serviceName) {
  if (confirm(`Redémarrer le service ${serviceName} ?`)) {
    apiCall(`/api/service/${serviceName}/restart`, 'POST', event.target);
  }
}

function stopService(serviceName) {
  if (confirm(`Arrêter le service ${serviceName} ?`)) {
    apiCall(`/api/service/${serviceName}/stop`, 'POST', event.target);
  }
}
