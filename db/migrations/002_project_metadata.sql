-- Voz da Rua
-- Migration: 002_project_metadata.sql
-- Objetivo: registrar metadados mínimos da instalação local.

CREATE TABLE IF NOT EXISTS project_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO project_metadata (key, value)
VALUES
    ('project', 'voz-da-rua'),
    ('database_scope', 'development')
ON CONFLICT (key) DO NOTHING;
