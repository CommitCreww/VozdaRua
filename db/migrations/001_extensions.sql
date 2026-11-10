-- Voz da Rua
-- Migration: 001_extensions.sql
-- Objetivo: habilitar extensões essenciais do banco.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
