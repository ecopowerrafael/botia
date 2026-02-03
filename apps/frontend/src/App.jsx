import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Tenants
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  
  // WhatsApp
  const [whatsappInstances, setWhatsappInstances] = useState([]);
  const [instanceName, setInstanceName] = useState('');
  const [showNewInstance, setShowNewInstance] = useState(false);
  
  // Users
  const [users, setUsers] = useState([]);
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');

  const API_URL = 'https://apipgsoft.shop';

  // Carregar dados
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
      loadTenants();
    }
  }, []);

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await axios.get(`${API_URL}/users/email/${email}`);
      const userData = response.data;
      
      // Gerar token fake para demo
      const token = 'token_' + Math.random().toString(36).substr(2, 9);
      
      setUser(userData);
      setIsLoggedIn(true);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      
      setEmail('');
      setPassword('');
      loadTenants();
    } catch (err) {
      setError('Erro: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setActiveTab('dashboard');
  };

  // Carregar Tenants
  const loadTenants = async () => {
    try {
      const response = await axios.get(`${API_URL}/tenants`);
      setTenants(response.data);
      if (response.data.length > 0) {
        setSelectedTenant(response.data[0]);
        loadWhatsappInstances(response.data[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar tenants:', err);
    }
  };

  // Carregar Instâncias WhatsApp
  const loadWhatsappInstances = async (tenantId) => {
    try {
      const response = await axios.get(`${API_URL}/whatsapp/instance/${tenantId}`);
      setWhatsappInstances(response.data);
    } catch (err) {
      console.error('Erro ao carregar instâncias:', err);
    }
  };

  // Criar Instância WhatsApp
  const handleCreateWhatsappInstance = async () => {
    if (!instanceName || !selectedTenant) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/whatsapp/instance/create`, {
        tenantId: selectedTenant.id,
        name: instanceName,
      });
      
      setWhatsappInstances([...whatsappInstances, response.data]);
      setInstanceName('');
      setShowNewInstance(false);
      setError('');
    } catch (err) {
      setError('Erro ao criar instância: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Conectar WhatsApp
  const handleConnectWhatsapp = async (instanceId) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/whatsapp/instance/connect`, {
        instanceId,
      });
      
      // Aqui você poderia exibir um QR code
      alert('Conectado! Verifique o terminal para o QR code');
      loadWhatsappInstances(selectedTenant.id);
    } catch (err) {
      setError('Erro ao conectar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Criar Usuário
  const handleCreateUser = async () => {
    if (!newUserEmail) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/users/create`, {
        email: newUserEmail,
        name: newUserEmail.split('@')[0],
        password: 'TempPassword123!',
        tenantId: selectedTenant?.id,
      });
      
      setUsers([...users, response.data]);
      setNewUserEmail('');
      setShowNewUser(false);
      setError('');
    } catch (err) {
      setError('Erro ao criar usuário: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Login Page
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>🤖 BotIA</h1>
          <p>WhatsApp CRM/ERP Platform</p>
          
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? 'Conectando...' : 'Entrar'}
            </button>
          </form>
          
          <p className="demo-users">
            <strong>Demo:</strong> usuario@example.com<br/>
            <small>Ou crie um novo usuário na aba Usuários</small>
          </p>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="app">
      <aside className="sidebar">
        <h2>🤖 BotIA</h2>
        <nav>
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={activeTab === 'whatsapp' ? 'active' : ''}
            onClick={() => setActiveTab('whatsapp')}
          >
            💬 WhatsApp
          </button>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            👥 Usuários
          </button>
          <button
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Configurações
          </button>
          <button onClick={handleLogout} className="logout">
            🚪 Sair
          </button>
        </nav>
      </aside>

      <main className="main">
        <header className="top-bar">
          <h1>{user?.name || 'Bem-vindo'}</h1>
          <div className="user-info">
            <span>{user?.email}</span>
          </div>
        </header>

        <div className="content">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <section className="tab-content">
              <h2>📊 Dashboard</h2>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Tenants</h3>
                  <p className="stat-number">{tenants.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Instâncias WhatsApp</h3>
                  <p className="stat-number">{whatsappInstances.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Usuários</h3>
                  <p className="stat-number">{users.length}</p>
                </div>
              </div>

              <div className="tenant-selector">
                <h3>Selecione seu Tenant</h3>
                <select 
                  value={selectedTenant?.id || ''}
                  onChange={(e) => {
                    const tenant = tenants.find(t => t.id === e.target.value);
                    setSelectedTenant(tenant);
                    if (tenant) loadWhatsappInstances(tenant.id);
                  }}
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </section>
          )}

          {/* WhatsApp */}
          {activeTab === 'whatsapp' && (
            <section className="tab-content">
              <div className="section-header">
                <h2>💬 Instâncias WhatsApp</h2>
                <button 
                  className="btn-primary"
                  onClick={() => setShowNewInstance(!showNewInstance)}
                >
                  + Nova Instância
                </button>
              </div>

              {showNewInstance && (
                <div className="form-box">
                  <input
                    type="text"
                    placeholder="Nome da Instância (ex: Bot Principal)"
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value)}
                  />
                  <button 
                    onClick={handleCreateWhatsappInstance}
                    disabled={loading}
                  >
                    {loading ? 'Criando...' : 'Criar Instância'}
                  </button>
                  {error && <p className="error">{error}</p>}
                </div>
              )}

              <div className="instances-list">
                {whatsappInstances.length === 0 ? (
                  <p>Nenhuma instância configurada. Crie uma nova!</p>
                ) : (
                  whatsappInstances.map(instance => (
                    <div key={instance.id} className="instance-card">
                      <div className="instance-info">
                        <h4>{instance.name}</h4>
                        <p>Instância ID: {instance.id.substring(0, 8)}...</p>
                        <span className={`status ${instance.status || 'disconnected'}`}>
                          {instance.status === 'connected' ? '✓ Conectado' : '⚠ Desconectado'}
                        </span>
                      </div>
                      {instance.status !== 'connected' && (
                        <button 
                          onClick={() => handleConnectWhatsapp(instance.id)}
                          disabled={loading}
                          className="btn-secondary"
                        >
                          {loading ? 'Conectando...' : 'Conectar WhatsApp'}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* Usuários */}
          {activeTab === 'users' && (
            <section className="tab-content">
              <div className="section-header">
                <h2>👥 Gerenciar Usuários</h2>
                <button 
                  className="btn-primary"
                  onClick={() => setShowNewUser(!showNewUser)}
                >
                  + Novo Usuário
                </button>
              </div>

              {showNewUser && (
                <div className="form-box">
                  <input
                    type="email"
                    placeholder="Email do novo usuário"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                  <button 
                    onClick={handleCreateUser}
                    disabled={loading}
                  >
                    {loading ? 'Criando...' : 'Criar Usuário'}
                  </button>
                  {error && <p className="error">{error}</p>}
                </div>
              )}

              <div className="users-list">
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Nome</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="3">Nenhum usuário</td>
                      </tr>
                    ) : (
                      users.map(u => (
                        <tr key={u.id}>
                          <td>{u.email}</td>
                          <td>{u.name}</td>
                          <td>
                            <span className={`badge ${u.status || 'active'}`}>
                              {u.status || 'Ativo'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Configurações */}
          {activeTab === 'settings' && (
            <section className="tab-content">
              <h2>⚙️ Configurações</h2>
              
              <div className="settings-box">
                <h3>Informações da Conta</h3>
                <div className="setting-item">
                  <label>Email:</label>
                  <p>{user?.email}</p>
                </div>
                <div className="setting-item">
                  <label>Nome:</label>
                  <p>{user?.name}</p>
                </div>
                <div className="setting-item">
                  <label>Função:</label>
                  <p>{user?.role || 'Usuário'}</p>
                </div>
              </div>

              <div className="settings-box">
                <h3>Configurações do Tenant</h3>
                {selectedTenant && (
                  <>
                    <div className="setting-item">
                      <label>Nome do Tenant:</label>
                      <p>{selectedTenant.name}</p>
                    </div>
                    <div className="setting-item">
                      <label>Modo de Operação:</label>
                      <p>{selectedTenant.operationMode || 'SELLER'}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="settings-box danger">
                <h3>Zona de Perigo</h3>
                <button onClick={handleLogout} className="btn-danger">
                  🚪 Sair da Conta
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
