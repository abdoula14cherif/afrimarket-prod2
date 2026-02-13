// Configuration Supabase
const SUPABASE_URL = 'https://kfbstzlauxdwezgtzdsx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmYnN0emxhdXhkd2V6Z3R6ZHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODYzMDQsImV4cCI6MjA4NjU2MjMwNH0.a43ze2_uKyaEgodntEvMRFEH7mNgByyfUHfzQpEKDFM';

// Initialisation de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', function() {
    // Gestion des options de connexion (Email/WhatsApp/Pseudo)
    const loginOptions = document.querySelectorAll('.login-option-btn');
    const loginField = document.getElementById('loginField');
    const loginInput = document.getElementById('login');
    const loginLabel = document.getElementById('loginLabel');
    
    loginOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Retirer la classe active de tous les boutons
            loginOptions.forEach(btn => btn.classList.remove('active'));
            // Ajouter la classe active au bouton cliqué
            this.classList.add('active');
            
            // Changer le champ en fonction de la méthode choisie
            const method = this.dataset.method;
            updateLoginField(method);
        });
    });
    
    function updateLoginField(method) {
        switch(method) {
            case 'email':
                loginInput.type = 'email';
                loginInput.placeholder = 'Entrez votre email';
                loginInput.pattern = '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$';
                loginLabel.innerHTML = '<i class="fas fa-envelope"></i> Adresse email';
                break;
            case 'whatsapp':
                loginInput.type = 'tel';
                loginInput.placeholder = 'Ex: +225 XX XX XX XX';
                loginInput.pattern = '^\\+?[0-9]{10,15}$';
                loginLabel.innerHTML = '<i class="fab fa-whatsapp"></i> Numéro WhatsApp';
                break;
            case 'username':
                loginInput.type = 'text';
                loginInput.placeholder = 'Entrez votre nom d\'utilisateur';
                loginInput.pattern = null;
                loginLabel.innerHTML = '<i class="fas fa-user"></i> Nom d\'utilisateur';
                break;
        }
    }
    
    // Gestion de l'affichage/masquage du mot de passe
    const togglePassword = document.querySelector('.toggle-password');
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }
    
    // Gestion de la soumission du formulaire de connexion
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Gestion du modal mot de passe oublié
    const forgotPasswordLink = document.querySelector('.forgot-password');
    const modal = document.getElementById('forgotPasswordModal');
    const closeModal = document.querySelector('.close-modal');
    
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            modal.style.display = 'block';
        });
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // Fermer le modal en cliquant en dehors
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Gestion du formulaire de réinitialisation de mot de passe
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handlePasswordReset);
    }
});

async function handleLogin(e) {
    e.preventDefault();
    
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = '';
    messageDiv.className = 'message';
    
    const submitBtn = e.target.querySelector('.btn-submit');
    
    // Récupération des valeurs
    const loginValue = document.getElementById('login').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember').checked;
    const loginMethod = document.querySelector('.login-option-btn.active').dataset.method;
    
    // Validation
    if (!loginValue || !password) {
        showMessage('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    // Validation spécifique selon la méthode
    if (loginMethod === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(loginValue)) {
            showMessage('Veuillez entrer un email valide', 'error');
            document.getElementById('login').classList.add('shake');
            setTimeout(() => document.getElementById('login').classList.remove('shake'), 500);
            return;
        }
    } else if (loginMethod === 'whatsapp') {
        const whatsappRegex = /^\+?[0-9]{10,15}$/;
        if (!whatsappRegex.test(loginValue.replace(/\s/g, ''))) {
            showMessage('Veuillez entrer un numéro WhatsApp valide', 'error');
            document.getElementById('login').classList.add('shake');
            setTimeout(() => document.getElementById('login').classList.remove('shake'), 500);
            return;
        }
    }
    
    try {
        // Ajouter l'état de chargement
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        showMessage('Connexion en cours...', 'success');
        
        let email = loginValue;
        
        // Si la méthode de connexion n'est pas email, il faut trouver l'email associé
        if (loginMethod !== 'email') {
            // Recherche dans la table users
            const field = loginMethod === 'whatsapp' ? 'whatsapp' : 'username';
            const { data: userData, error: searchError } = await supabase
                .from('users')
                .select('user_id')
                .eq(field, loginValue)
                .single();
            
            if (searchError || !userData) {
                throw new Error('Utilisateur non trouvé');
            }
            
            // Récupérer l'email depuis auth.users (nécessite une fonction RPC ou une vue)
            // Pour l'instant, on utilise une approche simplifiée
            email = `${loginValue}@temp.com`; // À améliorer avec une fonction RPC
        }
        
        // Tentative de connexion
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Gestion du "Se souvenir de moi"
        if (rememberMe) {
            localStorage.setItem('afrimarket_session', 'active');
            localStorage.setItem('afrimarket_user', JSON.stringify(data.user));
        } else {
            sessionStorage.setItem('afrimarket_session', 'active');
        }
        
        showMessage('Connexion réussie ! Redirection...', 'success');
        
        // Redirection après 2 secondes
        setTimeout(() => {
            window.location.href = 'dashboard.html'; // ou page d'accueil connectée
        }, 2000);
        
    } catch (error) {
        console.error('Erreur de connexion:', error);
        showMessage(error.message || 'Email/WhatsApp ou mot de passe incorrect', 'error');
        
        // Animation de shake sur le formulaire
        document.querySelector('.auth-card').classList.add('shake');
        setTimeout(() => document.querySelector('.auth-card').classList.remove('shake'), 500);
        
    } finally {
        // Retirer l'état de chargement
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

async function handlePasswordReset(e) {
    e.preventDefault();
    
    const modal = document.getElementById('forgotPasswordModal');
    const email = document.getElementById('resetEmail').value;
    const submitBtn = e.target.querySelector('.btn-submit');
    
    if (!email) {
        alert('Veuillez entrer votre email');
        return;
    }
    
    try {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://votre-site.com/reset-password',
        });
        
        if (error) throw error;
        
        alert('Un email de réinitialisation a été envoyé à ' + email);
        modal.style.display = 'none';
        
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'envoi de l\'email: ' + error.message);
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.innerHTML = text;
    messageDiv.className = `message ${type}`;
    
    // Animation
    messageDiv.style.opacity = '0';
    setTimeout(() => {
        messageDiv.style.opacity = '1';
        messageDiv.style.transition = 'opacity 0.3s ease';
    }, 10);
}
