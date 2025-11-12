// 1. ESTADO DA APLICAÇÃO E INICIALIZAÇÃO DO SUPABASE

const API_URL = 'https://petplus-backend.onrender.com'; // URL do seu backend no Render
const SUPABASE_URL = 'https://ugffvmqwdmgikdjggmdz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZmZ2bXF3ZG1naWtkamdnbWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MDU4MzUsImV4cCI6MjA3ODQ4MTgzNX0.bWlrMvEUPYdiFYzlvieX73rCJg-FcVeCWIbHGg70QjQ';

// Verifica se as chaves foram inseridas
if (SUPABASE_URL === 'URL_DO_SEU_PROJETO_SUPABASE' || SUPABASE_ANON_KEY === 'CHAVE_ANON_PUBLICA_DO_SUPABASE') {
    alert('ERRO: Configure as variáveis SUPABASE_URL e SUPABASE_ANON_KEY no script.js');
}

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null; 
let pets = [];
let serviceProviders = [];
let blogPosts = [];

// 2. FUNÇÕES AUXILIARES DE API (Refatorada)

async function apiFetch(endpoint, options = {}) {
    const headers = {
        ...options.headers,
    };

    // Pega a sessão atual do Supabase
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        console.error("Erro ao buscar sessão do Supabase:", error);
    }

    // Se houver uma sessão, anexa o token JWT
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
            console.error('Erro na API:', errorData);
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        if (response.status === 204) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error(`Falha no fetch para ${endpoint}:`, error);
        throw error; 
    }
}

// 3. FUNÇÕES UTILITÁRIAS (DOM)

function showMessage(elementId, message, type = 'success') {
    const messageEl = document.getElementById(elementId);
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.className = `message ${type} active`;
    setTimeout(() => {
        messageEl.classList.remove('active');
    }, 5000);
}
function formatDate(date) { /* ... (código inalterado) ... */ }
function formatDateTime(date) { /* ... (código inalterado) ... */ }
function getSpeciesIcon(species) { /* ... (código inalterado) ... */ }
function getAgeLabel(age) { /* ... (código inalterado) ... */ }
function getSizeLabel(size) { /* ... (código inalterado) ... */ }
function getGenderLabel(gender) { /* ... (código inalterado) ... */ }

// 4. NAVEGAÇÃO E AUTENTICAÇÃO 

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    const clickedBtn = Array.from(document.querySelectorAll('.nav-btn')).find(btn => {
        const onclick = btn.getAttribute('onclick');
        return onclick && onclick.includes(`'${pageId}'`);
    });
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }

    // Lógica de carregamento de página
    if (pageId === 'adoption') {
        loadAdoptionPets();
    } else if (pageId === 'my-pets') {
        loadMyPets(); 
    } else if (pageId === 'services') {
        loadServices();
    } else if (pageId === 'blog') {
        loadBlogPosts();
    }
}


function updateAuthButtons() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const myPetsBtn = document.getElementById('myPetsBtn');
    const userInfo = document.getElementById('userInfo');

    if (currentUser) { 
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        myPetsBtn.style.display = 'inline-block';
        
        const user = currentUser; 
        let avatarHtml = '';

        if (user.photoUrl) {
            avatarHtml = `<img src="${user.photoUrl}" alt="${user.name}" class="nav-avatar">`;
        } else {
            const letter = user.name ? user.name.charAt(0).toUpperCase() : '👤';
            avatarHtml = `<div class="nav-avatar-default">${letter}</div>`;
        }
        
        userInfo.innerHTML = `${avatarHtml} <span>Olá, ${user.name}</span>`;
        userInfo.classList.add('active');
        userInfo.onclick = showProfileEditPage;
        userInfo.style.cursor = 'pointer';

    } else {
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        myPetsBtn.style.display = 'none';
        
        userInfo.innerHTML = `👋 Olá, <span id="userName"></span>`;
        userInfo.classList.remove('active');
        userInfo.onclick = null;
        userInfo.style.cursor = 'default';
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showMessage('loginMessage', 'Por favor, preencha todos os campos.', 'error');
        return;
    }

    try {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            if (error.message.includes('Email not confirmed')) {
                showMessage('loginMessage', 'Verifique seu e-mail para ativar sua conta.', 'error');
            } else {
                showMessage('loginMessage', 'Email ou senha incorretos.', 'error');
            }
            return;
        }
        // Mensagem de Sucesso!
        showMessage('loginMessage', 'Login realizado com sucesso!', 'success');     
        setTimeout(() => showPage('landing'), 1500);
        document.getElementById('loginForm').reset();

    } catch (error) {
        showMessage('loginMessage', error.message, 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (!name || !email || !phone || !password || !confirmPassword) {
        showMessage('registerMessage', 'Por favor, preencha todos os campos.', 'error');
        return;
    }
    if (password !== confirmPassword) {
        showMessage('registerMessage', 'As senhas não coincidem.', 'error');
        return;
    }

    // Validação de senha forte (mínimo 8 caracteres, 1 maiúscula, 1 número, 1 símbolo)
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passRegex.test(password)) {
        showMessage('registerMessage', 'Senha fraca. Use 8+ caracteres, 1 maiúscula, 1 número e 1 símbolo.', 'error');
        return;
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name,
                    phone: phone
                }
            }
        });

        if (error) throw error;
        
        // Mensagem de verificação de e-mail
        showMessage('registerMessage', 'Cadastro realizado! Verifique seu e-mail para ativar sua conta.', 'success');
        document.getElementById('registerForm').reset();
        setTimeout(() => showPage('login'), 2000);

    } catch (error) {
        showMessage('registerMessage', error.message, 'error');
    }
}

// Logout usando Supabase Auth
async function logout() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
        console.error('Erro no logout:', error);
        alert('Erro ao sair. Tente novamente.');
    }
    
     showPage('landing');
    // Recarrega dados públicos (para limpar dados privados que possam estar visíveis)
    loadAdoptionPets();
    loadServices();
}

// Recuperação de Senha
async function handlePasswordReset() {
    const email = document.getElementById('loginEmail').value.trim();
    if (!email) {
        showMessage('loginMessage', 'Digite seu e-mail no campo "Email" para recuperar a senha.', 'error');
        return;
    }

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin, 
        });
        if (error) throw error;
        showMessage('loginMessage', 'Link de recuperação enviado para seu e-mail.', 'success');
    } catch (error) {
        showMessage('loginMessage', error.message, 'error');
    }
}

// Função de proteção de rotas do Frontend Verifica se o usuário está logado no Supabase.
 
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        showPage('login');
        // Lança um erro para parar a execução da função que a chamou
        throw new Error('Usuário não autenticado.'); 
    }
    // Se o e-mail não foi verificado
    if (!user.email_confirmed_at) {
        showPage('login');
        showMessage('loginMessage', 'Sua conta ainda não foi verificada. Verifique seu e-mail.', 'error');
        throw new Error('E-mail não verificado.');
    }
    return user;
}


// 5. EDIÇÃO DE PERFIL
function showProfileEditPage() {
    if (!currentUser) {
        showPage('login');
        return;
    }
    
    const user = currentUser;
    document.getElementById('profileName').value = user.name || '';
    document.getElementById('profileEmail').value = user.email || '';
    document.getElementById('profilePhone').value = user.phone || '';
    document.getElementById('profilePhoto').value = ''; 
    
    showPage('profile-edit');
}

// Lida com o submit do formulário de atualização de perfil (PUT /me)
 async function handleProfileUpdate(event) {
    event.preventDefault();
    
    try {
        await checkAuth(); // Garante que está logado
    } catch (error) {
        showMessage('profileMessage', 'Sessão expirada. Faça login novamente.', 'error');
        return;
    }

    const form = document.getElementById('profileForm');
    const formData = new FormData(form);

    try {
        // Envia os dados para o NOSSO backend (Render)
        const data = await apiFetch('/auth/me', {
            method: 'PUT',
            body: formData,
            isFormData: true 
        });

        showMessage('profileMessage', data.message, 'success');
        
        currentUser = data.user;
        updateAuthButtons();
        setTimeout(() => showPage('landing'), 2000);

    } catch (error) {
        showMessage('profileMessage', error.message, 'error');
    }
}

// 6. GERENCIAMENTO DE PETS

async function showPetRegisterPage(petId = null) {
    try {
        await checkAuth(); 
    } catch (error) {
        return;
    }

    const form = document.getElementById('petRegisterForm');
    const title = document.getElementById('petFormTitle');
    const button = document.getElementById('petFormButton');
    const hiddenId = document.getElementById('petEditId');
    const photoInput = document.getElementById('petPhoto');
    const deleteButtonWrapper = document.getElementById('deletePetButtonWrapper');

    form.reset();
    photoInput.value = ''; 

    if (petId === null) {
        title.textContent = 'Cadastrar Pet';
        button.textContent = 'Cadastrar Pet';
        hiddenId.value = '';
        deleteButtonWrapper.style.display = 'none';
    } else {
       
        const pet = pets.find(p => p.id === petId);
        
        
        if (pet && pet.ownerId == currentUser.id) { 
            title.textContent = 'Atualizar Pet';
            button.textContent = 'Atualizar Pet';
            hiddenId.value = pet.id;
            deleteButtonWrapper.style.display = 'block';

            document.getElementById('petType').value = pet.type;
            document.getElementById('petName').value = pet.name;
            document.getElementById('petSpecies').value = pet.species;
            document.getElementById('petBreed').value = pet.breed;
            document.getElementById('petAge').value = pet.age;
            document.getElementById('petSize').value = pet.size;
            document.getElementById('petGender').value = pet.gender;
            document.getElementById('petDescription').value = pet.description;
        } else {
            alert("Pet não encontrado ou você não tem permissão para editá-lo.");
            return;
        }
    }
    showPage('pet-register');
}


async function handlePetRegistration(event) {
    event.preventDefault();
    
    try {
        await checkAuth();
    } catch (error) {
        showMessage('petRegisterMessage', 'Você precisa estar logado para cadastrar um pet.', 'error');
        return;
    }

    const form = event.target;
    const petId = document.getElementById('petEditId').value;
    
    const formData = new FormData(form);

    if (!formData.get('name') || !formData.get('type') || !formData.get('species') || !formData.get('breed') || 
        !formData.get('age') || !formData.get('size') || !formData.get('gender') || !formData.get('description')) {
        showMessage('petRegisterMessage', 'Por favor, preencha todos os campos.', 'error');
        return;
    }

   
    if (petId) {
        const pet = pets.find(p => p.id === parseInt(petId));
        if (pet && pet.photoUrl) {
            formData.append('photoUrl', pet.photoUrl); 
        }
    }

    try {
        let responseData;
        
        const endpoint = petId ? `/pets/${petId}` : '/pets';
        const method = petId ? 'PUT' : 'POST';

                responseData = await apiFetch(endpoint, {
            method: method,
            body: formData,
            isFormData: true 
        });

        const message = petId ? 'atualizado' : 'cadastrado';
        showMessage('petRegisterMessage', `${responseData.name} foi ${message} com sucesso!`, 'success');
        
        form.reset();
        document.getElementById('petEditId').value = '';
        
      
        setTimeout(() => {
            if (responseData.type === 'adoption') {
                showPage('adoption');
            } else {
                showPage('my-pets');
            }
        }, 1500);

    } catch (error) {
        showMessage('petRegisterMessage', `Erro: ${error.message}`, 'error');
    }
}

async function loadAdoptionPets() {
    const container = document.getElementById('adoptionPets');
    container.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
    
    try {
     
        const filters = getPetFilters();
        const adoptionPets = await apiFetch(`/pets/adoption?${filters}`);
        
        pets = adoptionPets; 
        
        if (adoptionPets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🐾</div>
                    <h3>Nenhum pet disponível</h3>
                    <p>No momento, não há pets para adoção. Volte em breve!</p>
                </div>`;
            return;
        }
        displayPets(adoptionPets, container, true);
    } catch (error) {
        container.innerHTML = `<div class="empty-state"><h3>Erro ao carregar pets. Tente novamente.</h3></div>`;
    }
}


async function loadMyPets() {
    try {
        await checkAuth();
    } catch (error) {
        return; // Para a execução se não estiver logado
    }

    const container = document.getElementById('myPetsGrid');
    container.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;

    try {
        const myPets = await apiFetch('/pets/mypets'); 
        pets = myPets; 

        if (myPets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🐾</div>
                    <h3>Você ainda não tem pets cadastrados</h3>
                    <p>Cadastre seu primeiro pet para começar a usar a carteira de vacinação digital.</p>
                    <button class="btn" onclick="showPetRegisterPage(null)" style="width: auto; padding: 15px 30px;">
                        Cadastrar Meu Primeiro Pet
                    </button>
                </div>`;
            return;
        }
        displayPets(myPets, container, false);
    } catch (error) {
        container.innerHTML = `<div class="empty-state"><h3>Erro ao carregar seus pets. Tente novamente.</h3><p>${error.message}</p></div>`;
    }
}


function getStatusIndicator(pet) {
    if (pet.type === 'personal') {
        return `<span class="status-indicator status-personal">👤 Meu Pet</span>`;
    } else if (pet.status === 'available') {
        return `<span class="status-indicator status-available">🏠 Disponível</span>`;
    } else if (pet.status === 'adopted') {
        return `<span class="status-indicator status-adopted">❤️ Adotado</span>`;
    }
    return '';
}


function displayPets(petsToShow, container, isAdoptionView) {
    container.innerHTML = petsToShow.map(pet => {
        const ownerName = pet.ownerName || 'Dono';
        const upcomingVaccines = getUpcomingVaccines(pet);
        
        const petImage = pet.photoUrl ? `<img src="${pet.photoUrl}" alt="Foto de ${pet.name}">` : getSpeciesIcon(pet.species);
        
        let actionButtons = '';
        if (isAdoptionView) {
            actionButtons = `<button class="btn btn-small" onclick="openPetProfile(${pet.id})">Ver Perfil</button>`;
            if (currentUser) {
                actionButtons += ` <button class="btn btn-small" onclick="showContact(${pet.ownerId}, '${pet.ownerName}', '${pet.ownerPhone}', '${pet.ownerEmail}')" style="background: #38a169;">Contato</button>`;
            } else {
                actionButtons += ` <button class="btn btn-small" onclick="showPage('login')" style="background: #a0aec0;">Logar para Contato</button>`;
            }
        } else { 
            actionButtons = `<button class="btn btn-small" onclick="openPetProfile(${pet.id})">Ver Perfil</button>`;
            
          
            if (currentUser && pet.ownerId == currentUser.id) {
                 actionButtons += `<button class="btn btn-small" onclick="showPetRegisterPage(${pet.id})" style="background: #4299e1;">Editar</button>`;
            }

            if (pet.type === 'personal') {
                actionButtons += `<button class="btn btn-small" onclick="openVaccinationModal(${pet.id})" style="background: #ed8936;">+ Vacina</button>`;
            } else if (pet.type === 'adoption' && pet.status === 'available') {
               
                if (currentUser && pet.ownerId == currentUser.id) {
                    actionButtons += `<button class="btn btn-small" onclick="markAsAdopted(${pet.id})" style="background: #38a169;">Marcar como Adotado</button>`;
                }
            }
        }

        return `
            <div class="pet-card">
                <div class="pet-image">
                    ${petImage}
                </div>
                <div class="pet-info">
                    <div class="pet-name">${pet.name}</div>
                    <div class="pet-details">
                        <div class="pet-detail-item">
                            <span>Espécie:</span>
                            <span>${getSpeciesIcon(pet.species)} ${pet.species === 'dog' ? 'Cão' : pet.species === 'cat' ? 'Gato' : pet.species}</span>
                        </div>
                        <div class="pet-detail-item">
                            <span>Idade:</span>
                            <span>${getAgeLabel(pet.age)}</span>
                        </div>
                        <div class="pet-detail-item">
                            <span>Porte:</span>
                            <span>${getSizeLabel(pet.size)}</span>
                        </div>
                    </div>
                    <div class="pet-description">${pet.description}</div>
                    ${upcomingVaccines.length > 0 ? 
                        `<div style="background: #fff8e1; padding: 10px; border-radius: 8px; margin-bottom: 15px; border-left: 3px solid #ed8936;">
                            <small style="color: #ed8936; font-weight: 600;">⚠️ ${upcomingVaccines.length} vacina(s) próxima(s) do vencimento</small>
                        </div>` : ''
                    }
                    <div class="pet-actions">${actionButtons}</div>
                    <div style="margin-top: 10px;">${getStatusIndicator(pet)}</div>
                </div>
            </div>
        `;
    }).join('');
}


async function deletePetFromForm() {
    try {
        await checkAuth(); 
    } catch (error) {
        return; 
    }

    const petId = document.getElementById('petEditId').value;
    if (!petId) return;

    if (confirm("Tem certeza de que deseja excluir este pet? Esta ação não pode ser desfeita.")) {
        try {
            await apiFetch(`/pets/${petId}`, { method: 'DELETE' });
            showMessage('petRegisterMessage', 'Pet excluído com sucesso.', 'success');
            setTimeout(() => showPage('my-pets'), 1500);
        } catch (error) {
            showMessage('petRegisterMessage', `Erro ao excluir: ${error.message}`, 'error');
        }
    }
}
    

async function markAsAdopted(petId) {
    try {
        await checkAuth();
    } catch (error) {
        return; 
    }

    if (confirm("Você tem certeza que deseja marcar este pet como adotado? Esta ação removerá o pet da lista pública de adoção.")) {
        try {
            await apiFetch(`/pets/${petId}/adopt`, { method: 'PUT' });
            loadMyPets(); 
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    }
}

function getPetFilters() {
    const search = document.getElementById('searchFilter')?.value || '';
    const species = document.getElementById('speciesFilter')?.value || '';
    const size = document.getElementById('sizeFilter')?.value || '';
    const age = document.getElementById('ageFilter')?.value || '';
    
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (species) params.append('species', species);
    if (size) params.append('size', size);
    if (age) params.append('age', age);

    return params.toString();
}

function filterPets() {
    loadAdoptionPets();
}


 function clearFilters() {
    document.getElementById('searchFilter').value = '';
    document.getElementById('speciesFilter').value = '';
    document.getElementById('sizeFilter').value = '';
    document.getElementById('ageFilter').value = '';
    loadAdoptionPets();
}

// 7. GERENCIAMENTO DE SERVIÇOS

async function loadServices() {
    const container = document.getElementById('servicesGrid'); 
    if (!container) return;
    
    container.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
    
   
    const searchTerm = document.getElementById('serviceSearchFilter')?.value || '';
    const category = document.getElementById('serviceCategoryFilter')?.value || '';
    
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (category) params.append('category', category);

    try {
        const services = await apiFetch(`/services?${params.toString()}`);
        serviceProviders = services; 
        displayServiceProviders(services, container);
    } catch (error) {
        container.innerHTML = `<div class="empty-state"><h3>Erro ao carregar serviços.</h3></div>`;
    }
}


function displayServiceProviders(providersToShow, container) {
    if (!container) return;

    if (providersToShow.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🤷</div>
                <h3>Nenhum profissional encontrado</h3>
                <p>Tente ajustar os filtros de busca.</p>
            </div>`;
    } else {
        container.innerHTML = providersToShow.map(provider => {
            
            let providerDetails = `<p><strong>Descrição:</strong> ${provider.description}</p>`;
            let providerActionsContent = '';
            
            // O backend retorna "Faça login para ver" se o usuário não estiver logado
            const isLoggedIn = (provider.phone !== "Faça login para ver");

            if (isLoggedIn) {
                providerDetails += `<p><strong>Endereço:</strong> ${provider.address}</p>`;
                providerActionsContent += `
                    <a href="tel:${provider.phone.replace(/\D/g,'')}" class="btn btn-small" style="background: #38a169;">
                        📞 Ligar (${provider.phone})
                    </a>`;
                
                // Botão de API de Mapas
                if (provider.latitude && provider.longitude) {
                    providerActionsContent += `
                        <button class="btn btn-small" onclick='showServiceMapInModal(${JSON.stringify(provider)})' style="background: #3182ce;">
                            🗺️ Ver no Mapa
                        </button>`;
                }
                
            if (currentUser && currentUser.id == provider.ownerId) {
                    providerActionsContent += `
                        <button class="btn btn-small" onclick="showServiceRegisterPage(${provider.id})" style="background: #4299e1;">
                            Editar
                        </button>`;
                }
            } else {
                providerDetails += `
                    <div class="service-contact-locked" style="margin-top: 15px; padding: 10px; background: #f7fafc; border-radius: 8px; text-align: center;">
                        <p style="color: #718096; font-size: 0.9rem;">
                            🔒 Faça login para ver o endereço e telefone.
                        </p>
                    </div>`;
                providerActionsContent = `
                    <button class="btn btn-small" onclick="showPage('login')" style="background: #a0aec0;">
                        Fazer Login
                    </button>`;
            }

            return `
                <div class="provider-card">
                    <div class="provider-header">
                        <h3 class="provider-name">${provider.name}</h3>
                        <span class="provider-professional">${provider.professional}</span>
                    </div>
                    <div class="provider-info">
                        ${providerDetails}
                    </div>
                    <div class="pet-actions" style="flex-direction: column;">
                         ${providerActionsContent}
                    </div>
                </div>
            `;
        }).join('');
    }
}


function filterServices() {
    loadServices();
}

async function showServiceRegisterPage(serviceId = null) {
    try {
        await checkAuth(); 
    } catch (error) {
        return; 
    }

    const form = document.getElementById('serviceRegisterForm');
    const title = document.getElementById('serviceFormTitle');
    const button = document.getElementById('serviceFormButton');
    const hiddenId = document.getElementById('serviceEditId');
    const deleteButtonWrapper = document.getElementById('deleteServiceButtonWrapper');

    form.reset();

    if (serviceId === null) {
        title.textContent = 'Cadastrar Serviço';
        button.textContent = 'Cadastrar Serviço';
        hiddenId.value = '';
        deleteButtonWrapper.style.display = 'none';
        
        getDeviceLocationForServiceForm();
    } else {
        const service = serviceProviders.find(s => s.id === serviceId);
        
        
           if (service && service.ownerId == currentUser.id) {
            title.textContent = 'Atualizar Serviço';
            button.textContent = 'Atualizar Serviço';
            hiddenId.value = service.id;
            deleteButtonWrapper.style.display = 'block';

            document.getElementById('serviceCategory').value = service.category;
            document.getElementById('serviceName').value = service.name;
            document.getElementById('serviceProfessional').value = service.professional;
            document.getElementById('servicePhone').value = service.phone;
            document.getElementById('serviceAddress').value = service.address;
            document.getElementById('serviceDescription').value = service.description;
        } else {
            alert("Serviço não encontrado ou você não tem permissão para editá-lo.");
            return;
        }
    }
    showPage('service-register');
}


async function handleServiceRegistration(event) {
    event.preventDefault();

    try {
        await checkAuth();
    } catch (error) {
        showMessage('serviceRegisterMessage', 'Você precisa estar logado para cadastrar um serviço.', 'error');
        return;
    }

    const formData = new FormData(event.target);
    const serviceData = Object.fromEntries(formData);
    const serviceId = document.getElementById('serviceEditId').value;
    
    serviceData.latitude = document.getElementById('serviceLatitude')?.value || null;
    serviceData.longitude = document.getElementById('serviceLongitude')?.value || null;

    if (!serviceData.category || !serviceData.name || !serviceData.professional || !serviceData.phone || !serviceData.address || !serviceData.description) {
        showMessage('serviceRegisterMessage', 'Por favor, preencha todos os campos.', 'error');
        return;
    }

    try {
        if (serviceId) {
            await apiFetch(`/services/${serviceId}`, {
                method: 'PUT',
                body: JSON.stringify(serviceData)
            });
            showMessage('serviceRegisterMessage', 'Serviço atualizado com sucesso!', 'success');
        } else {
            await apiFetch('/services', {
                method: 'POST',
                body: JSON.stringify(serviceData)
            });
            showMessage('serviceRegisterMessage', 'Serviço cadastrado com sucesso!', 'success');
        }
        
        document.getElementById('serviceRegisterForm').reset();
        document.getElementById('serviceEditId').value = '';
        setTimeout(() => showPage('services'), 2000);

    } catch (error) {
         showMessage('serviceRegisterMessage', `Erro: ${error.message}`, 'error');
    }
}

async function deleteServiceFromForm() {
    try {
        await checkAuth();
    } catch (error) {
        return; 
    }

    const serviceId = document.getElementById('serviceEditId').value;
    if (!serviceId) return;

    if (confirm("Tem certeza de que deseja excluir este serviço? Esta ação não pode ser desfeita.")) {
        try {
            await apiFetch(`/services/${serviceId}`, { method: 'DELETE' });
            showMessage('serviceRegisterMessage', 'Serviço excluído com sucesso.', 'success');
            setTimeout(() => showPage('services'), 1500);
        } catch (error) {
            showMessage('serviceRegisterMessage', `Erro ao excluir: ${error.message}`, 'error');
        }
    }
}

// 8. GERENCIAMENTO DE VACINAS
async function handleVaccination(event) {
    event.preventDefault();
    
    try {
        await checkAuth();
    } catch (error) {
        alert('Sessão expirada. Faça login novamente para adicionar vacinas.');
        return;
    }
    
    const petId = parseInt(document.getElementById('vaccinePetId').value);
    const name = document.getElementById('vaccineName').value.trim();
    const date = document.getElementById('vaccineDate').value;
    const nextDate = document.getElementById('vaccineNext').value;
    const vet = document.getElementById('vaccineVet').value.trim();
    const notes = document.getElementById('vaccineNotes').value.trim();

    if (!name || !date) {
        alert('Por favor, preencha os campos obrigatórios (Nome da Vacina e Data).');
        return;
    }

    const vaccineData = {
        name,
        date,
        nextDate: nextDate || null,
        vet: vet || null,
        notes: notes || null
    };

    try {
        
        const newVaccine = await apiFetch(`/pets/${petId}/vaccines`, {
            method: 'POST',
            body: JSON.stringify(vaccineData)
        });
        
      
        const pet = pets.find(p => p.id === petId);
        if (pet) {
            
            pet.vaccines.unshift(newVaccine);
        }
        
        closeVaccinationModal();
        openPetProfile(petId); 

        if (document.getElementById('my-pets').classList.contains('active')) {
            loadMyPets(); 
        }
    } catch (error) {
        alert(`Erro ao adicionar vacina: ${error.message}`);
    }
}


function getUpcomingVaccines(pet) {
    if (!pet || !pet.vaccines) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    return pet.vaccines.filter(vaccine => {
        if (!vaccine.nextDate) return false;
        
        const nextDate = new Date(vaccine.nextDate);
        
        nextDate.setMinutes(nextDate.getMinutes() + nextDate.getTimezoneOffset());

        return nextDate >= today && nextDate <= thirtyDaysFromNow;
    });
}


function isVaccineUpcoming(vaccine) {
    if (!vaccine.nextDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    const nextDate = new Date(vaccine.nextDate);
    
    nextDate.setMinutes(nextDate.getMinutes() + nextDate.getTimezoneOffset());
    
    return nextDate >= today && nextDate <= thirtyDaysFromNow;
}

// FUNÇÕES DE MODAL 

async function openVaccinationModal(petId) {
    try {
        await checkAuth(); 
    } catch (error) {
        return;
    }
    
    document.getElementById('vaccinePetId').value = petId;
    document.getElementById('vaccinationForm').reset();
    document.getElementById('vaccinationModal').classList.add('active');
}


function closeVaccinationModal() {
    document.getElementById('vaccinationModal').classList.remove('active');
}


// 9. GERENCIAMENTO DE MODAIS

function openPetProfile(petId) {
    const pet = pets.find(p => p.id === petId);
    if (!pet) return;

   
   // Compara o ID do dono do pet com o ID do usuário logado (currentUser.id)
   const isOwner = currentUser && (currentUser.id == pet.ownerId);
   const petImage = pet.photoUrl ? `<img src="${pet.photoUrl}" alt="Foto de ${pet.name}" style="width: 100%; height: 100%; object-fit: cover;">` : getSpeciesIcon(pet.species);

    let adoptionButton = '';
    // Se for pet de adoção, disponível, e o usuário NÃO for o dono
    if (pet.type === 'adoption' && pet.status === 'available' && !isOwner) {
        if (currentUser) {
            adoptionButton = `
                <div style="text-align: center; margin-top: 25px;">
                    <button class="btn" onclick="showContact(${pet.ownerId}, '${pet.ownerName}', '${pet.ownerPhone}', '${pet.ownerEmail}')" style="background: #38a169; width: auto; padding: 15px 30px;">
                        💬 Entrar em Contato para Adoção
                    </button>
                </div>`;
        } else {
             adoptionButton = `
                <div style="text-align: center; margin-top: 25px;">
                    <button class="btn" onclick="showPage('login')" style="background: #a0aec0; width: auto; padding: 15px 30px;">
                        Faça login para ver o contato
                    </button>
                </div>`;
        }
    // Se o usuário FOR o dono e o pet estiver para adoção
    } else if (isOwner && pet.type === 'adoption' && pet.status === 'available') {
         adoptionButton = `
            <div style="text-align: center; margin-top: 25px;">
                <button class="btn" onclick="markAsAdopted(${pet.id}); closePetModal();" style="background: #38a169; width: auto; padding: 15px 30px;">
                    Marcar como Adotado
                </button>
            </div>`;
    }

    document.getElementById('petModalContent').innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 5rem; margin-bottom: 15px; width: 150px; height: 150px; border-radius: 50%; overflow: hidden; margin: 0 auto; background: #f0f0f0; display: flex; align-items: center; justify-content: center;">
                ${petImage}
            </div>
            <h2 style="color: #2d3748; margin-bottom: 10px;">${pet.name}</h2>
            <p style="color: #718096;">Cadastrado em ${formatDate(pet.createdAt)}</p>
            <div>${getStatusIndicator(pet)}</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 25px; background: #f9f9f9; padding: 15px; border-radius: 10px;">
            <div class="pet-detail-item">
                <span><strong>Espécie:</strong></span>
                <span>${getSpeciesIcon(pet.species)} ${pet.species === 'dog' ? 'Cão' : 'Gato'}</span>
            </div>
            <div class="pet-detail-item">
                <span><strong>Idade:</strong></span>
                <span>${getAgeLabel(pet.age)}</span>
            </div>
            <div class="pet-detail-item">
                <span><strong>Porte:</strong></span>
                <span>${getSizeLabel(pet.size)}</span>
            </div>
            <div class="pet-detail-item">
                <span><strong>Sexo:</strong></span>
                <span>${getGenderLabel(pet.gender)}</span>
            </div>
        </div>
        <div style="margin-bottom: 25px;">
            <h4 style="color: #2d3748; margin-bottom: 10px; font-size: 1.1rem;">📝 Sobre ${pet.name}</h4>
            <p style="color: #4a5568; line-height: 1.6; background: #f7fafc; padding: 15px; border-radius: 10px;">${pet.description}</p>
        </div>

        <div class="vaccination-section">
            <div class="vaccination-header">
                <h3>💉 Carteira de Vacinação</h3>
                ${isOwner ? `<button class="btn btn-small" onclick="openVaccinationModal(${pet.id})">+ Adicionar Vacina</button>` : ''}
            </div>
            <div class="vaccination-list">
                ${pet.vaccines.length > 0 ? pet.vaccines.sort((a, b) => new Date(b.date) - new Date(a.date)).map(vaccine => `
                    <div class="vaccination-item ${isVaccineUpcoming(vaccine) ? 'upcoming' : ''}">
                        <div class="vaccination-info">
                            <h4>💉 ${vaccine.name}</h4>
                            <p>Aplicada em ${formatDate(vaccine.date)} ${vaccine.vet ? `(Vet: ${vaccine.vet})` : ''}</p>
                            ${vaccine.notes ? `<p style="font-size: 0.85rem; color: #718096; margin-top: 5px;"><i>Obs: ${vaccine.notes}</i></p>` : ''}
                        </div>
                        <div class="vaccination-date ${isVaccineUpcoming(vaccine) ? 'upcoming' : ''}">
                            ${vaccine.nextDate ? `Próxima: ${formatDate(vaccine.nextDate)}` : 'Dose única'}
                        </div>
                    </div>
                `).join('') : `
                    <div style="text-align: center; padding: 40px 20px; color: #718096; background: #fdfdfd; border-radius: 8px;">
                        Nenhuma vacina registrada.
                        ${isOwner ? '<br/>Use o botão "+ Adicionar Vacina" para começar.' : ''}
                    </div>
                `}
            </div>
        </div>
        ${adoptionButton}
    `;

    document.getElementById('petModal').classList.add('active');
}


function closePetModal() {
    document.getElementById('petModal').classList.remove('active');
}


async function openVaccinationModal(petId) {
    try {
        await checkAuth(); 
    } catch (error) {
        return; 
    }
    
    document.getElementById('vaccinePetId').value = petId;
    document.getElementById('vaccinationForm').reset();
    document.getElementById('vaccinationModal').classList.add('active');
}


function closeVaccinationModal() {
    document.getElementById('vaccinationModal').classList.remove('active');
}

function showContact(ownerId, ownerName, ownerPhone, ownerEmail) {

    document.getElementById('contactModalContent').innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 4rem; margin-bottom: 15px;">👤</div>
            <h3 style="color: #2d3748; margin-bottom: 5px;">${ownerName}</h3>
            <p style="color: #718096;">Responsável pelo pet</p>
        </div>
        <div style="background: #f7fafc; border-radius: 10px; padding: 25px; margin-bottom: 25px;">
            <h4 style="color: #2d3748; margin-bottom: 15px;">📞 Informações de Contato</h4>
            <div style="margin-bottom: 15px;">
                <strong style="color: #4a5568;">Email:</strong>
                <a href="mailto:${ownerEmail}" style="color: #667eea; text-decoration: none; margin-left: 10px;">${ownerEmail}</a>
            </div>
            <div>
                <strong style="color: #4a5568;">Telefone:</strong>
                <a href="tel:${ownerPhone.replace(/\D/g,'')}" style="color: #667eea; text-decoration: none; margin-left: 10px;">${ownerPhone}</a>
            </div>
        </div>
    `;

    document.getElementById('contactModal').classList.add('active');
}

function closeContactModal() {
    document.getElementById('contactModal').classList.remove('active');
}

// ===================================================================
// 10. GERENCIAMENTO DO BLOG
// ===================================================================


function toggleNewPostForm(show) {
    const postContainer = document.getElementById('new-post-container');
    const blogActions = document.getElementById('blog-actions');

    if (show) {
          showPostForm(null); 
        postContainer.style.display = 'block';
        blogActions.style.display = 'none';
        postContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        postContainer.style.display = 'none';
        // Mostra o botão "+ Escrever Novo Post" apenas se o usuário estiver logado
        if (currentUser) {
            blogActions.style.display = 'block';
        }
    }
}

async function loadBlogPosts() {
    const postContainer = document.getElementById('new-post-container');
    const blogActions = document.getElementById('blog-actions');
    const feedContainer = document.getElementById('blogFeed');

    // Controla a visibilidade dos botões de ação do blog
    if (currentUser) {
        blogActions.style.display = 'block';
        // Esconde o formulário se não estiver em modo de edição
        if (!document.getElementById('postEditId').value) {
             postContainer.style.display = 'none';
        }
    } else {
        blogActions.style.display = 'none';
        postContainer.style.display = 'none';
    }

    feedContainer.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
    
    try {
        const posts = await apiFetch('/blog'); 
        blogPosts = posts; 
        displayBlogPosts(posts, feedContainer);
    } catch (error) {
        feedContainer.innerHTML = `<div class="empty-state"><h3>Erro ao carregar o blog. Tente novamente.</h3></div>`;
    }
}

function displayBlogPosts(posts, container) {
    if (posts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📣</div>
                <h3>Ainda não há posts</h3>
                <p>Seja o primeiro a postar! Faça login e compartilhe algo.</p>
            </div>`;
        return;
    }

    container.innerHTML = posts.map(post => {
        const ownerName = post.ownerName || 'Usuário';
        const isOwner = currentUser && (currentUser.id == post.ownerId);
        const postImageHTML = post.photoUrl 
            ? `<img src="${post.photoUrl}" alt="Foto do post" class="post-image">` 
            : '';

        const postLocationHTML = post.location 
            ? `<div class="post-location">📍 ${post.location}</div>` 
            : '';

        const editButtonHTML = isOwner
            ? `<button class="post-actions-btn" onclick="showPostForm(${post.id})">Editar</button>`
            : '';
            
        let avatarHtml = '';
        if (post.ownerPhotoUrl) {
            avatarHtml = `<img src="${post.ownerPhotoUrl}" alt="${ownerName}" class="post-author-avatar-img">`;
        } else {
            const avatarLetter = ownerName.charAt(0).toUpperCase();
            avatarHtml = `${avatarLetter}`;
        }

        const userHasLiked = currentUser && post.likes.includes(currentUser.id);
        const likeBtnActive = userHasLiked ? 'active' : '';
        const likeCount = post.likes.length;
        const likeText = likeCount === 1 ? 'curtida' : 'curtidas';

        // Lógica de Comentários
        const commentsHTML = post.comments.map(comment => `
            <div class="comment-item">
                <strong class="comment-author">${comment.ownerName || 'Usuário'}</strong>
                <p class="comment-content">${comment.content}</p>
            </div>
        `).join('');

        const commentFormHTML = currentUser ? `
            <form class="post-comment-form" onsubmit="handleCommentSubmit(event, ${post.id})">
                <input type="text" class="comment-input" placeholder="Escreva um comentário..." required>
                <button type="submit" class="comment-submit-btn">Enviar</button>
            </form>
        ` : '';

        return `
            <div class="post-card" id="post-${post.id}">
                <div class="post-header">
                    <div class="post-author-info">
                        <div class="post-author-avatar">
                            ${avatarHtml}
                        </div>
                        <div class="post-author-details">
                            <span class="post-author-name">${ownerName}</span>
                            <span class="post-date">${formatDateTime(post.createdAt)}</span>
                        </div>
                    </div>
                    <div class="post-actions-menu">${editButtonHTML}</div>
                </div>
                <div class="post-body">
                    <div class="post-content">${post.content}</div>
                    ${postLocationHTML}
                    ${postImageHTML}
                </div>
                <div class="post-footer">
                    <button class="like-btn ${likeBtnActive}" onclick="toggleLike(${post.id})">
                        ❤️ Curtir
                    </button>
                    <span class="like-count">${likeCount} ${likeText}</span>
                </div>
                <div class="post-comments">
                    <div class="post-comments-list">
                        ${commentsHTML.length > 0 ? commentsHTML : '<p style="font-size: 0.9rem; color: #718096; text-align: center; padding: 10px 0;">Seja o primeiro a comentar!</p>'}
                    </div>
                    ${commentFormHTML}
                </div>
            </div>`;
    }).join('');
}

async function showPostForm(postId = null) {
    try {
        await checkAuth(); 
    } catch (error) {
        return; // Para a execução se não estiver logado
    }

    const form = document.getElementById('postForm');
    const title = document.getElementById('postFormTitle');
    const button = document.getElementById('postFormButton');
    const hiddenId = document.getElementById('postEditId');
    const deleteButtonWrapper = document.getElementById('deletePostButtonWrapper');
    const photoInput = document.getElementById('postPhoto');
    
    document.getElementById('new-post-container').style.display = 'block';
    document.getElementById('blog-actions').style.display = 'none';

    form.reset();
    photoInput.value = '';

    if (postId === null) {
        title.textContent = 'Novo Post';
        button.textContent = 'Publicar';
        hiddenId.value = '';
        deleteButtonWrapper.style.display = 'none';
        getDeviceLocationForPostForm();
    } else {
        const post = blogPosts.find(p => p.id === postId);
        if (post && post.ownerId == currentUser.id) {
            title.textContent = 'Editar Post';
            button.textContent = 'Atualizar';
            hiddenId.value = post.id;
            deleteButtonWrapper.style.display = 'flex';

            document.getElementById('postContent').value = post.content;
            document.getElementById('postLocation').value = post.location;
            
            document.getElementById('new-post-container').scrollIntoView({ behavior: 'smooth', block: 'center' });

        } else {
            alert("Post não encontrado ou você não tem permissão para editá-lo.");
            toggleNewPostForm(false);
            return;
        }
    }
}

async function handlePostSubmit(event) {
    event.preventDefault();
    
    try {
        await checkAuth();
    } catch (error) {
        showMessage('postMessage', 'Você precisa estar logado para postar.', 'error');
        return;
    }

    const form = event.target;
    const postId = document.getElementById('postEditId').value;
    const formData = new FormData(form);

    if (!formData.get('content')) {
        showMessage('postMessage', 'O conteúdo do post não pode estar vazio.', 'error');
        return;
    }
    
    // Lógica para manter a foto antiga ao editar (se nenhuma nova for enviada)
    if (postId) {
        const post = blogPosts.find(p => p.id === parseInt(postId));
        // Se não houver arquivo novo (req.file) E o post antigo tiver foto,
        // envia a URL antiga para o backend não apagar.
        if (!formData.get('photo').size && post && post.photoUrl) {
            formData.append('photoUrl', post.photoUrl);
        }
    }
    
    try {
        const endpoint = postId ? `/blog/${postId}` : '/blog';
        const method = postId ? 'PUT' : 'POST';

        await apiFetch(endpoint, {
            method: method,
            body: formData,
            isFormData: true
        });
        
        const message = postId ? 'atualizado' : 'publicado';
        showMessage('postMessage', `Post ${message} com sucesso!`, 'success');

        toggleNewPostForm(false);
        loadBlogPosts();
    } catch (error) {
        showMessage('postMessage', `Erro: ${error.message}`, 'error');
    }
}

//(Protegida) Deleta um post a partir do formulário de edição
 async function deletePostFromForm() {
    try {
        await checkAuth(); 
    } catch (error) {
        return; 
    }

    const postId = document.getElementById('postEditId').value;
    if (!postId) return;

    if (confirm("Tem certeza de que deseja excluir este post? Esta ação não pode ser desfeita.")) {
        try {
            await apiFetch(`/blog/${postId}`, { method: 'DELETE' });
            toggleNewPostForm(false);
            loadBlogPosts(); // Recarrega o feed
        } catch (error) {
            alert(`Erro ao excluir: ${error.message}`);
        }
    }
}

// (Protegida) Adiciona ou remove um like de um post
async function toggleLike(postId) {
    try {
        await checkAuth(); 
    } catch (error) {
        return; 
    }

    try {
        // A API cuida da lógica de adicionar/remover
        await apiFetch(`/blog/${postId}/like`, { method: 'POST' });

        const post = blogPosts.find(p => p.id === postId);
        const likeButton = document.querySelector(`#post-${postId} .like-btn`);
        const likeCountSpan = document.querySelector(`#post-${postId} .like-count`);
        const myUserId = currentUser.id;

        if (post.likes.includes(myUserId)) {
            // Remove o like localmente
            post.likes = post.likes.filter(id => id !== myUserId);
            likeButton.classList.remove('active');
        } else {
            // Adiciona o like localmente
            post.likes.push(myUserId);
            likeButton.classList.add('active');
        }

        const likeCount = post.likes.length;
        const likeText = likeCount === 1 ? 'curtida' : 'curtidas';
        likeCountSpan.textContent = `${likeCount} ${likeText}`;
        
    } catch (error) {
        alert(`Erro ao curtir: ${error.message}`);
        // Se der erro, recarrega tudo para garantir consistência
        loadBlogPosts();
    }
}


async function handleCommentSubmit(event, postId) {
    event.preventDefault();
    try {
        await checkAuth(); 
    } catch (error) {
        return; 
    }

    const form = event.target;
    const input = form.querySelector('.comment-input');
    const content = input.value.trim();

    if (!content) return;

    try {
        const newComment = await apiFetch(`/blog/${postId}/comment`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
        
        input.value = '';

        
        const post = blogPosts.find(p => p.id === postId);
        post.comments.push(newComment); 
        // Renderiza apenas o novo comentário
        const commentsList = document.querySelector(`#post-${postId} .post-comments-list`);
        const newCommentHTML = `
            <div class="comment-item">
                <strong class="comment-author">${newComment.ownerName}</strong>
                <p class="comment-content">${newComment.content}</p>
            </div>
        `;
        
        // Remove o texto "Seja o primeiro a comentar" se for o primeiro comentário
        if (commentsList.querySelector('p')) {
            commentsList.innerHTML = newCommentHTML;
        } else {
            commentsList.innerHTML += newCommentHTML;
        }
        commentsList.scrollTop = commentsList.scrollHeight; // Rola para o novo comentário

    } catch (error) {
        alert(`Erro ao comentar: ${error.message}`);
    }
}


// 11. INTEGRAÇÃO APIs UNIDADE IV (Geolocalização e Mapas)

//  API de Geolocalização (Sensor). Tenta obter a localização e preencher o formulário de POST.

function getDeviceLocationForPostForm() {
    const locationInput = document.getElementById('postLocation');
    if (!locationInput) return;

    if ('geolocation' in navigator) {
        locationInput.placeholder = "Obtendo localização...";
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                // Usa API de "Geocoding Reverso" (OpenStreetMap)
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                    const data = await response.json();
                    if (data.address) {
                        locationInput.value = data.address.city || data.address.town || 'Localização obtida';
                    } else {
                        locationInput.value = `Lat: ${lat.toFixed(3)}, Lon: ${lon.toFixed(3)}`;
                    }
                } catch (e) {
                     locationInput.value = `Lat: ${lat.toFixed(3)}, Lon: ${lon.toFixed(3)}`;
                }
            },
            (error) => {
                console.warn("Erro ao obter localização:", error.message);
                locationInput.placeholder = "Ex: Manaus, AM";
            },
            { timeout: 5000 } // Timeout de 5 segundos
        );
    }
}

// API de Geolocalização (Sensor). Tenta obter lat/lon e preencher o formulário de SERVIÇO.
function getDeviceLocationForServiceForm() {
    // Adiciona campos hidden ao formulário de serviço
    const form = document.getElementById('serviceRegisterForm');
    if (!document.getElementById('serviceLatitude')) {
        form.insertAdjacentHTML('beforeend', `
            <input type="hidden" id="serviceLatitude" name="latitude">
            <input type="hidden" id="serviceLongitude" name="longitude">
        `);
    }
    
    const latInput = document.getElementById('serviceLatitude');
    const lonInput = document.getElementById('serviceLongitude');
    const addressInput = document.getElementById('serviceAddress');

    if ('geolocation' in navigator) {
        addressInput.placeholder = "Obtendo coordenadas...";
        navigator.geolocation.getCurrentPosition(
            (position) => {
                latInput.value = position.coords.latitude;
                lonInput.value = position.coords.longitude;
                addressInput.placeholder = "Coordenadas obtidas! Preencha o endereço.";
            },
            (error) => {
                console.warn("Erro ao obter localização:", error.message);
                addressInput.placeholder = "Ex: Rua das Flores, 123 - Centro";
            }
        );
    }
}

// API de Mapas (Leaflet.js). Mostra o mapa do serviço no modal de contato.
function showServiceMapInModal(service) {
    if (!service.latitude || !service.longitude) {
        alert('Este serviço não possui localização no mapa.');
        return;
    }

    const modalContent = document.getElementById('contactModalContent');
    modalContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h3 style="color: #2d3748;">${service.name}</h3>
            <p style="color: #718096;">${service.address}</p>
        </div>
        <div id="serviceMapContainer" style="height: 400px; width: 100%; border-radius: 10px;"></div>
    `;
    
    document.getElementById('contactModal').classList.add('active');

    // Leaflet precisa que o container esteja visível para renderizar
    // Usamos um timeout para garantir
    setTimeout(() => {
        try {
            const map = L.map('serviceMapContainer').setView([service.latitude, service.longitude], 16);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);

            L.marker([service.latitude, service.longitude]).addTo(map)
                .bindPopup(`<strong>${service.name}</strong><br>${service.professional}`)
                .openPopup();
        } catch(e) {
            console.error("Erro ao renderizar mapa Leaflet:", e);
            modalContent.innerHTML += "<p>Erro ao carregar o mapa.</p>";
        }
    }, 100);
}

// ===================================================================
// 12. INICIALIZAÇÃO E EVENT LISTENERS
// ===================================================================

document.addEventListener('DOMContentLoaded', function() {
       
    // Seção 4: Autenticação
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Seção 5: Perfil
    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);

    // Seção 6: Pets
    document.getElementById('petRegisterForm').addEventListener('submit', handlePetRegistration);
    
    // Seção 7: Serviços
    document.getElementById('serviceRegisterForm').addEventListener('submit', handleServiceRegistration);

    // Seção 8: Vacinas
    document.getElementById('vaccinationForm').addEventListener('submit', handleVaccination);
    
    // Seção 10: Blog
    document.getElementById('postForm').addEventListener('submit', handlePostSubmit);

    // Fecha qualquer modal ao clicar no fundo (fora do conteúdo)
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Define a data máxima para "Data de Aplicação" da vacina como "hoje"
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('vaccineDate').max = today;

    // Isso substitui a antiga função 'checkLocalStorageLogin()'
    supabase.auth.onAuthStateChange(async (event, session) => {
        
        console.log('Supabase Auth Event:', event, session);

        // Eventos que indicam que o usuário está (ou deveria estar) logado
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
            if (session) {
                try {
                    const profile = await apiFetch('/auth/me'); 
                    // Armazena o perfil (id, name, email, role, etc.)
                    currentUser = profile; 
                    
                } catch (error) {
                    // Erro crítico: O usuário existe no Supabase Auth,
                    // mas não foi encontrado no nosso banco de dados 'users' (GET /me falhou).
                    // Isso pode acontecer se o Trigger (Req 1) falhar.
                    console.error("Erro ao buscar perfil do usuário:", error.message);
                    currentUser = null;
                    // Força o logout do Supabase para evitar um estado inconsistente
                    await supabase.auth.signOut();
                }
            } else {
                // Sessão é nula, usuário não está logado
                currentUser = null;
            }
            // Atualiza a UI (avatar, botões de login/logout)
            updateAuthButtons();
        
        // Evento que indica que o usuário fez logout
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            updateAuthButtons(); // Atualiza a UI
            
            // Recarrega dados públicos para limpar informações privadas
            // que poderiam estar visíveis (ex: botões de editar)
            loadAdoptionPets();
            loadServices();
            loadBlogPosts();
        }
    });

    // Carrega a página inicial de adoção (pública)
    // O listener onAuthStateChange cuidará de logar o usuário
    // automaticamente se ele tiver uma sessão salva.
    loadAdoptionPets();
});