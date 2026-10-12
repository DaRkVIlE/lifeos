-- =============================================================
-- Migration: 20261011000000_agent_actions.sql
-- Descrição: Tabela de auditoria imutável para todas as ações
--            do Digital Assistant Ykaros no LifeOS Híbrido.
-- Autor: NOESIS (KAIROS Engine) — Pacote A2
-- Data: 11/10/2026
-- =============================================================

CREATE TABLE IF NOT EXISTS agent_actions (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at       TIMESTAMPTZ NOT NULL    DEFAULT now(),
    user_id          UUID        NOT NULL    REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id         TEXT        NOT NULL    DEFAULT 'ykaros',
    tool_name        TEXT        NOT NULL,
    parameters       JSONB       NOT NULL    DEFAULT '{}',
    result           JSONB,
    status           TEXT        NOT NULL    DEFAULT 'pending'
                                 CHECK (status IN ('pending', 'success', 'error', 'rolled_back')),
    error_message    TEXT,
    reversible       BOOLEAN     NOT NULL    DEFAULT true,
    rollback_payload JSONB
);

-- =============================================================
-- Row Level Security
-- =============================================================
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;

-- Usuário visualiza seu próprio histórico de ações
CREATE POLICY "agent_actions_select_own"
    ON agent_actions FOR SELECT
    USING (auth.uid() = user_id);

-- Agente insere com JWT do usuário (nunca service_role)
CREATE POLICY "agent_actions_insert_own"
    ON agent_actions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Sem UPDATE policy: linhas são imutáveis (exceto status para rolled_back)
-- Sem DELETE policy: log de auditoria não pode ser apagado

-- =============================================================
-- Índices
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_agent_actions_user_created
    ON agent_actions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_actions_tool
    ON agent_actions(tool_name);

CREATE INDEX IF NOT EXISTS idx_agent_actions_status
    ON agent_actions(status)
    WHERE status IN ('pending', 'error');

-- =============================================================
-- Rollback deste script (emergência)
-- =============================================================
-- DROP TABLE IF EXISTS agent_actions;
