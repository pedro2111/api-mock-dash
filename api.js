// Arquivo: api.js
// Descrição: Implementação da API para o backend do dashboard

const express = require('express');
const cors = require('cors');
const oracledb = require('oracledb');
const dotenv = require('dotenv');

// Configuração do ambiente
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Configuração da conexão com o banco Oracle
const dbConfig = {
  user: process.env.DB_USER || 'usuario_oracle',
  password: process.env.DB_PASSWORD || 'senha_oracle',
  connectString: process.env.DB_CONNECTION_STRING || 'localhost:1521/XE'
};

// Inicialização do pool de conexões
async function initialize() {
  try {
    await oracledb.createPool(dbConfig);
    console.log('Pool de conexões Oracle inicializado com sucesso');
  } catch (err) {
    console.error('Erro ao inicializar o pool de conexões Oracle:', err);
    process.exit(1);
  }
}

// Função para executar consultas SQL
async function executeQuery(sql, binds = [], options = {}) {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...options
    });
    return result.rows;
  } catch (err) {
    console.error('Erro ao executar consulta:', err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Erro ao fechar conexão:', err);
      }
    }
  }
}

// Endpoint: Obter KPIs principais
app.get('/api/kpis', async (req, res) => {
  try {
    const totalPropostas = await executeQuery(`
      SELECT COUNT(*) AS total FROM GPFTB047_PROPOSTA_SEGURIDADE
    `);

    const propostasAtivas = await executeQuery(`
      SELECT COUNT(*) AS total FROM GPFTB047_PROPOSTA_SEGURIDADE ps
      JOIN GPFTB053_SITUACAO_PROPOSTA sp ON ps.NU_SITUACAO_PROPOSTA = sp.NU_SITUACAO_PROPOSTA
      WHERE sp.SG_SITUACAO_PROPOSTA NOT IN ('CAN', 'REJ', 'CAD', 'EXC')
    `);

    const propostasGER2h = await executeQuery(`
      SELECT COUNT(*) AS total FROM (
        SELECT ps.NU_PROPOSTA_SEGURIDADE, MAX(ep.TS_CRIACAO) AS ultima_atualizacao
        FROM GPFTB047_PROPOSTA_SEGURIDADE ps
        JOIN GPFTB048_EVOLUCAO_PROPOSTA ep ON ps.NU_PROPOSTA_SEGURIDADE = ep.NU_PROPOSTA_SEGURIDADE
        JOIN GPFTB050_ACAO_FLUXO_SERVICO afs ON ep.NU_ACAO_FLUXO_SERVICO = afs.NU_ACAO_FLUXO_SERVICO
        JOIN GPFTB053_SITUACAO_PROPOSTA sp ON afs.NU_SITUACAO_PROPOSTA = sp.NU_SITUACAO_PROPOSTA
        WHERE sp.SG_SITUACAO_PROPOSTA = 'GER'
        GROUP BY ps.NU_PROPOSTA_SEGURIDADE
        HAVING (SYSDATE - MAX(ep.TS_CRIACAO)) * 24 > 2
      )
    `);

    const taxaConversao = await executeQuery(`
      SELECT 
        ROUND(
          (SELECT COUNT(*) FROM GPFTB047_PROPOSTA_SEGURIDADE ps
           JOIN GPFTB053_SITUACAO_PROPOSTA sp ON ps.NU_SITUACAO_PROPOSTA = sp.NU_SITUACAO_PROPOSTA
           WHERE sp.SG_SITUACAO_PROPOSTA = 'ATV') * 100 /
          NULLIF((SELECT COUNT(*) FROM GPFTB047_PROPOSTA_SEGURIDADE), 0),
          2
        ) AS taxa
      FROM dual
    `);

    res.json({
      totalPropostas: totalPropostas[0]?.TOTAL || 0,
      propostasAtivas: propostasAtivas[0]?.TOTAL || 0,
      propostasGER2h: propostasGER2h[0]?.TOTAL || 0,
      taxaConversao: taxaConversao[0]?.TAXA || 0
    });
  } catch (err) {
    console.error('Erro ao obter KPIs:', err);
    res.status(500).json({ error: 'Erro ao obter KPIs' });
  }
});

// Endpoint: Obter distribuição de propostas por situação
app.get('/api/distribuicao-situacao', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        sp.NU_SITUACAO_PROPOSTA,
        sp.SG_SITUACAO_PROPOSTA,
        sp.DE_SITUACAO_PROPOSTA,
        COUNT(ps.NU_PROPOSTA_SEGURIDADE) AS QTD_PROPOSTAS,
        ROUND(COUNT(ps.NU_PROPOSTA_SEGURIDADE) * 100 / 
          (SELECT COUNT(*) FROM GPFTB047_PROPOSTA_SEGURIDADE), 2) AS PERCENTUAL
      FROM GPFTB047_PROPOSTA_SEGURIDADE ps
      JOIN GPFTB053_SITUACAO_PROPOSTA sp ON ps.NU_SITUACAO_PROPOSTA = sp.NU_SITUACAO_PROPOSTA
      GROUP BY sp.NU_SITUACAO_PROPOSTA, sp.SG_SITUACAO_PROPOSTA, sp.DE_SITUACAO_PROPOSTA
      ORDER BY COUNT(ps.NU_PROPOSTA_SEGURIDADE) DESC
    `);
    
    res.json(result);
  } catch (err) {
    console.error('Erro ao obter distribuição por situação:', err);
    res.status(500).json({ error: 'Erro ao obter distribuição por situação' });
  }
});

// Endpoint: Obter propostas em GER por mais de 2 horas
app.get('/api/propostas-ger-2h', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        ps.NU_PROPOSTA,
        ps.NU_DV_PROPOSTA,
        (SYSDATE - MAX(ep.TS_CRIACAO)) * 24 AS HORAS_EM_GER,
        CASE
          WHEN (SYSDATE - MAX(ep.TS_CRIACAO)) * 24 <= 2 THEN 'Normal'
          WHEN (SYSDATE - MAX(ep.TS_CRIACAO)) * 24 <= 4 THEN 'Atenção'
          WHEN (SYSDATE - MAX(ep.TS_CRIACAO)) * 24 <= 8 THEN 'Crítico'
          ELSE 'Bloqueado'
        END AS STATUS_ALERTA,
        MAX(ep.TS_CRIACAO) AS ULTIMA_ATUALIZACAO,
        ms.NU_CANAL_SEGURIDADE,
        ms.NU_EMPRESA_SEGURIDADE
      FROM GPFTB047_PROPOSTA_SEGURIDADE ps
      JOIN GPFTB048_EVOLUCAO_PROPOSTA ep ON ps.NU_PROPOSTA_SEGURIDADE = ep.NU_PROPOSTA_SEGURIDADE
      JOIN GPFTB050_ACAO_FLUXO_SERVICO afs ON ep.NU_ACAO_FLUXO_SERVICO = afs.NU_ACAO_FLUXO_SERVICO
      JOIN GPFTB053_SITUACAO_PROPOSTA sp ON afs.NU_SITUACAO_PROPOSTA = sp.NU_SITUACAO_PROPOSTA
      LEFT JOIN GPFTB046_MNTCO_PRPSA_SGRDE mps ON ps.NU_PROPOSTA_SEGURIDADE = mps.NU_PROPOSTA_SEGURIDADE
      LEFT JOIN GPFTB045_MONITORACAO_SISTEMA ms ON mps.NU_MONITORACAO_SISTEMA = ms.NU_MONITORACAO_SISTEMA
      WHERE sp.SG_SITUACAO_PROPOSTA = 'GER'
      GROUP BY ps.NU_PROPOSTA, ps.NU_DV_PROPOSTA, ms.NU_CANAL_SEGURIDADE, ms.NU_EMPRESA_SEGURIDADE
      HAVING (SYSDATE - MAX(ep.TS_CRIACAO)) * 24 > 2
      ORDER BY (SYSDATE - MAX(ep.TS_CRIACAO)) * 24 DESC
    `);
    
    res.json(result);
  } catch (err) {
    console.error('Erro ao obter propostas GER > 2h:', err);
    res.status(500).json({ error: 'Erro ao obter propostas GER > 2h' });
  }
});

// Endpoint: Obter evolução de propostas ao longo do tempo
app.get('/api/evolucao-propostas', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        TRUNC(ep.TS_CRIACAO) AS DATA,
        COUNT(DISTINCT ps.NU_PROPOSTA_SEGURIDADE) AS QTD_PROPOSTAS
      FROM GPFTB048_EVOLUCAO_PROPOSTA ep
      JOIN GPFTB050_ACAO_FLUXO_SERVICO afs ON ep.NU_ACAO_FLUXO_SERVICO = afs.NU_ACAO_FLUXO_SERVICO
      JOIN GPFTB047_PROPOSTA_SEGURIDADE ps ON ep.NU_PROPOSTA_SEGURIDADE = ps.NU_PROPOSTA_SEGURIDADE
      WHERE afs.NU_TIPO_ACAO_FLUXO_SERVICO = 2 -- Gerar Proposta
      GROUP BY TRUNC(ep.TS_CRIACAO)
      ORDER BY TRUNC(ep.TS_CRIACAO)
    `);
    
    res.json(result);
  } catch (err) {
    console.error('Erro ao obter evolução de propostas:', err);
    res.status(500).json({ error: 'Erro ao obter evolução de propostas' });
  }
});

// Endpoint: Obter tempo médio em cada situação
app.get('/api/tempo-medio-situacao', async (req, res) => {
  try {
    const result = await executeQuery(`
      WITH evolucao_ordenada AS (
        SELECT 
          ep.NU_PROPOSTA_SEGURIDADE,
          ep.TS_CRIACAO,
          sp.SG_SITUACAO_PROPOSTA,
          sp.DE_SITUACAO_PROPOSTA,
          LEAD(ep.TS_CRIACAO) OVER (PARTITION BY ep.NU_PROPOSTA_SEGURIDADE ORDER BY ep.TS_CRIACAO) AS NEXT_TS
        FROM GPFTB048_EVOLUCAO_PROPOSTA ep
        JOIN GPFTB050_ACAO_FLUXO_SERVICO afs ON ep.NU_ACAO_FLUXO_SERVICO = afs.NU_ACAO_FLUXO_SERVICO
        JOIN GPFTB053_SITUACAO_PROPOSTA sp ON afs.NU_SITUACAO_PROPOSTA = sp.NU_SITUACAO_PROPOSTA
      )
      SELECT 
        SG_SITUACAO_PROPOSTA,
        DE_SITUACAO_PROPOSTA,
        ROUND(AVG((NEXT_TS - TS_CRIACAO) * 24 * 60), 2) AS TEMPO_MEDIO_MINUTOS,
        ROUND(AVG((NEXT_TS - TS_CRIACAO) * 24), 2) AS TEMPO_MEDIO_HORAS,
        ROUND(AVG((NEXT_TS - TS_CRIACAO)), 2) AS TEMPO_MEDIO_DIAS,
        COUNT(DISTINCT NU_PROPOSTA_SEGURIDADE) AS QTD_PROPOSTAS
      FROM evolucao_ordenada
      WHERE NEXT_TS IS NOT NULL
      GROUP BY SG_SITUACAO_PROPOSTA, DE_SITUACAO_PROPOSTA
      ORDER BY TEMPO_MEDIO_DIAS DESC
    `);
    
    res.json(result);
  } catch (err) {
    console.error('Erro ao obter tempo médio por situação:', err);
    res.status(500).json({ error: 'Erro ao obter tempo médio por situação' });
  }
});

// Endpoint: Obter conversão entre etapas principais (funil)
app.get('/api/conversao-etapas', async (req, res) => {
  try {
    const result = await executeQuery(`
      WITH etapas AS (
        SELECT 1 AS ORDEM, 'GER' AS ETAPA, 'PROPOSTA GERADA' AS DESCRICAO FROM dual
        UNION ALL
        SELECT 2 AS ORDEM, 'PAE' AS ETAPA, 'PROPOSTA AGUARDANDO EMISSAO' AS DESCRICAO FROM dual
        UNION ALL
        SELECT 3 AS ORDEM, 'EMT' AS ETAPA, 'DOCUMENTO EMITIDO' AS DESCRICAO FROM dual
        UNION ALL
        SELECT 4 AS ORDEM, 'ATV' AS ETAPA, 'TITULO ATIVADO' AS DESCRICAO FROM dual
      ),
      contagem_etapas AS (
        SELECT 
          e.ORDEM,
          e.ETAPA,
          e.DESCRICAO,
          COUNT(DISTINCT ps.NU_PROPOSTA_SEGURIDADE) AS QTD_PROPOSTAS
        FROM etapas e
        JOIN GPFTB053_SITUACAO_PROPOSTA sp ON e.ETAPA = sp.SG_SITUACAO_PROPOSTA
        LEFT JOIN GPFTB047_PROPOSTA_SEGURIDADE ps ON sp.NU_SITUACAO_PROPOSTA = ps.NU_SITUACAO_PROPOSTA
        GROUP BY e.ORDEM, e.ETAPA, e.DESCRICAO
      ),
      total_ger AS (
        SELECT QTD_PROPOSTAS
        FROM contagem_etapas
        WHERE ETAPA = 'GER'
      )
      SELECT 
        ce.ORDEM,
        ce.ETAPA,
        ce.DESCRICAO,
        ce.QTD_PROPOSTAS,
        ROUND(ce.QTD_PROPOSTAS * 100 / NULLIF((SELECT QTD_PROPOSTAS FROM total_ger), 0), 2) AS TAXA_CONVERSAO
      FROM contagem_etapas ce
      ORDER BY ce.ORDEM
    `);
    
    res.json(result);
  } catch (err) {
    console.error('Erro ao obter conversão entre etapas:', err);
    res.status(500).json({ error: 'Erro ao obter conversão entre etapas' });
  }
});

// Endpoint: Obter motivos de rejeição/cancelamento
app.get('/api/motivos-rejeicao', async (req, res) => {
  try {
    const result = await executeQuery(`
      WITH propostas_canceladas AS (
        SELECT ps.NU_PROPOSTA_SEGURIDADE
        FROM GPFTB047_PROPOSTA_SEGURIDADE ps
        JOIN GPFTB053_SITUACAO_PROPOSTA sp ON ps.NU_SITUACAO_PROPOSTA = sp.NU_SITUACAO_PROPOSTA
        WHERE sp.SG_SITUACAO_PROPOSTA IN ('CAN', 'REJ')
      ),
      total_canceladas AS (
        SELECT COUNT(*) AS total FROM propostas_canceladas
      )
      SELECT 
        ms.NU_MOTIVO_SISTEMA,
        ms.DE_MOTIVO_SISTEMA,
        COUNT(DISTINCT pc.NU_PROPOSTA_SEGURIDADE) AS QTD_PROPOSTAS,
        ROUND(COUNT(DISTINCT pc.NU_PROPOSTA_SEGURIDADE) * 100 / 
          NULLIF((SELECT total FROM total_canceladas), 0), 2) AS PERCENTUAL
      FROM propostas_canceladas pc
      JOIN GPFTB046_MNTCO_PRPSA_SGRDE mps ON pc.NU_PROPOSTA_SEGURIDADE = mps.NU_PROPOSTA_SEGURIDADE
      JOIN GPFTB045_MONITORACAO_SISTEMA ms_sys ON mps.NU_MONITORACAO_SISTEMA = ms_sys.NU_MONITORACAO_SISTEMA
      JOIN GPFTB050_ACAO_FLUXO_SERVICO afs ON ms_sys.NU_ACAO_FLUXO_SERVICO = afs.NU_ACAO_FLUXO_SERVICO
      JOIN GPFTB052_MOTIVO_SISTEMA ms ON afs.NU_MOTIVO_SISTEMA = ms.NU_MOTIVO_SISTEMA
      GROUP BY ms.NU_MOTIVO_SISTEMA, ms.DE_MOTIVO_SISTEMA
      ORDER BY COUNT(DISTINCT pc.NU_PROPOSTA_SEGURIDADE) DESC
    `);
    
    res.json(result);
  } catch (err) {
    console.error('Erro ao obter motivos de rejeição:', err);
    res.status(500).json({ error: 'Erro ao obter motivos de rejeição' });
  }
});

// Endpoint: Obter desempenho por canal
app.get('/api/desempenho-canal', async (req, res) => {
  try {
    const result = await executeQuery(`
      WITH propostas_por_canal AS (
        SELECT 
          ms.NU_CANAL_SEGURIDADE,
          ps.NU_PROPOSTA_SEGURIDADE,
          sp.SG_SITUACAO_PROPOSTA
        FROM GPFTB045_MONITORACAO_SISTEMA ms
        JOIN GPFTB046_MNTCO_PRPSA_SGRDE mps ON ms.NU_MONITORACAO_SISTEMA = mps.NU_MONITORACAO_SISTEMA
        JOIN GPFTB047_PROPOSTA_SEGURIDADE ps ON mps.NU_PROPOSTA_SEGURIDADE = ps.NU_PROPOSTA_SEGURIDADE
        JOIN GPFTB053_SITUACAO_PROPOSTA sp ON ps.NU_SITUACAO_PROPOSTA = sp.NU_SITUACAO_PROPOSTA
      )
      SELECT 
        NU_CANAL_SEGURIDADE,
        COUNT(DISTINCT NU_PROPOSTA_SEGURIDADE) AS TOTAL_PROPOSTAS,
        COUNT(DISTINCT CASE WHEN SG_SITUACAO_PROPOSTA = 'ATV' THEN NU_PROPOSTA_SEGURIDADE END) AS PROPOSTAS_ATIVADAS,
        COUNT(DISTINCT CASE WHEN SG_SITUACAO_PROPOSTA IN ('CAN', 'REJ') THEN NU_PROPOSTA_SEGURIDADE END) AS PROPOSTAS_CANCELADAS,
        ROUND(COUNT(DISTINCT CASE WHEN SG_SITUACAO_PROPOSTA = 'ATV' THEN NU_PROPOSTA_SEGURIDADE END) * 100 / 
          NULLIF(COUNT(DISTINCT NU_PROPOSTA_SEGURIDADE), 0), 2) AS TAXA_ATIVACAO,
        ROUND(COUNT(DISTINCT CASE WHEN SG_SITUACAO_PROPOSTA IN ('CAN', 'REJ') THEN NU_PROPOSTA_SEGURIDADE END) * 100 / 
          NULLIF(COUNT(DISTINCT NU_PROPOSTA_SEGURIDADE), 0), 2) AS TAXA_CANCELAMENTO
      FROM propostas_por_canal
      GROUP BY NU_CANAL_SEGURIDADE
      ORDER BY COUNT(DISTINCT NU_PROPOSTA_SEGURIDADE) DESC
    `);
    
    res.json(result);
  } catch (err) {
    console.error('Erro ao obter desempenho por canal:', err);
    res.status(500).json({ error: 'Erro ao obter desempenho por canal' });
  }
});

// Endpoint: Obter volume de registros de monitoração
app.get('/api/volume-monitoracao', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        TRUNC(TS_CRIACAO) AS DATA,
        COUNT(*) AS QTD_REGISTROS
      FROM GPFTB045_MONITORACAO_SISTEMA
      GROUP BY TRUNC(TS_CRIACAO)
      ORDER BY TRUNC(TS_CRIACAO)
    `);
    
    res.json(result);
  } catch (err) {
    console.error('Erro ao obter volume de monitoração:', err);
    res.status(500).json({ error: 'Erro ao obter volume de monitoração' });
  }
});

// Inicialização do servidor
const PORT = process.env.PORT || 3001;

// Função para iniciar o servidor
async function startServer() {
  try {
    await initialize();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (err) {
    console.error('Erro ao iniciar o servidor:', err);
    process.exit(1);
  }
}

// Iniciar o servidor
startServer();

// Tratamento de encerramento do servidor
process.on('SIGINT', async () => {
  try {
    console.log('Fechando pool de conexões Oracle...');
    await oracledb.getPool().close(10);
    console.log('Pool de conexões Oracle fechado');
    process.exit(0);
  } catch (err) {
    console.error('Erro ao fechar pool de conexões:', err);
    process.exit(1);
  }
});

module.exports = app;
