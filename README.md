# 🐾 PetPlus - Plataforma de Adoção e Gestão Pet

O **PetPlus** é uma plataforma web completa desenvolvida para conectar animais que precisam de um lar a famílias amorosas.  
Além da adoção, o sistema oferece ferramentas essenciais para tutores, como uma **carteira de vacinação digital** e um **localizador de serviços pet** (veterinários, cuidadores, etc.) com **integração de mapas**.

---

## 🎯 Objetivos do Projeto

* **Facilitar a Adoção:** Conectar doadores e adotantes através de um feed público e filtros avançados.  
* **Gestão de Saúde:** Disponibilizar um histórico digital de vacinas acessível em qualquer lugar.  
* **Conexão de Serviços:** Permitir que profissionais divulguem serviços com geolocalização precisa.  
* **Comunidade:** Criar um espaço social com posts, likes e comentários.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5 & CSS3:** Estrutura semântica e design responsivo moderno.  
- **JavaScript (Vanilla):** Lógica de cliente, manipulação do DOM e integração com API REST.  
- **Leaflet.js:** Biblioteca de mapas interativos.  
- **Geolocation API:** Captura de coordenadas de usuários e serviços.

### Backend
- **Node.js & Express:** Servidor robusto e escalável.  
- **Multer:** Upload de imagens em memória.  
- **Joi:** Validação rigorosa de dados de entrada.  
- **Supabase Client:** Autenticação e armazenamento de arquivos (Buckets).  

### Banco de Dados
- **PostgreSQL (via Supabase):** Armazena usuários, pets, posts e serviços.

---

## 📂 Estrutura de Pastas

```text
pet_plus/
├── index.html              # SPA principal
├── styles.css              # Estilos globais
├── script.js               # Lógica do frontend
├── logo.png                # Assets
├── backend/
│   ├── config/             # Configurações (ex: Multer)
│   ├── controllers/        # Lógica de negócio
│   ├── middleware/         # Autenticação e tratamento de erros
│   ├── repositories/       # Consultas SQL e acesso a dados
│   ├── routes/             # Definições das rotas da API
│   ├── schemas/            # Validações Joi
│   ├── services/           # Lógica de aplicação
│   ├── utils/              # Funções auxiliares e erros customizados
│   ├── db.js               # Conexão com PostgreSQL
│   ├── server.js           # Ponto de entrada do servidor
│   └── package.json        # Dependências e scripts
└── README.md               # Documentação
