// frontend/script.js

// ===================================================================
// 1. CONFIGURAÇÃO E INICIALIZAÇÃO (CORREÇÃO DO ERRO AQUI)
// ===================================================================

const API_URL = 'https://pet-plus.onrender.com'; // Verifique se esta é a URL do seu Render
const SUPABASE_URL = 'https://ugffvmqwdmgikdjggmdz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZmZ2bXF3ZG1naWtkamdnbWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MDU4MzUsImV4cCI6MjA3ODQ4MTgzNX0.bWlrMvEUPYdiFYzlvieX73rCJg-FcVeCWIbHGg70QjQ';

// CORREÇÃO: Usamos 'supabaseClient' (nome diferente da lib) e 'window.supabase'
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Estado Global da Aplicação
const AppState = {
    currentUser: null,
    adoptionPets: [],
    myPets: [],
    serviceProviders: [],
    blogPosts: [],
    pagination: {
        adoption: { page: 1, hasMore: true, isLoading: false },
        blog: { page: 1, hasMore: true, isLoading: false }
    }
};

// ===================================================================
// 2. FUNÇÕES DE API (WRAPPER)
// ===================================================================

async function apiFetch(endpoint, options = {}) {
    const headers = {
        ...options.headers,
    };

    // CORREÇÃO: Usamos supabaseClient aqui também
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    if (!options.isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
        }
        
        if (response.status === 204) return null;

        return await response.json();
    } catch (error) {
        console.error(`Falha na requisição para ${endpoint}:`, error);
        throw error; 
    }
}

// ===================================================================
// 3. FUNÇÕES UTILITÁRIAS DE INTERFACE
// ===================================================================

function showMessage(elementId, message, type = 'success') {
    const messageEl = document.getElementById(elementId);
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.className = `message ${type} active`;
    setTimeout(() => {
        messageEl.classList.remove('active');
    }, 5000);
}

function setButtonLoading(button, isLoading, originalText = '') {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = `<div class="spinner" style="width: 20px; height: 20px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>`;
    } else {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// Sanitização para evitar XSS
function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}

// Navegação SPA (Single Page Application)
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');

    // Atualiza menu ativo
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(pageId)) {
            btn.classList.add('active');
        }
    });

    // Carrega dados específicos da página
    if (pageId === 'adoption') loadAdoptionPets();
    else if (pageId === 'my-pets') loadMyPets();
    else if (pageId === 'services') loadServices();
    else if (pageId === 'blog') loadBlogPosts();
}

// ===================================================================
// 4. AUTENTICAÇÃO E SESSÃO
// ===================================================================

function updateAuthButtons() {
    const user = AppState.currentUser;
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const myPetsBtn = document.getElementById('myPetsBtn');
    const userInfo = document.getElementById('userInfo');

    if (user) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        myPetsBtn.style.display = 'inline-block';
        
        const avatarHtml = user.photoUrl 
            ? `<img src="${escapeAttr(user.photoUrl)}" class="nav-avatar">`
            : `<div class="nav-avatar-default">${user.name.charAt(0).toUpperCase()}</div>`;
            
        userInfo.innerHTML = `${avatarHtml} <span>Olá, ${escapeHTML(user.name.split(' ')[0])}</span>`;
        userInfo.classList.add('active');
        userInfo.onclick = showProfileEditPage;
    } else {
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        myPetsBtn.style.display = 'none';
        userInfo.innerHTML = `👋 Olá, <span id="userName"></span>`;
        userInfo.classList.remove('active');
        userInfo.onclick = null;
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = event.target.querySelector('button');

    setButtonLoading(btn, true);

    try {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;

        showMessage('loginMessage', 'Login realizado!', 'success');
        document.getElementById('loginForm').reset();
        setTimeout(() => showPage('landing'), 1000);
    } catch (error) {
        showMessage('loginMessage', 'Erro: Email ou senha incorretos.', 'error');
    } finally {
        setButtonLoading(btn, false, 'Entrar');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirmPassword').value;
    const btn = event.target.querySelector('button');

    if (password !== confirm) {
        showMessage('registerMessage', 'As senhas não coincidem.', 'error');
        return;
    }

    setButtonLoading(btn, true);

    try {
        // 1. Cria no Supabase Auth
        const { data, error } = await supabaseClient.auth.signUp({
            email, password, options: { data: { name, phone } }
        });

        if (error) throw error;

        // 2. Cria perfil no Backend Local
        if (data.user) {
            await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, authId: data.user.id })
            });
        }

        showMessage('registerMessage', 'Conta criada! Verifique seu email.', 'success');
        document.getElementById('registerForm').reset();
        setTimeout(() => showPage('login'), 3000);

    } catch (error) {
        showMessage('registerMessage', error.message, 'error');
    } finally {
        setButtonLoading(btn, false, 'Criar Conta');
    }
}

async function logout() {
    await supabaseClient.auth.signOut();
    showPage('landing');
}

async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        showPage('login');
        throw new Error('Faça login para continuar.');
    }
    return session.user;
}

// ===================================================================
// 5. GERENCIAMENTO DE PETS
// ===================================================================

async function loadAdoptionPets() {
    const container = document.getElementById('adoptionPets');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await apiFetch('/pets/adoption');
        AppState.adoptionPets = response.data || [];
        renderPetList(AppState.adoptionPets, container, true);
    } catch (error) {
        container.innerHTML = '<div class="empty-state">Erro ao carregar pets.</div>';
    }
}

async function loadMyPets() {
    try { await checkAuth(); } catch { return; }
    const container = document.getElementById('myPetsGrid');
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const pets = await apiFetch('/pets/mypets');
        AppState.myPets = pets;
        renderPetList(pets, container, false);
    } catch (error) {
        container.innerHTML = '<div class="empty-state">Você ainda não tem pets cadastrados.</div>';
    }
}

function renderPetList(pets, container, isAdoption) {
    if (pets.length === 0) {
        container.innerHTML = '<div class="empty-state">Nenhum pet encontrado.</div>';
        return;
    }

    container.innerHTML = pets.map(pet => `
        <div class="pet-card">
            <div class="pet-image">
                ${pet.photoUrl ? `<img src="${escapeAttr(pet.photoUrl)}" alt="${pet.name}">` : (pet.species === 'dog' ? '🐕' : '🐈')}
            </div>
            <div class="pet-info">
                <div class="pet-name">${escapeHTML(pet.name)}</div>
                <div class="pet-details">
                    <span>${pet.species === 'dog' ? 'Cão' : 'Gato'}</span> • 
                    <span>${pet.age}</span>
                </div>
                <div class="pet-actions">
                    ${isAdoption 
                        ? `<button class="btn btn-small" onclick="showPetModal(${pet.id})">Ver Detalhes</button>`
                        : `<button class="btn btn-small" onclick="showPetRegisterPage(${pet.id})">Editar</button>`
                    }
                </div>
            </div>
        </div>
    `).join('');
}

async function handlePetRegistration(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const petId = document.getElementById('petEditId').value;
    const btn = form.querySelector('button[type="submit"]');
    
    setButtonLoading(btn, true);

    try {
        const url = petId ? `/pets/${petId}` : '/pets';
        const method = petId ? 'PUT' : 'POST';
        
        await apiFetch(url, { method, body: formData, isFormData: true });
        
        showMessage('petRegisterMessage', `Pet ${petId ? 'atualizado' : 'cadastrado'}!`, 'success');
        form.reset();
        setTimeout(() => showPage('my-pets'), 1500);
    } catch (error) {
        showMessage('petRegisterMessage', error.message, 'error');
    } finally {
        setButtonLoading(btn, false, petId ? 'Atualizar' : 'Cadastrar');
    }
}

// ===================================================================
// 6. CADASTRO DE PET (FORMULÁRIO)
// ===================================================================

function showPetRegisterPage(petId = null) {
    const form = document.getElementById('petRegisterForm');
    const title = document.getElementById('petFormTitle');
    const hiddenId = document.getElementById('petEditId');
    form.reset();

    if (petId) {
        const pet = AppState.myPets.find(p => p.id === petId);
        if (pet) {
            title.textContent = 'Editar Pet';
            hiddenId.value = pet.id;
            document.getElementById('petName').value = pet.name;
            document.getElementById('petType').value = pet.type;
            document.getElementById('petSpecies').value = pet.species;
            document.getElementById('petBreed').value = pet.breed;
            document.getElementById('petAge').value = pet.age;
            document.getElementById('petSize').value = pet.size;
            document.getElementById('petGender').value = pet.gender;
            document.getElementById('petDescription').value = pet.description;
        }
    } else {
        title.textContent = 'Cadastrar Pet';
        hiddenId.value = '';
    }
    showPage('pet-register');
}

function showPetModal(petId) {
    const pet = AppState.adoptionPets.find(p => p.id === petId);
    if (!pet) return;

    const content = document.getElementById('petModalContent');
    content.innerHTML = `
        <div style="text-align:center">
            <h2>${escapeHTML(pet.name)}</h2>
            <p>${escapeHTML(pet.description)}</p>
            <p><strong>Contato do Dono:</strong> ${escapeHTML(pet.ownerName || 'N/A')}</p>
            <button class="btn" onclick="closePetModal()">Fechar</button>
        </div>
    `;
    document.getElementById('petModal').classList.add('active');
}

function closePetModal() {
    document.getElementById('petModal').classList.remove('active');
}

// ===================================================================
// 7. INICIALIZAÇÃO
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Listeners de Formulários
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
    document.getElementById('petRegisterForm')?.addEventListener('submit', handlePetRegistration);

    // Monitoramento de Sessão do Supabase
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (session) {
            try {
                const userProfile = await apiFetch('/auth/me');
                AppState.currentUser = userProfile;
            } catch (e) {
                console.error('Erro ao carregar perfil', e);
            }
        } else {
            AppState.currentUser = null;
        }
        updateAuthButtons();
    });

    // Carrega página inicial
    loadAdoptionPets();
});

// Outras funções de Services e Blog omitidas para brevidade, 
// mas a lógica do 'supabaseClient' deve ser aplicada nelas também.
