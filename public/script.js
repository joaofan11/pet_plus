const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let allPets = [];
let allUsers = [];

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

function getSpeciesIcon(species) {
    const icons = { dog: '🐕', cat: '🐱' };
    return icons[species] || '🐾';
}

function getAgeLabel(age) {
    const labels = { puppy: 'Filhote', young: 'Jovem', adult: 'Adulto', senior: 'Idoso' };
    return labels[age] || age;
}

function getSizeLabel(size) {
    const labels = { small: 'Pequeno', medium: 'Médio', large: 'Grande' };
    return labels[size] || size;
}

function getGenderLabel(gender) {
    return gender === 'male' ? 'Macho' : 'Fêmea';
}

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
}

function updateAuthButtons() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const myPetsBtn = document.getElementById('myPetsBtn');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');

    if (currentUser) {
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
            currentUser = data.user;
            showMessage('loginMessage', data.message, 'success');
            updateAuthButtons();
            setTimeout(() => showPage('landing'), 1500);
            document.getElementById('loginForm').reset();
        } else {
            showMessage('loginMessage', data.message, 'error');
        }
    } catch (error) {
        showMessage('loginMessage', 'Erro de conexão com o servidor.', 'error');
    }
}

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

function logout() {
    currentUser = null;
    updateAuthButtons();
    showPage('landing');
}

async function handlePetRegistration(event) {
    event.preventDefault();
    if (!currentUser) {
        showMessage('petRegisterMessage', 'Você precisa estar logado.', 'error');
        return showPage('login');
    }

    const formData = new FormData(event.target);
    const petData = Object.fromEntries(formData);
    
    delete petData.photo; 

    petData.ownerId = currentUser.id;

    try {
        const response = await fetch(`${API_URL}/pets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(petData),
        });
        const data = await response.json();

        if (response.status === 201) {
            showMessage('petRegisterMessage', data.message, 'success');
            document.getElementById('petRegisterForm').reset();
            if (petData.type === 'adoption') {
                loadAdoptionPets().then(() => showPage('adoption'));
            } else {
                loadMyPets().then(() => showPage('my-pets'));
            }
        } else {
            showMessage('petRegisterMessage', data.message || 'Erro ao cadastrar pet.', 'error');
        }
    } catch (error) {
        showMessage('petRegisterMessage', 'Erro de conexão com o servidor.', 'error');
    }
}

async function loadAdoptionPets() {
    const container = document.getElementById('adoptionPets');
    container.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
    try {
        const response = await fetch(`${API_URL}/pets/adoption`);
        if (!response.ok) throw new Error('Falha na resposta da rede');
        const adoptionPets = await response.json();
        allPets = adoptionPets;
        
        if (adoptionPets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🐾</div>
                    <h3>Nenhum pet disponível</h3>
                    <p>No momento, não há pets para adoção. Volte em breve!</p>
                </div>`;
        } else {
            displayPets(adoptionPets, container, true);
        }
    } catch (error) {
        container.innerHTML = `<div class="empty-state"><h3>Erro ao carregar pets. Tente novamente.</h3></div>`;
    }
}

async function loadMyPets() {
    if (!currentUser) return showPage('login');

    const container = document.getElementById('myPetsGrid');
    container.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
    try {
        const response = await fetch(`${API_URL}/pets/my-pets/${currentUser.id}`);
        if (!response.ok) throw new Error('Falha na resposta da rede');
        const myPets = await response.json();

        allPets = myPets; 

        if (myPets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🐾</div>
                    <h3>Você ainda não tem pets cadastrados</h3>
                    <p>Cadastre seu primeiro pet para começar a usar a carteira de vacinação digital.</p>
                    <button class="btn" onclick="showPage('pet-register')" style="width: auto; padding: 15px 30px;">
                        Cadastrar Meu Primeiro Pet
                    </button>
                </div>`;
        } else {
            displayPets(myPets, container, false);
        }
    } catch (error) {
        container.innerHTML = `<div class="empty-state"><h3>Erro ao carregar seus pets. Tente novamente.</h3></div>`;
    }
}

async function markAsAdopted(petId) {
    if (confirm("Você tem certeza que deseja marcar este pet como adotado? Esta ação removerá o pet da lista pública de adoção.")) {
        try {
            const response = await fetch(`${API_URL}/pets/${petId}/adopt`, { method: 'PUT' });
            if (response.ok) {
                showMessage('myPetsMessage', 'Pet marcado como adotado com sucesso!', 'success');
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

function filterPets() {
    const search = document.getElementById('searchFilter')?.value.toLowerCase() || '';
    const species = document.getElementById('speciesFilter')?.value || '';
    const size = document.getElementById('sizeFilter')?.value || '';
    const age = document.getElementById('ageFilter')?.value || '';

    const filtered = allPets.filter(pet => {
        if (pet.type !== 'adoption' || pet.status !== 'available') return false;
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
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <h3>Nenhum pet encontrado</h3>
                <p>Tente ajustar os filtros de busca.</p>
            </div>`;
    }
}

function getStatusIndicator(pet) {
    if (pet.type === 'personal') {
        return `<span class="status-indicator status-personal">👤 Meu Pet</span>`;
    } else if (pet.status === 'available') {
        return `<span class="status-indicator status-available">🏠 Para Adoção</span>`;
    } else if (pet.status === 'adopted') {
        return `<span class="status-indicator status-adopted">❤️ Adotado</span>`;
    }
    return '';
}

function displayPets(petsToShow, container, isAdoptionView) {
    container.innerHTML = petsToShow.map(pet => {
        const petImage = pet.photo ? `<img src="${pet.photo}" alt="Foto de ${pet.name}">` : getSpeciesIcon(pet.species);
        
        let actionButtons = '';
        if (isAdoptionView) {
            actionButtons = `
                <button class="btn btn-small" onclick="openPetProfile(${pet.id})">Ver Perfil</button>
                <button class="btn btn-small" onclick="showContact(${pet.ownerId})" style="background: #38a169;">Contato</button>
            `;
        } else {
            actionButtons = `<button class="btn btn-small" onclick="openPetProfile(${pet.id})">Ver Perfil</button>`;
            if (pet.type === 'personal') {
                actionButtons += `<button class="btn btn-small" onclick="openVaccinationModal(${pet.id})" style="background: #ed8936;">+ Vacina</button>`;
            } else if (pet.type === 'adoption' && pet.status === 'available') {
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
    
async function openPetProfile(petId) {
    const pet = allPets.find(p => p.id === petId);
    if (!pet) {
        alert("Pet não encontrado!");
        return;
    }

    const isOwner = currentUser && currentUser.id === pet.ownerId;
    const petImage = pet.photo ? `<img src="${pet.photo}" alt="Foto de ${pet.name}" style="width: 100%; height: 100%; object-fit: cover;">` : getSpeciesIcon(pet.species);

    let adoptionButton = '';
    if (pet.type === 'adoption' && pet.status === 'available' && !isOwner) {
        adoptionButton = `<div style="text-align: center; margin-top: 25px;"><button class="btn" onclick="showContact(${pet.ownerId})">💬 Entrar em Contato</button></div>`;
    }

    document.getElementById('petModalContent').innerHTML = `
        <h2 style="text-align:center;">${pet.name}</h2>
        <div style="text-align:center; font-size: 5rem;">${petImage}</div>
        <p><b>Espécie:</b> ${pet.species}</p>
        <p><b>Raça:</b> ${pet.breed}</p>
        <p><b>Descrição:</b> ${pet.description}</p>
        <div class="vaccination-section">
            <h3>💉 Carteira de Vacinação</h3>
            ${isOwner ? `<button class="btn btn-small" onclick="openVaccinationModal(${pet.id})">+ Adicionar Vacina</button>` : ''}
            <div class="vaccination-list">
                ${pet.vaccines && pet.vaccines.length > 0 ? pet.vaccines.map(v => `
                    <div class="vaccination-item">
                        <p><b>Vacina:</b> ${v.name}</p>
                        <p><b>Data:</b> ${formatDate(v.date)}</p>
                        <p><b>Próxima Dose:</b> ${formatDate(v.nextDate)}</p>
                    </div>
                `).join('') : '<p>Nenhuma vacina registrada.</p>'}
            </div>
        </div>
        ${adoptionButton}
    `;
    document.getElementById('petModal').classList.add('active');
}


async function handleVaccination(event) {
    event.preventDefault();
    
    const petId = parseInt(document.getElementById('vaccinePetId').value);
    const name = document.getElementById('vaccineName').value.trim();
    const date = document.getElementById('vaccineDate').value;
    const nextDate = document.getElementById('vaccineNext').value;
    
    if (!name || !date) {
        return alert('Nome da vacina e data de aplicação são obrigatórios.');
    }

    try {
        const response = await fetch(`${API_URL}/pets/${petId}/vaccines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, date, nextDate }),
        });

        if (response.status === 201) {
            closeVaccinationModal();
            const pet = allPets.find(p => p.id === petId);
            if (pet) {
                 const data = await response.json();
                 pet.vaccines.push(data.vaccine);
                 openPetProfile(petId);
            }
        } else {
            alert("Erro ao adicionar vacina.");
        }
    } catch(error) {
        alert("Erro de conexão ao salvar vacina.");
    }
}

function closePetModal() { document.getElementById('petModal').classList.remove('active'); }
function openVaccinationModal(petId) {
    document.getElementById('vaccinePetId').value = petId;
    document.getElementById('vaccinationForm').reset();
    document.getElementById('vaccinationModal').classList.add('active');
}
function closeVaccinationModal() { document.getElementById('vaccinationModal').classList.remove('active'); }
function closeContactModal() { document.getElementById('contactModal').classList.remove('active'); }

document.addEventListener('DOMContentLoaded', function() {
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

    updateAuthButtons();
    loadAdoptionPets();
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('vaccineDate').max = today;
});

updateAuthButtons();