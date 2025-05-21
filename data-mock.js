// Arquivo: data-mock.js
// Descrição: Implementação de dados simulados para o dashboard quando não há conexão com o banco Oracle

// Função para gerar dados simulados para os KPIs
function getKpisMock() {
  return {
    totalPropostas: 1234,
    propostasAtivas: 789,
    propostasGER2h: 15,
    taxaConversao: 64.0
  };
}

// Função para gerar dados simulados para a distribuição de propostas por situação
function getDistribuicaoSituacaoMock() {
  return {
    timestamp: new Date().toLocaleString('pt-BR'),
    paginacao: {
      offset: 0,
      limit: 100,
      count: 7
    },
    situacaoRelatorio: [
      { sgSituacaoProposta: 'EMT', deSituacaoProposta: 'DOCUMENTO EMITIDO', quantidade: 146 },
      { sgSituacaoProposta: 'ENV', deSituacaoProposta: 'PROPOSTA VENDIDA', quantidade: 97 },
      { sgSituacaoProposta: 'REJ', deSituacaoProposta: 'REJEITADA', quantidade: 54 },
      { sgSituacaoProposta: 'CAN', deSituacaoProposta: 'CANCELADA', quantidade: 15 },
      { sgSituacaoProposta: 'MAN', deSituacaoProposta: 'PROP. RECEBIDA DA EMPRESA,AGUARDANDO EMISSAO', quantidade: 6 },
      { sgSituacaoProposta: 'EXC', deSituacaoProposta: 'REGISTRO EXCLUIDO', quantidade: 3 },
      { sgSituacaoProposta: 'GER', deSituacaoProposta: 'PROPOSTA GERADA ', quantidade: 1 }
    ]
  };
}

// Função para gerar dados simulados para propostas em GER por mais de 2 horas
function getPropostasGer2hMock() {
  return [
    { NU_PROPOSTA: 12345, NU_DV_PROPOSTA: 6, HORAS_EM_GER: 8.5, STATUS_ALERTA: 'Bloqueado', ULTIMA_ATUALIZACAO: new Date('2025-04-18T14:30:00'), NU_CANAL_SEGURIDADE: 1, NU_EMPRESA_SEGURIDADE: 2 },
    { NU_PROPOSTA: 23456, NU_DV_PROPOSTA: 7, HORAS_EM_GER: 5.2, STATUS_ALERTA: 'Crítico', ULTIMA_ATUALIZACAO: new Date('2025-04-18T15:45:00'), NU_CANAL_SEGURIDADE: 3, NU_EMPRESA_SEGURIDADE: 1 },
    { NU_PROPOSTA: 78901, NU_DV_PROPOSTA: 2, HORAS_EM_GER: 4.8, STATUS_ALERTA: 'Crítico', ULTIMA_ATUALIZACAO: new Date('2025-04-18T16:00:00'), NU_CANAL_SEGURIDADE: 2, NU_EMPRESA_SEGURIDADE: 3 },
    { NU_PROPOSTA: 34567, NU_DV_PROPOSTA: 8, HORAS_EM_GER: 3.7, STATUS_ALERTA: 'Atenção', ULTIMA_ATUALIZACAO: new Date('2025-04-18T16:20:00'), NU_CANAL_SEGURIDADE: 2, NU_EMPRESA_SEGURIDADE: 1 },
    { NU_PROPOSTA: 45678, NU_DV_PROPOSTA: 9, HORAS_EM_GER: 2.8, STATUS_ALERTA: 'Atenção', ULTIMA_ATUALIZACAO: new Date('2025-04-18T17:10:00'), NU_CANAL_SEGURIDADE: 1, NU_EMPRESA_SEGURIDADE: 3 }
  ];
}

// Função para gerar dados simulados para evolução de propostas ao longo do tempo
function getEvolucaoPropostasMock() {
  const result = [];
  const hoje = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() - i);
    
    // Gerar um número aleatório entre 20 e 60 para a quantidade de propostas
    const qtdPropostas = Math.floor(Math.random() * 41) + 20;
    
    result.push({
      DATA: data,
      QTD_PROPOSTAS: qtdPropostas
    });
  }
  
  return result;
}

// Função para gerar dados simulados para tempo médio em cada situação
function getTempoMedioSituacaoMock() {
  return [
    { SG_SITUACAO_PROPOSTA: 'GER', DE_SITUACAO_PROPOSTA: 'PROPOSTA GERADA', TEMPO_MEDIO_MINUTOS: 720.45, TEMPO_MEDIO_HORAS: 12.01, TEMPO_MEDIO_DIAS: 0.50, QTD_PROPOSTAS: 245 },
    { SG_SITUACAO_PROPOSTA: 'PAE', DE_SITUACAO_PROPOSTA: 'PROPOSTA AGUARDANDO EMISSAO', TEMPO_MEDIO_MINUTOS: 1440.30, TEMPO_MEDIO_HORAS: 24.00, TEMPO_MEDIO_DIAS: 1.00, QTD_PROPOSTAS: 187 },
    { SG_SITUACAO_PROPOSTA: 'EMT', DE_SITUACAO_PROPOSTA: 'DOCUMENTO EMITIDO', TEMPO_MEDIO_MINUTOS: 2880.15, TEMPO_MEDIO_HORAS: 48.00, TEMPO_MEDIO_DIAS: 2.00, QTD_PROPOSTAS: 156 },
    { SG_SITUACAO_PROPOSTA: 'ATV', DE_SITUACAO_PROPOSTA: 'TITULO ATIVADO', TEMPO_MEDIO_MINUTOS: 4320.75, TEMPO_MEDIO_HORAS: 72.01, TEMPO_MEDIO_DIAS: 3.00, QTD_PROPOSTAS: 132 },
    { SG_SITUACAO_PROPOSTA: 'CAN', DE_SITUACAO_PROPOSTA: 'PROPOSTA CANCELADA', TEMPO_MEDIO_MINUTOS: 1152.60, TEMPO_MEDIO_HORAS: 19.21, TEMPO_MEDIO_DIAS: 0.80, QTD_PROPOSTAS: 89 },
    { SG_SITUACAO_PROPOSTA: 'REJ', DE_SITUACAO_PROPOSTA: 'PROPOSTA REJEITADA', TEMPO_MEDIO_MINUTOS: 864.45, TEMPO_MEDIO_HORAS: 14.41, TEMPO_MEDIO_DIAS: 0.60, QTD_PROPOSTAS: 58 }
  ];
}

// Função para gerar dados simulados para conversão entre etapas principais (funil)
function getConversaoEtapasMock() {
  return [
    { ORDEM: 1, ETAPA: 'GER', DESCRICAO: 'PROPOSTA GERADA', QTD_PROPOSTAS: 245, TAXA_CONVERSAO: 100.00 },
    { ORDEM: 2, ETAPA: 'ENV', DESCRICAO: 'PROPOSTA AGUARDANDO EMISSAO', QTD_PROPOSTAS: 187, TAXA_CONVERSAO: 76.33 },
    { ORDEM: 3, ETAPA: 'EMT', DESCRICAO: 'DOCUMENTO EMITIDO', QTD_PROPOSTAS: 156, TAXA_CONVERSAO: 63.67 },
    { ORDEM: 4, ETAPA: 'EMT AUTO', DESCRICAO: 'DOCUMENTO EMITIDO AUTO', QTD_PROPOSTAS: 132, TAXA_CONVERSAO: 53.88 }
  ];
}

// Função para gerar dados simulados para motivos de rejeição/cancelamento
function getMotivosRejeicaoMock() {
  return [
    { NU_MOTIVO_SISTEMA: 1, DE_MOTIVO_SISTEMA: 'DADOS INCONSISTENTES', QTD_PROPOSTAS: 42, PERCENTUAL: 28.57 },
    { NU_MOTIVO_SISTEMA: 2, DE_MOTIVO_SISTEMA: 'DUPLICIDADE DE PROPOSTA', QTD_PROPOSTAS: 35, PERCENTUAL: 23.81 },
    { NU_MOTIVO_SISTEMA: 3, DE_MOTIVO_SISTEMA: 'ERRO DE PROCESSAMENTO', QTD_PROPOSTAS: 28, PERCENTUAL: 19.05 },
    { NU_MOTIVO_SISTEMA: 4, DE_MOTIVO_SISTEMA: 'SOLICITAÇÃO DO CLIENTE', QTD_PROPOSTAS: 22, PERCENTUAL: 14.97 },
    { NU_MOTIVO_SISTEMA: 5, DE_MOTIVO_SISTEMA: 'FALHA NA INTEGRAÇÃO', QTD_PROPOSTAS: 12, PERCENTUAL: 8.16 },
    { NU_MOTIVO_SISTEMA: 6, DE_MOTIVO_SISTEMA: 'OUTROS', QTD_PROPOSTAS: 8, PERCENTUAL: 5.44 }
  ];
}

// Função para gerar dados simulados para desempenho por canal
function getDesempenhoCanaisMock() {
  return [
    { NU_CANAL_SEGURIDADE: 1, TOTAL_PROPOSTAS: 450, PROPOSTAS_ATIVADAS: 315, PROPOSTAS_CANCELADAS: 45, TAXA_ATIVACAO: 70.00, TAXA_CANCELAMENTO: 10.00 },
    { NU_CANAL_SEGURIDADE: 2, TOTAL_PROPOSTAS: 350, PROPOSTAS_ATIVADAS: 210, PROPOSTAS_CANCELADAS: 70, TAXA_ATIVACAO: 60.00, TAXA_CANCELAMENTO: 20.00 },
    { NU_CANAL_SEGURIDADE: 3, TOTAL_PROPOSTAS: 250, PROPOSTAS_ATIVADAS: 175, PROPOSTAS_CANCELADAS: 25, TAXA_ATIVACAO: 70.00, TAXA_CANCELAMENTO: 10.00 },
    { NU_CANAL_SEGURIDADE: 4, TOTAL_PROPOSTAS: 184, PROPOSTAS_ATIVADAS: 92, PROPOSTAS_CANCELADAS: 55, TAXA_ATIVACAO: 50.00, TAXA_CANCELAMENTO: 29.89 }
  ];
}

// Função para gerar dados simulados para volume de registros de monitoração
function getVolumeMonitoracaoMock() {
  const result = [];
  const hoje = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() - i);
    
    // Gerar um número aleatório entre 50 e 150 para a quantidade de registros
    const qtdRegistros = Math.floor(Math.random() * 101) + 50;
    
    result.push({
      DATA: data,
      QTD_REGISTROS: qtdRegistros
    });
  }
  
  return result;
}

// Função para filtrar propostas com base nos parâmetros fornecidos
function filtrarPropostas(params) {
  const historico = require('./massa-historico.json');
  let propostas = historico.propostas;

  // Aplicar filtros
  if (params.nuPropostaSeguridade) {
    propostas = propostas.filter(p => p.nuPropostaSeguridade === parseInt(params.nuPropostaSeguridade));
  }

  if (params.sgSituacaoProposta) {
    propostas = propostas.filter(p => p.sgSituacaoProposta === params.sgSituacaoProposta);
  }

  if (params.dataInicio) {
    const dataInicio = new Date(params.dataInicio + 'T00:00:00');
    propostas = propostas.filter(p => {
      try {
        const [data, hora] = p.dataEvolucao.split(' ');
        const [dia, mes, ano] = data.split('/');
        const dataProposta = new Date(`${ano}-${mes}-${dia}T00:00:00`);
        return !isNaN(dataProposta) && dataProposta >= dataInicio;
      } catch (error) {
        console.error('Erro ao processar data:', p.dataEvolucao);
        return false;
      }
    });
  }

  if (params.dataFim) {
    const dataFim = new Date(params.dataFim + 'T23:59:59');
    propostas = propostas.filter(p => {
      try {
        const [data, hora] = p.dataEvolucao.split(' ');
        const [dia, mes, ano] = data.split('/');
        const dataProposta = new Date(`${ano}-${mes}-${dia}T00:00:00`);
        return !isNaN(dataProposta) && dataProposta <= dataFim;
      } catch (error) {
        console.error('Erro ao processar data:', p.dataEvolucao);
        return false;
      }
    });
  }

  // Calcular total de registros após aplicar filtros
  const totalRegistros = propostas.length;

  // Aplicar paginação
  const offset = parseInt(params.offset) || 0;
  const limit = parseInt(params.limit) || 10;
  propostas = propostas.slice(offset, offset + limit);

  return {
    paginacao: {
      offset: offset,
      limit: limit,
      count: totalRegistros
    },
    filtros: {
      nuPropostaSeguridade: params.nuPropostaSeguridade || null,
      sgSituacaoProposta: params.sgSituacaoProposta || null,
      dataInicio: params.dataInicio || null,
      dataFim: params.dataFim || null
    },
    timestamp: new Date().toLocaleString('pt-BR'),
    propostas: propostas
  };
}

module.exports = {
  getKpisMock,
  getDistribuicaoSituacaoMock,
  getPropostasGer2hMock,
  getEvolucaoPropostasMock,
  getTempoMedioSituacaoMock,
  getConversaoEtapasMock,
  getMotivosRejeicaoMock,
  getDesempenhoCanaisMock,
  getVolumeMonitoracaoMock,
  filtrarPropostas
};
