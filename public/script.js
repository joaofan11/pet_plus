const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let allPets = []; 
let db; 

let mapInstance;
let registerMapInstance;
let marker;

// =================================================================
// FUNÇÕES AUXILIARES (SQLite)
// =================================================================
// ... (initDb, saveDb - Sem alterações) ...
// Salva o banco de dados no localStorage
function saveDb() {
    try {
        const data = db.export();
        const str = String.fromCharCode.apply(null, data);
        localStorage.setItem('petplus_db', btoa(str)); // Salva em Base64
    } catch (err) {
        console.error("Erro ao salvar DB local:", err);
    }
}

// Inicializa o banco de dados SQLite
async function initDb() {
    try {
        const sqlPromise = initSqlJs({ 
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}` 
        });

        let dbData = null;
        const localDbStr = localStorage.getItem('petplus_db');
        if (localDbStr) {
            const str = atob(localDbStr);
            dbData = new Uint8Array(str.length);
            for (let i = 0; i < str.length; i++) {
                dbData[i] = str.charCodeAt(i);
            }
        }

        const SQL = await sqlPromise;
        if (dbData) {
            db = new SQL.Database(dbData);
        } else {
            db = new SQL.Database();
            // Criar tabelas se o banco for novo (schema do database.sql)
            db.run(`
                CREATE TABLE pets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    owner_id INTEGER NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    species VARCHAR(50) NOT NULL,
                    breed VARCHAR(100),
                    age VARCHAR(50),
                    size VARCHAR(50),
                    gender VARCHAR(50),
                    pet_type VARCHAR(50) NOT NULL, 
                    status VARCHAR(50) NOT NULL,
                    description TEXT,
                    photo_path VARCHAR(255),
                    latitude DECIMAL(10, 8),
                    longitude DECIMAL(11, 8),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            db.run(`
                CREATE TABLE vaccines (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
                    name VARCHAR(255) NOT NULL,
                    vaccine_date DATE NOT NULL,
                    next_date DATE,
                    vet VARCHAR(255),
                    notes TEXT
                );
            `);
            saveDb();
        }
        console.log("Banco de dados local (SQLite) inicializado com sucesso.");
    } catch (err) {
        console.error("Erro ao inicializar o SQLite:", err);
    }
}


// =================================================================
// FUNÇÕES GERAIS E DE UI
// =================================================================
// ... (showMessage, formatDate, getSpeciesIcon, etc. - Sem alterações) ...
function showMessage(elementId, message, type = 'success') {
    const messageEl = document.getElementById(elementId);
    messageEl.textContent = message;
    messageEl.className = `message ${type} active`;
    setTimeout(() => {
        messageEl.classList.remove('active');
    }, 5000);
}
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}
function getSpeciesIcon(species) { const icons = { dog: '🐕', cat: '🐱' }; return icons[species] || '🐾'; }
function getAgeLabel(age) { const labels = { puppy: 'Filhote', young: 'Jovem', adult: 'Adulto', senior: 'Idoso' }; return labels[age] || age; }
function getSizeLabel(size) { const labels = { small: 'Pequeno', medium: 'Médio', large: 'Grande' }; return labels[size] || size; }
function getGenderLabel(gender) { return gender === 'male' ? 'Macho' : 'Fêmea'; }

// ... (showPage, initRegisterMap, event listener 'petType' - Sem alterações) ...
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');

    const clickedBtn = Array.from(document.querySelectorAll('.nav-btn')).find(btn => {
        const onclick = btn.getAttribute('onclick');
        return onclick && onclick.includes(`'${pageId}'`);
    });
    if (clickedBtn) clickedBtn.classList.add('active');

    if (pageId === 'adoption') loadAdoptionPets();
    else if (pageId === 'my-pets') loadMyPets();
    else if (pageId === 'pet-register') {
        setTimeout(initRegisterMap, 100); 
    }
}
function initRegisterMap() {
    const mapContainer = document.getElementById('registerMap');
    if (!mapContainer) return;
    const defaultCoords = [-3.1190, -60.0217]; 
    
    if (registerMapInstance) {
        registerMapInstance.invalidateSize();
    } else {
        registerMapInstance = L.map('registerMap').setView(defaultCoords, 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(registerMapInstance);
    }
    
    registerMapInstance.on('click', function(e) {
        const { lat, lng } = e.latlng;
        if (marker) {
            marker.setLatLng(e.latlng);
        } else {
            marker = L.marker(e.latlng).addTo(registerMapInstance);
        }
        document.getElementById('petLatitude').value = lat;
        document.getElementById('petLongitude').value = lng;
    });

    if (marker) {
        marker.remove();
        marker = null;
    }
    document.getElementById('petLatitude').value = '';
    document.getElementById('petLongitude').value = '';
    registerMapInstance.setView(defaultCoords, 12);
}
document.getElementById('petType')?.addEventListener('change', (e) => {
    const mapSection = document.getElementById('mapSection');
    if (e.target.value === 'adoption') {
        mapSection.style.display = 'block';
        if (registerMapInstance) registerMapInstance.invalidateSize();
    } else {
        mapSection.style.display = 'none';
    }
});


// =================================================================
// AUTENTICAÇÃO E GESTÃO DE TOKEN
// =================================================================

// ALTERAÇÃO: Tenta carregar o utilizador do localStorage ao iniciar
function loadCurrentUser() {
    const user = localStorage.getItem('petplus_user');
    const token = localStorage.getItem('petplus_token');
    if (user && token) {
        currentUser = JSON.parse(user);
    } else {
        currentUser = null;
    }
    updateAuthButtons();
    // Re-verificar notificações se o utilizador estiver logado
    if (currentUser) {
        checkVaccineNotifications();
    }
}

// ALTERAÇÃO: Helper para obter o token
function getToken() {
    return localStorage.getItem('petplus_token');
}

// ALTERAÇÃO: Helper para construir headers de autenticação
function getAuthHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// ALTERAÇÃO: Atualiza os botões e o nome do utilizador
function updateAuthButtons() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const myPetsBtn = document.getElementById('myPetsBtn');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');

    if (currentUser && getToken()) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        myPetsBtn.style.display = 'inline-block';
        userInfo.classList.add('active');
        userName.textContent = currentUser.name;
    } else {
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        myPetsBtn.style.display = 'none';
        userInfo.classList.remove('active');
    }
}

// ALTERAÇÃO: Login agora salva o token e o utilizador
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        return showMessage('loginMessage', 'Por favor, preencha todos os campos.', 'error');
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (response.ok) {
            // Salvar token e dados do utilizador
            localStorage.setItem('petplus_token', data.token);
            localStorage.setItem('petplus_user', JSON.stringify(data.user));
            currentUser = data.user;
            
            showMessage('loginMessage', data.message, 'success');
            updateAuthButtons();
            checkVaccineNotifications(); // Verificar notificações locais ao logar
            setTimeout(() => showPage('landing'), 1500);
            document.getElementById('loginForm').reset();
        } else {
            showMessage('loginMessage', data.message, 'error');
        }
    } catch (error) {
        showMessage('loginMessage', 'Erro de conexão com o servidor.', 'error');
    }
}

// ... (handleRegister - Sem alterações) ...
async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    if (!name || !email || !phone || !password) {
        return showMessage('registerMessage', 'Por favor, preencha todos os campos.', 'error');
    }
    if (password !== confirmPassword) {
        return showMessage('registerMessage', 'As senhas não coincidem.', 'error');
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password }),
        });
        const data = await response.json();
        if (response.status === 201) {
            showMessage('registerMessage', data.message, 'success');
            document.getElementById('registerForm').reset();
            setTimeout(() => showPage('login'), 2000);
        } else {
            showMessage('registerMessage', data.message, 'error');
        }
    } catch (error) {
        showMessage('registerMessage', 'Erro de conexão com o servidor.', 'error');
    }
}


// ALTERAÇÃO: Logout agora limpa o token e o utilizador
function logout() {
    localStorage.removeItem('petplus_token');
    localStorage.removeItem('petplus_user');
    currentUser = null;
    updateAuthButtons();
    showPage('landing');
}

// =================================================================
// GESTÃO DE PETS (Híbrido)
// =================================================================

// ALTERAÇÃO: Envia token ao registar pet de adoção
async function handlePetRegistration(event) {
    event.preventDefault();
    if (!currentUser) {
        showMessage('petRegisterMessage', 'Você precisa estar logado.', 'error');
        return showPage('login');
    }

    const formData = new FormData(event.target);
    const petData = Object.fromEntries(formData);
    
    // UNIDADE III: Se for 'Pet Pessoal', salvar localmente no SQLite
    if (petData.type === 'personal') {
        // ... (Lógica de salvar localmente - Sem alterações) ...
        if (!db) return showMessage('petRegisterMessage', 'Erro: DB local não iniciado.', 'error');
        try {
            const stmt = db.prepare(`
                INSERT INTO pets (owner_id, name, species, breed, age, size, gender, pet_type, status, description, latitude, longitude)
                VALUES ($ownerId, $name, $species, $breed, $age, $size, $gender, $type, 'personal', $description, $lat, $lon)
            `);
            stmt.run({
                $ownerId: currentUser.id, // ID do dono logado
                $name: petData.name,
                $species: petData.species,
                $breed: petData.breed,
                $age: petData.age,
                $size: petData.size,
                $gender: petData.gender,
                $type: petData.type,
                $description: petData.description,
                $lat: null, 
                $lon: null
            });
            stmt.free();
            saveDb(); 

            showMessage('petRegisterMessage', `${petData.name} foi cadastrado localmente!`, 'success');
            document.getElementById('petRegisterForm').reset();
            loadMyPets().then(() => showPage('my-pets'));

        } catch (err) {
            console.error("Erro ao salvar pet local:", err);
            showMessage('petRegisterMessage', 'Erro ao cadastrar pet localmente.', 'error');
        }
    } else {
        // Se for 'Para Adoção', salvar no servidor (com token)
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/pets`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}` // Envia o token (sem 'Content-Type' p/ FormData)
                },
                body: formData, 
            });
            const data = await response.json();

            if (response.status === 201) {
                showMessage('petRegisterMessage', data.message, 'success');
                document.getElementById('petRegisterForm').reset();
                loadAdoptionPets().then(() => showPage('adoption'));
            } else {
                showMessage('petRegisterMessage', data.message || 'Erro ao cadastrar pet.', 'error');
            }
        } catch (error) {
            console.error("Erro ao cadastrar pet no servidor:", error);
            showMessage('petRegisterMessage', 'Erro de conexão com o servidor.', 'error');
        }
    }
}

// Carrega pets PÚBLICOS (sem dados sensíveis)
async function loadAdoptionPets() {
    const container = document.getElementById('adoptionPets');
    container.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
    try {
        // Esta rota é pública e não envia token
        const response = await fetch(`${API_URL}/pets/adoption`);
        if (!response.ok) throw new Error('Falha na resposta da rede');
        const adoptionPets = await response.json();
        allPets = adoptionPets;
        
        if (adoptionPets.length === 0) {
            container.innerHTML = `<div class="empty-state">...</div>`;
        } else {
            // O 'isAdoptionView' é true, mas a função showContact/openPetProfile 
            // vai verificar se o utilizador está logado antes de mostrar dados sensíveis.
            displayPets(adoptionPets, container, true);
        }
    } catch (error) {
        container.innerHTML = `<div class="empty-state"><h3>Erro ao carregar pets. Tente novamente.</h3></div>`;
    }
}

// ALTERAÇÃO: Carrega pets locais (SQLite) e de adoção (Servidor, com token)
async function loadMyPets() {
    if (!currentUser) return showPage('login');
    if (!db) {
        console.error("DB local não iniciado.");
        return;
    }

    const container = document.getElementById('myPetsGrid');
    container.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
    
    try {
        // 1. Buscar pets pessoais do SQLite local
        const stmt = db.prepare("SELECT * FROM pets WHERE owner_id = $ownerId AND pet_type = 'personal' ORDER BY created_at DESC");
        const localPets = stmt.all({ $ownerId: currentUser.id });
        stmt.free();

        localPets.forEach(pet => {
            const vStmt = db.prepare("SELECT * FROM vaccines WHERE pet_id = $petId");
            pet.vaccines = vStmt.all({ $petId: pet.id }); 
            vStmt.free();
        });

        // 2. Buscar pets de adoção (públicos) do servidor (rota protegida)
        const response = await fetch(`${API_URL}/pets/my-pets`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Falha ao buscar pets do servidor');
        const serverPets = await response.json();

        // 3. Combinar listas
        const allMyPets = [...localPets, ...serverPets];
        allPets = allMyPets;

        if (allMyPets.length === 0) {
            container.innerHTML = `<div class="empty-state">... (Nenhum pet) ...</div>`;
        } else {
            displayPets(allMyPets, container, false);
        }
    } catch (error) {
        console.error("Erro ao carregar 'Meus Pets':", error);
        container.innerHTML = `<div class="empty-state"><h3>Erro ao carregar seus pets. Tente novamente.</h3></div>`;
    }
}

// ALTERAÇÃO: Envia token
async function markAsAdopted(petId) {
    if (!currentUser) return alert("Você precisa estar logado.");
    if (confirm("Você tem certeza que deseja marcar este pet como adotado?")) {
        try {
            const response = await fetch(`${API_URL}/pets/${petId}/adopt`, { 
                method: 'PUT',
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                loadMyPets(); 
            } else {
                const data = await response.json();
                alert(data.message || "Falha ao marcar pet como adotado.");
            }
        } catch (error) {
            alert("Erro de conexão ao tentar atualizar o pet.");
        }
    }
}

// ALTERAÇÃO: Busca pets por proximidade (Unidade IV)
function handleFindNearby() {
    if (!('geolocation' in navigator)) {
        return alert('Geolocalização não é suportada pelo seu navegador.');
    }
    const container = document.getElementById('adoptionPets');
    container.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;

    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
            // Chama a API PÚBLICA com os dados do sensor
            const response = await fetch(`${API_URL}/pets/adoption?lat=${latitude}&lon=${longitude}`);
            if (!response.ok) throw new Error('Falha na resposta da rede');
            const adoptionPets = await response.json();
            allPets = adoptionPets;
            
            if (adoptionPets.length === 0) {
                container.innerHTML = `<div class="empty-state"><h3>Nenhum pet encontrado próximo a você.</h3></div>`;
            } else {
                displayPets(adoptionPets, container, true);
            }
        } catch (error) {
            container.innerHTML = `<div class="empty-state"><h3>Erro ao carregar pets. Tente novamente.</h3></div>`;
        }
    }, (error) => {
        console.error("Erro ao obter localização:", error);
        alert("Não foi possível obter sua localização.");
        loadAdoptionPets(); 
    });
}

// ... (filterPets - Sem alterações) ...
function filterPets() {
    const search = document.getElementById('searchFilter')?.value.toLowerCase() || '';
    const species = document.getElementById('speciesFilter')?.value || '';
    const size = document.getElementById('sizeFilter')?.value || '';
    const age = document.getElementById('ageFilter')?.value || '';

    const filtered = allPets.filter(pet => {
        if (pet.pet_type !== 'adoption' || pet.status !== 'available') return false;
        const matchesSearch = !search || pet.name.toLowerCase().includes(search) || pet.breed.toLowerCase().includes(search);
        const matchesSpecies = !species || pet.species === species;
        const matchesSize = !size || pet.size === size;
        const matchesAge = !age || pet.age === age;
        return matchesSearch && matchesSpecies && matchesSize && matchesAge;
    });
    
    const container = document.getElementById('adoptionPets');
    if (filtered.length > 0) {
        displayPets(filtered, container, true);
    } else {
        container.innerHTML = `<div class="empty-state">... (Nenhum pet) ...</div>`;
    }
}


// =================================================================
// UNIDADE IV: Notificações (SQLite)
// =================================================================

// ... (checkVaccineNotifications - Sem alterações) ...
async function checkVaccineNotifications() {
    if (!db || !currentUser) return; 
    if (!('Notification' in window)) return; 

    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
        const stmt = db.prepare(`
            SELECT v.name, v.next_date, p.name as pet_name 
            FROM vaccines v
            JOIN pets p ON v.pet_id = p.id
            WHERE p.owner_id = $ownerId AND v.next_date >= $today AND v.next_date <= $nextWeek
        `);
        const upcoming = stmt.all({ $ownerId: currentUser.id, $today: today, $nextWeek: nextWeek });
        stmt.free();

        if (upcoming.length > 0) {
            const pet = upcoming[0];
            const body = `A próxima dose de ${pet.name} para ${pet.pet_name} é em ${formatDate(pet.next_date)}!`;
            
            if (Notification.permission === 'granted') {
                new Notification('Lembrete de Vacina PetPlus', { body: body, icon: 'logo_2.png' });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification('Lembrete de Vacina PetPlus', { body: body, icon: 'logo_2.png' });
                    }
                });
            }
        }
    } catch (err) {
        console.error("Erro ao checar notificações locais:", err);
    }
}


// ... (getStatusIndicator - Sem alterações) ...
function getStatusIndicator(pet) {
    if (pet.pet_type === 'personal') {
        return `<span class="status-indicator status-personal">👤 Meu Pet (Local)</span>`;
    } else if (pet.status === 'available') {
        return `<span class="status-indicator status-available">🏠 Para Adoção</span>`;
    } else if (pet.status === 'adopted') {
        return `<span class="status-indicator status-adopted">❤️ Adotado</span>`;
    }
    return '';
}


// ... (displayPets - Modificado para lidar com dados sensíveis) ...
function displayPets(petsToShow, container, isAdoptionView) {
    container.innerHTML = petsToShow.map(pet => {
        const petImage = pet.photo_path ? `<img src="${pet.photo_path}" alt="Foto de ${pet.name}">` : getSpeciesIcon(pet.species);
        
        let actionButtons = '';
        if (isAdoptionView) {
            // Na lista de adoção, o botão "Contato" SÓ DEVE FUNCIONAR se o utilizador estiver logado.
            // A função openPetProfile fará a verificação de login antes de mostrar o mapa.
            // A função showContact fará a verificação de login antes de mostrar os dados.
            actionButtons = `
                <button class="btn btn-small" onclick="openPetProfile(${pet.id})">Ver Perfil</button>
                <button class="btn btn-small" onclick="showContact(${pet.id})" style="background: #38a169;">Contato</button>
            `;
        } else {
            // 'Meus Pets' view
            actionButtons = `<button class="btn btn-small" onclick="openPetProfile(${pet.id})">Ver Perfil</button>`;
            if (pet.pet_type === 'personal') {
                actionButtons += `<button class="btn btn-small" onclick="openVaccinationModal(${pet.id})" style="background: #ed8936;">+ Vacina</button>`;
            } else if (pet.pet_type === 'adoption' && pet.status === 'available') {
                actionButtons += `<button class="btn btn-small" onclick="markAsAdopted(${pet.id})" style="background: #38a169;">Marcar como Adotado</button>`;
            }
        }

        return `
            <div class="pet-card">
                <div class="pet-image">${petImage}</div>
                <div class="pet-info">
                    <div class="pet-name">${pet.name}</div>
                    <div class="pet-details">
                    </div>
                    <div class="pet-description">${pet.description}</div>
                    <div class="pet-actions">${actionButtons}</div>
                    <div style="margin-top: 10px;">${getStatusIndicator(pet)}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ALTERAÇÃO: Lógica dividida para dados públicos e seguros
async function openPetProfile(petId) {
    const pet = allPets.find(p => p.id === petId);
    if (!pet) {
        alert("Pet não encontrado!");
        return;
    }

    const isOwner = currentUser && currentUser.id === pet.owner_id;
    const petImage = pet.photo_path ? `<img src="${pet.photo_path}" alt="Foto de ${pet.name}" style="width: 100%; height: 100%; object-fit: cover;">` : getSpeciesIcon(pet.species);

    // UNIDADE III: Lógica para exibir vacinas (apenas para pets locais)
    let vaccineHtml = '';
    if (pet.pet_type === 'personal' && pet.vaccines) { // Apenas pets locais têm vacinas
        if (pet.vaccines.length > 0) {
            vaccineHtml = pet.vaccines.map(v => `
                <div class="vaccination-item ${new Date(v.next_date) < new Date() ? 'upcoming' : ''}">...</div>
            `).join('');
        } else {
            vaccineHtml = '<p style="text-align:center; color: #718096; margin-top: 15px;">Nenhuma vacina registrada.</p>';
        }
        
        vaccineHtml = `
            <div class="vaccination-section">
                <div class="vaccination-header">
                    <h3>💉 Carteira de Vacinação</h3>
                    ${isOwner ? `<button class="btn btn-small" onclick="openVaccinationModal(${pet.id})">+ Adicionar Vacina</button>` : ''}
                </div>
                <div class="vaccination-list">
                    ${vaccineHtml}
                </div>
            </div>`;
    }

    // Estrutura HTML base (apenas dados PÚBLICOS)
    document.getElementById('petModalContent').innerHTML = `
        <h2 style="text-align:center;">${pet.name}</h2>
        <div style="text-align:center; font-size: 5rem; height: 150px; display:flex; justify-content:center; align-items:center;">${petImage}</div>
        <p><b>Espécie:</b> ${getSpeciesIcon(pet.species)} ${pet.species}</p>
        <p><b>Raça:</b> ${pet.breed}</p>
        <p><b>Idade:</b> ${getAgeLabel(pet.age)}</p>
        <p><b>Porte:</b> ${getSizeLabel(pet.size)}</p>
        <p><b>Sexo:</b> ${getGenderLabel(pet.gender)}</p>
        <p><b>Descrição:</b> ${pet.description}</p>
        
        <div id="secure-pet-data">
            <div class="loading"><div class="spinner"></div></div>
        </div> 

        ${vaccineHtml} `;
    document.getElementById('petModal').classList.add('active');

    // AGORA, buscar dados seguros (Mapa e Contacto) SE estiver logado
    if (currentUser && getToken() && pet.pet_type === 'adoption') {
        try {
            const response = await fetch(`${API_URL}/pets/${pet.id}/secure`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error("Não foi possível carregar os dados de contacto.");
            }
            const secureData = await response.json();

            // UNIDADE IV: HTML para o Mapa
            let mapHtml = '';
            if (secureData.latitude && secureData.longitude) {
                mapHtml = `
                    <h4 style="margin-top: 20px; color: #2d3748;">Localização Aproximada</h4>
                    <div id="petMap"></div>
                `;
            }

            // Injeta os dados seguros no placeholder
            document.getElementById('secure-pet-data').innerHTML = `
                ${mapHtml}
                <div style="text-align: center; margin-top: 25px;">
                    <button class="btn" onclick="showContact(${pet.id})">💬 Entrar em Contato</button>
                </div>
            `;

            // UNIDADE IV: Inicializar o Mapa Leaflet
            if (secureData.latitude && secureData.longitude) {
                setTimeout(() => {
                    try {
                        if (mapInstance) mapInstance.remove();
                        mapInstance = L.map('petMap').setView([secureData.latitude, secureData.longitude], 15);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
                        L.marker([secureData.latitude, secureData.longitude]).addTo(mapInstance);
                    } catch (e) {
                        document.getElementById('petMap').innerHTML = "Erro ao carregar o mapa.";
                    }
                }, 100); 
            }

        } catch (err) {
            document.getElementById('secure-pet-data').innerHTML = `<p style="text-align:center; color: #c53030;">${err.message}</p>`;
        }
    } else if (pet.pet_type === 'adoption') {
        // Utilizador não está logado
        document.getElementById('secure-pet-data').innerHTML = `
            <div style="text-align: center; margin-top: 25px; background: #f7fafc; padding: 20px; border-radius: 12px;">
                <p style="color: #4a5568; margin-bottom: 15px;">A localização e o contacto do dono são visíveis apenas para utilizadores logados.</p>
                <button class="btn btn-small" onclick="closePetModal(); showPage('login');">Entrar para ver</button>
            </div>
        `;
    } else {
        // É um pet pessoal (local), não tem dados seguros
         document.getElementById('secure-pet-data').innerHTML = '';
    }
}


// ... (handleVaccination - Lógica local, sem alterações) ...
async function handleVaccination(event) {
    event.preventDefault();
    if (!db) { return alert('Erro: DB local não iniciado.'); }

    const petId = parseInt(document.getElementById('vaccinePetId').value);
    const name = document.getElementById('vaccineName').value.trim();
    const date = document.getElementById('vaccineDate').value;
    const nextDate = document.getElementById('vaccineNext').value || null;
    const vet = document.getElementById('vaccineVet').value.trim() || null;
    const notes = document.getElementById('vaccineNotes').value.trim() || null;
    
    if (!name || !date) {
        return alert('Nome da vacina e data de aplicação são obrigatórios.');
    }

    try {
        const stmt = db.prepare(`
            INSERT INTO vaccines (pet_id, name, vaccine_date, next_date, vet, notes) 
            VALUES ($petId, $name, $date, $nextDate, $vet, $notes)
        `);
        stmt.run({ $petId: petId, $name: name, $date: date, $nextDate: nextDate, $vet: vet, $notes: notes });
        const vaccineId = db.exec("SELECT last_insert_rowid()")[0].values[0][0];
        stmt.free();
        saveDb(); 

        closeVaccinationModal();
        
        const pet = allPets.find(p => p.id === petId);
        if (pet) {
             const newVaccine = { id: vaccineId, pet_id: petId, name, vaccine_date: date, next_date: nextDate, vet, notes };
             if (!pet.vaccines) pet.vaccines = [];
             pet.vaccines.push(newVaccine);
             openPetProfile(petId); 
             checkVaccineNotifications();
        }
    } catch(error) {
        console.error("Erro ao salvar vacina local:", error);
        alert("Erro de conexão ao salvar vacina local.");
    }
}


// ... (Funções de fechar modais - Sem alterações) ...
function closePetModal() { document.getElementById('petModal').classList.remove('active'); }
function openVaccinationModal(petId) {
    const pet = allPets.find(p => p.id === petId);
    if (pet && pet.pet_type === 'personal') {
        document.getElementById('vaccinePetId').value = petId;
        document.getElementById('vaccinationForm').reset();
        document.getElementById('vaccinationModal').classList.add('active');
    } else {
        alert("As vacinas só podem ser geridas para 'Pets Pessoais' (locais).");
    }
}
function closeVaccinationModal() { document.getElementById('vaccinationModal').classList.remove('active'); }
function closeContactModal() { document.getElementById('contactModal').classList.remove('active'); }

// ALTERAÇÃO: Busca dados de contacto da rota segura
async function showContact(petId) {
    if (!currentUser) {
        alert("Você precisa estar logado para ver o contacto.");
        return showPage('login');
    }

    try {
        const response = await fetch(`${API_URL}/pets/${petId}/secure`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Não foi possível carregar dados de contacto.');
        
        const secureData = await response.json();

        document.getElementById('contactModalContent').innerHTML = `
            <h3 style="text-align: center; margin-bottom: 20px;">Informações de Contato</h3>
            <p><strong>Nome:</strong> ${secureData.owner_name}</p>
            <p><strong>Email:</strong> <a href="mailto:${secureData.owner_email}">${secureData.owner_email}</a></p>
            <p><strong>Telefone:</strong> <a href="tel:${secureData.owner_phone}">${secureData.owner_phone}</a></p>
        `;
        document.getElementById('contactModal').classList.add('active');
    } catch (e) {
        alert(e.message);
    }
}

// =================================================================
// INICIALIZAÇÃO
// =================================================================
document.addEventListener('DOMContentLoaded', function() {
    initDb(); // Inicia SQLite

    // Tenta carregar o utilizador logado (se houver token)
    loadCurrentUser();

    // ... (Event listeners dos formulários e modais - Sem alterações) ...
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('petRegisterForm').addEventListener('submit', handlePetRegistration);
    document.getElementById('vaccinationForm').addEventListener('submit', handleVaccination);

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    loadAdoptionPets(); 
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('vaccineDate').max = today;
});