-- Migration: 20261011_agent_actions.sql
-- Description: Audit table for all Digital Assistant (Ykaros) actions in LifeOS

CREATE TABLE IF NOT EXISTS agent_actions (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    agent_id TEXT NOT NULL DEFAULT 'ykaros',
    tool_name TEXT NOT NULL,
    parameters TEXT NOT NULL DEFAULT '{}',
    result TEXT,
    status TEXT NOT NULL DEFAULT 'success',
    error_message TEXT,
    user_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_actions_user ON agent_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_created ON agent_actions(created_at);
