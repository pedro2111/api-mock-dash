// Arquivo: api-mock.js
// Descrição: Implementação da API com dados simulados para o dashboard

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https')
const fs = require('fs')
const qs = require('qs');
const dotenv = require('dotenv');
const mockData = require('./data-mock');
const httpClient = require('./httpClient');

//const ca = fs.readFileSync('acicptestesraiz.cer')
//const agent = new https.Agent({ca:ca});

// Configuração do ambiente
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint: Gerar token de serviço (client credentials grant)
app.post('/backend/auth/realms/intranet/protocol/openid-connect/token', async (req, res) => {
  try {
    const { client_id, client_secret } = req.body;
    console.log("body", req.body)
    if (!client_id || !client_secret) {
      console.log("cliente", client_id)
      console.log("secret", client_secret)
      return res.status(400).json({ error: 'client_id and client_secret are required' });
    }

    const data = qs.stringify({
      grant_type: 'client_credentials',
      client_id,
      client_secret
    });
    console.log("data", data)
    const response = await httpClient.post(
      'https://login.des.caixa/auth/realms/intranet/protocol/openid-connect/token',
      data,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    res.json(response.data); // Retorna o token completo (access_token, expires_in, etc.)

  } catch (error) {
    if (error.response) {
      // Retorna o erro do servidor de autenticação
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Erro ao tentar autenticar no Keycloak', details: error.message });
    }
  }
});

// Endpoint: Gerar token com usuário e senha (password grant)
app.post('/backend//auth/realms/intranet/protocol/openid-connect/token', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username e password são obrigatórios' });
    }

    const data = qs.stringify({
      grant_type: 'password',
      client_id: 'cli-web-pnc', // pode tornar dinâmico se necessário
      username,
      password
    });

    const response = await httpClient.post(
      'https://login.des.caixa/auth/realms/intranet/protocol/openid-connect/token',
      data,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        maxBodyLength: Infinity
      }
    );

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Erro ao gerar token de usuário', details: error.message });
    }
  }
});

// Endpoint: Obter histórico de uma proposta específica
app.get('/backend/monitoracao/v1/propostas/:id/historico', async (req, res) => {
  try {
    const propostaId = req.params.id;
    const { offset = 0, limit = 100 } = req.query;
    const authorization = req.headers['authorization'];

    if (!authorization) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    const apiUrl = `https://sigpf-servicos-des.apps.nprd.caixa/backend/monitoracao/v1/propostas/${propostaId}/historico?offset=${offset}&limit=${limit}`;

    const response = await httpClient.get(apiUrl, {
      headers: {
        Authorization: authorization
      },
      maxBodyLength: Infinity
    });

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Erro ao consultar histórico da proposta', details: error.message });
    }
  }
});

// Endpoint: Filtrar propostas com paginação (proxy real)
app.get('/backend/monitoracao/v1/propostas/filtros', async (req, res) => {
  try {
    const {
      nuPropostaSeguridade,
      sgSituacaoProposta,
      dataInicio,
      dataFim,
      offset = 0,
      limit = 100
    } = req.query;

    const authorization = req.headers['authorization'];

    if (!authorization) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    // Montar query string
    const queryParams = new URLSearchParams();

    if (nuPropostaSeguridade) queryParams.append('nuPropostaSeguridade', nuPropostaSeguridade);
    if (sgSituacaoProposta) queryParams.append('sgSituacaoProposta', sgSituacaoProposta);
    if (dataInicio) queryParams.append('dataInicio', dataInicio);
    if (dataFim) queryParams.append('dataFim', dataFim);
    queryParams.append('offset', offset);
    queryParams.append('limit', limit);

    const apiUrl = `http://sigpf-servicos-des.apps.nprd.caixa/backend/monitoracao/v1/propostas/filtros?${queryParams.toString()}`;

    const response = await httpClient.get(apiUrl, {
      headers: {
        Authorization: authorization
      },
      maxBodyLength: Infinity
    });

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Erro ao consultar a API SIGPF (filtros)', details: error.message });
    }
  }
});

// Endpoint: Obter distribuição de propostas por situação
app.get('/backend/monitoracao/v1/relatorios/situacoes', async (req, res) => {
  try {
    const { dataInicio, dataFim, offset = 0, limit = 100 } = req.query;
    const authorization = req.headers['authorization'];

    if (!authorization) {
      return res.status(401).json({ error: 'Authorization header is required' });
    }

    const queryParams = new URLSearchParams();

    if (dataInicio) queryParams.append('dataInicio', dataInicio);
    if (dataFim) queryParams.append('dataFim', dataFim);
    queryParams.append('offset', offset);
    queryParams.append('limit', limit);

    const apiUrl = `https://sigpf-servicos-des.apps.nprd.caixa/backend/monitoracao/v1/relatorios/situacoes?${queryParams.toString()}`;

    const response = await httpClient.get(apiUrl, {
      headers: {
        Authorization: authorization
      },
      maxBodyLength: Infinity
    });

    res.json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      //res.json(mockData.getDistribuicaoSituacaoMock())
      res.status(500).json({ error: 'Erro ao consultar relatório de situações', details: error.message });
    }
  }
});

// Endpoint: Obter KPIs principais
app.get('/backend/kpis', (req, res) => {
  res.json(mockData.getKpisMock());
});

// Endpoint: Obter distribuição de propostas por situação
app.get('mock/backend/monitoracao/v1/relatorios/situacoes', (req, res) => {
  const params = {
    dataInicio: req.query.dataInicio,
    dataFim: req.query.dataFim,
    offset: req.query.offset,
    limit: req.query.limit
  };
  res.json(mockData.getDistribuicaoSituacaoMock(params));
});

// Endpoint: Obter propostas em GER por mais de 2 horas
app.get('/backend/propostas-ger-2h', (req, res) => {
  res.json(mockData.getPropostasGer2hMock());
});

// Endpoint: Obter evolução de propostas ao longo do tempo
app.get('/backend/evolucao-propostas', (req, res) => {
  res.json(mockData.getEvolucaoPropostasMock());
});

// Endpoint: Obter tempo médio em cada situação
app.get('/backend/tempo-medio-situacao', (req, res) => {
  res.json(mockData.getTempoMedioSituacaoMock());
});

// Endpoint: Obter conversão entre etapas principais (funil)
app.get('/backend/conversao-etapas', (req, res) => {
  res.json(mockData.getConversaoEtapasMock());
});

// Endpoint: Obter motivos de rejeição/cancelamento
app.get('/backend/motivos-rejeicao', (req, res) => {
  res.json(mockData.getMotivosRejeicaoMock());
});

// Endpoint: Obter desempenho por canal
app.get('/backend/desempenho-canal', (req, res) => {
  res.json(mockData.getDesempenhoCanaisMock());
});

// Endpoint: Obter volume de registros de monitoração
app.get('/backend/volume-monitoracao', (req, res) => {
  res.json(mockData.getVolumeMonitoracaoMock());
});

 // Endpoint: Filtrar propostas com paginação
app.get('/mock/backend/monitoracao/v1/propostas/filtros', (req, res) => {
  const params = {
    nuPropostaSeguridade: req.query.nuPropostaSeguridade,
    sgSituacaoProposta: req.query.sgSituacaoProposta,
    dataInicio: req.query.dataInicio,
    dataFim: req.query.dataFim,
    offset: req.query.offset,
    limit: req.query.limit
  };

  res.json(mockData.filtrarPropostas(params));
});



// Inicialização do servidor
const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor mock rodando na porta ${PORT}`);
});

module.exports = app;
