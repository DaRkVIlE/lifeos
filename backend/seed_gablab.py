import os
import sys
import sqlite3
import json
import uuid
from datetime import datetime, date

def now_iso():
    return datetime.now().isoformat()

def new_id():
    return str(uuid.uuid4())

USER_ID = 'local-user-001'

def seed_database(db_path):
    print(f"\n[LifeOS Seed] Initializing and seeding: {db_path}")
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    
    # Connect and enable WAL
    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row
    
    # Read schema from schema.sql in brain or app.py
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    app_py_path = os.path.join(backend_dir, 'app.py')
    
    # Extract SCHEMA_SQL from app.py
    with open(app_py_path, 'r', encoding='utf-8') as f:
        content = f.read()
    import re
    match = re.search(r'SCHEMA_SQL\s*=\s*"""(.*?)"""', content, re.DOTALL)
    if not match:
        raise ValueError("Could not find SCHEMA_SQL in app.py")
    schema_sql = match.group(1)
    
    db.executescript(schema_sql)
    
    # 1. Users & User Profiles
    db.execute("""
        INSERT OR REPLACE INTO users (id, email, display_name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
    """, (USER_ID, 'gabriel@experia.solutions', 'Gabriel Ferreira', now_iso(), now_iso()))
    
    profile_prefs = json.dumps({
        "motto": "Clareza sem execução é devaneio. Um passo por vez. Um dia por vez.",
        "archetype": "Dragonborn — Voice of the Dragonborn",
        "alter_ego": "O Condutor",
        "principles": [
            "Movimento antes de clareza (agir com 70% de certeza)",
            "Um foco por vez",
            "Fricção é sinal de recalibração",
            "Evidência antes de crença",
            "Sobrevivência primeiro",
            "Permuta é estratégia",
            "Identidade segue ação"
        ],
        "city": "Grande ABC, São Paulo"
    }, ensure_ascii=False)
    
    db.execute("""
        INSERT OR REPLACE INTO user_profiles (
            user_id, email, full_name, timezone, subscription_tier, preferences, onboarding_complete, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    """, (USER_ID, 'gabriel@experia.solutions', 'Gabriel Ferreira', 'America/Sao_Paulo', 'pro', profile_prefs, now_iso()))
    
    # 2. RPG Character & XP
    rpg_char_id = "char-gabriel-001"
    stats_json = json.dumps({
        "voz": {"level": 2, "description": "Voz grave, narração de demos, podcasts"},
        "arquitetura": {"level": 2, "description": "Stacks N8N, Evolution API, deploys"},
        "agentificacao": {"level": 3, "description": "God Pool 84 keys operacional"},
        "vendas": {"level": 1, "description": "Script pronto, abordagem direta"},
        "execucao": {"level": 1, "description": "Conclusão de entregas reais"},
        "hipnose": {"level": 1, "description": "Autohipnose e rituais matinais"},
        "crescimento": {"level": 1, "description": "Conversão de clientes pagantes"}
    }, ensure_ascii=False)
    
    equipment_json = json.dumps([
        {"slot": "main_hand", "name": "God Pool 84 Keys", "rarity": "rare", "stats": "+30 Agentificação"},
        {"slot": "armor", "name": "Dragonborn Voice", "rarity": "epic", "stats": "+20 Comunicação"},
        {"slot": "accessory", "name": "Streak Shield (1x)", "rarity": "uncommon", "stats": "Protege streak de 1 falha"}
    ], ensure_ascii=False)
    
    position_json = json.dumps({"map": "grand_abc", "x": 500, "y": 300})
    
    db.execute("""
        INSERT OR REPLACE INTO rpg_characters (
            id, user_id, name, class, stats, equipment, position, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (rpg_char_id, USER_ID, 'Gabriel Ferreira', 'AI Ops Solopreneur', stats_json, equipment_json, position_json, now_iso()))
    
    # User XP
    db.execute("""
        INSERT OR REPLACE INTO user_xp (
            user_id, total_xp, level, current_level_xp, next_level_xp, updated_at
        ) VALUES (?, 55, 1, 55, 100, ?)
    """, (USER_ID, now_iso()))
    
    # Clean previous records for idempotency
    for tbl in ['xp_events', 'achievements', 'habits', 'goals', 'tasks', 'businesses', 'clients', 'bills', 'notes']:
        db.execute(f"DELETE FROM {tbl} WHERE user_id = ?", (USER_ID,))
    
    # XP Events
    xp_events_data = [
        (20, 'conquista', 'God Pool 84 keys operacional'),
        (15, 'squad', 'Squad experia-commerce L3 criado'),
        (10, 'sistema', 'GABLAB v1.0 consolidado'),
        (10, 'sistema', 'GABLAB v2.0 Motor de gamificação integrado')
    ]
    for amount, source, desc in xp_events_data:
        db.execute("""
            INSERT INTO xp_events (id, user_id, amount, source, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (new_id(), USER_ID, amount, source, desc, now_iso()))
        
    # Achievements
    achievements_data = [
        ("ach-001", "Arquiteto", "GABLAB v1.0 criado e consolidado", "🧪", 50, "silver", "sistema"),
        ("ach-002", "Motor Ligado", "GABLAB v2.0 — gamificação completa integrada", "⚙️", 35, "silver", "sistema"),
        ("ach-003", "O Primeiro Contato", "Contato realizado com Paulo Tapeceiro (Boss 4)", "📱", 20, "bronze", "clients"),
        ("ach-004", "God Pool 84 keys", "Pool de 84 keys de IA operacional", "⚡", 20, "gold", "infraestrutura")
    ]
    for code, title, desc, icon, reward, tier, cat in achievements_data:
        db.execute("""
            INSERT INTO achievements (id, user_id, code, title, description, icon, xp_reward, tier, category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (new_id(), USER_ID, code, title, desc, icon, reward, tier, cat))
        
    # 3. Business: Experia Solutions
    business_id = "biz-experia-001"
    db.execute("""
        INSERT INTO businesses (
            id, user_id, name, type, description, industry, revenue_model, monthly_revenue, monthly_expenses, icon, color, status, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    """, (
        business_id, USER_ID, 'Experia Solutions', 'business',
        'AI Operations Solopreneur & Automações Inteligentes para Pequenos Negócios',
        'Inteligência Artificial & Automação',
        'Recorrência mensal (R$ 300 - R$ 997/mês) e projetos pontuais',
        0.0, 0.0, '🚀', '#00D4FF', 'active'
    ))
    
    # 4. Clients
    clients_data = [
        ("client-001", "Paulo (Tapeceiro)", "paulo@local", "11976162450", "Grande ABC", 400.0, "monthly", "Desbloqueado 2FA. Bot de triagem de pedidos e status no WhatsApp.", "#10B981"),
        ("client-002", "Hortifruti (Elaine)", "elaine@local", "", "Grande ABC", 600.0, "monthly", "Trial ativo. Necessita calibração de persona e Morning Report.", "#F59E0B"),
        ("client-003", "Técnico do Celular", "tecnico@local", "", "Grande ABC", 450.0, "fixed", "Case Zero — Permuta por conserto do celular. Enviar mensagem de proposta.", "#3B82F6"),
        ("client-004", "Felix Cell", "felix@local", "", "Grande ABC", 400.0, "monthly", "Mapeado na rede de contatos. Abordar após Case Zero.", "#8B5CF6")
    ]
    for cid, name, email, phone, addr, rate, rtype, notes, color in clients_data:
        db.execute("""
            INSERT INTO clients (
                id, user_id, name, email, phone, address, rate, rate_type, notes, color, business_id, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (cid, USER_ID, name, email, phone, addr, rate, rtype, notes, color, business_id))
        
    # 5. Habits (com base no GABLAB OS)
    habits_data = [
        ("hab-001", "🧠 Ritual Matinal (Autohipnose 10min)", "Ancoragem do alter ego O Condutor e clareza mental antes de telas", "🧠", "#8B5CF6", "daily", 1, 0, 7, "mindset", "morning", 10),
        ("hab-002", "⚔️ Missão Principal Executada", "Executar a quest principal prioritária do dia sem interrupção", "⚔️", "#EF4444", "daily", 1, 0, 5, "execucao", "morning", 60),
        ("hab-003", "📵 Sem Tela Social antes da Missão", "Sem rolagem passiva no celular/YouTube antes de terminar a missão do dia", "📵", "#F59E0B", "daily", 1, 0, 5, "foco", "all_day", 0),
        ("hab-004", "📞 1 Contato Real (Cliente/Rede)", "Enviar pelo menos 1 mensagem de valor, follow-up ou prospecção para cliente", "📞", "#10B981", "daily", 1, 0, 5, "vendas", "afternoon", 15),
        ("hab-005", "🌙 Handoff Noturno Preenchido", "Preencher o resumo do dia e definir a quest prioritária de amanhã", "🌙", "#6366F1", "daily", 1, 0, 5, "governance", "evening", 10)
    ]
    for hid, title, desc, icon, color, freq, tcnt, scurr, sbest, cat, tod, dur in habits_data:
        db.execute("""
            INSERT INTO habits (
                id, user_id, title, description, icon, color, frequency, target_count, streak_current, streak_best, category, time_of_day, duration_minutes, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (hid, USER_ID, title, desc, icon, color, freq, tcnt, scurr, sbest, cat, tod, dur))
        
    # 6. Goals (Metas Financeiras & Estruturais)
    goals_data = [
        ("goal-001", "Meta Financeira Mês 1: R$ 1.000", "Sobrevivência, base estável e primeiros contratos de IA", "active", "finance", "revenue", 1000.0, 0.0, "2026-06-30", "high", "🎯", "#10B981"),
        ("goal-002", "Meta Financeira Mês 2: R$ 2.500", "Expansão da carteira com 5-6 clientes recorrentes", "active", "finance", "revenue", 2500.0, 0.0, "2026-07-31", "high", "📈", "#3B82F6"),
        ("goal-003", "Meta Financeira Mês 3: R$ 4.000 (Soberania)", "10 clientes recorrentes x R$ 400/mês", "active", "finance", "revenue", 4000.0, 0.0, "2026-08-31", "high", "👑", "#8B5CF6"),
        ("goal-004", "Boss 1: MVP Infrastructure no Railway", "N8N + Evolution API operacionais no Railway", "active", "business", "infra", 0.0, 0.3, "2026-05-25", "high", "⚡", "#EF4444"),
        ("goal-005", "Boss 2: Case Zero — Permuta Celular", "Conserto do celular em permuta por chatbot e case study documentado", "active", "business", "clients", 450.0, 0.2, "2026-05-30", "high", "📱", "#F59E0B"),
        ("goal-006", "Regularização e Quitação de Dívidas", "Acordo concessionárias (Água/Luz), Apartamento, IPTU e Serasa", "active", "finance", "debt", 25000.0, 0.0, "2026-12-31", "urgent", "🏦", "#EC4899")
    ]
    for gid, title, desc, status, dom, cat, exp_ret, prog, tdate, prio, icon, color in goals_data:
        db.execute("""
            INSERT INTO goals (
                id, user_id, title, description, status, domain, category, expected_return, progress, target_date, priority, icon, color, business_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (gid, USER_ID, title, desc, status, dom, cat, exp_ret, prog, tdate, prio, icon, color, business_id))
        
    # 7. Tasks (Quests do Daily Board & Boss Fights)
    today_str = date.today().isoformat()
    tasks_data = [
        ("task-001", "goal-005", "Primeiro Sangue: Enviar mensagem de permuta para o Técnico do Celular", "Proposta de permuta pronta em BOSS_FIGHTS.md. Ação de 3 minutos.", "todo", "urgent", today_str, 5, "todo", "communication"),
        ("task-002", "goal-004", "O Diagnóstico: Agendar conversa de diagnóstico com Paulo (30 min)", "Confirmar horário para mapear fluxo de pedidos e status no WhatsApp.", "todo", "high", today_str, 15, "todo", "clients"),
        ("task-003", "goal-004", "O Golem Acorda: Deploy do N8N e Evolution API no Railway", "Configurar N8N + Evolution API no Railway para conectar o WhatsApp.", "todo", "high", today_str, 60, "todo", "infra"),
        ("task-004", "goal-004", "Calibrar persona do Bot da Hortifruti Elaine e Morning Report", "Ajustar respostas e configurar envio automático do relatório diário.", "todo", "medium", today_str, 30, "todo", "clients"),
        ("task-005", "goal-006", "Negociar parcelamento da conta de Água e Luz", "Ligar para concessionária, propor entrada mínima e maior número de parcelas.", "todo", "urgent", today_str, 20, "todo", "finance")
    ]
    for tid, gid, title, desc, status, prio, ddate, emin, bstat, dom in tasks_data:
        db.execute("""
            INSERT INTO tasks (
                id, user_id, goal_id, title, description, status, priority, due_date, estimated_minutes, board_status, domain
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (tid, USER_ID, gid, title, desc, status, prio, ddate, emin, bstat, dom))
        
    # 8. Bills (Fila de Dívidas / Contas)
    bills_data = [
        ("bill-001", "Água + Luz (Concessionárias)", 3000.0, "2026-05-25", "pending", "🔴 Prioridade 1 Crítica: Risco de corte. Ligar e negociar acordo com entrada mínima."),
        ("bill-002", "Financiamento do Apartamento", 5000.0, "2026-06-15", "pending", "🟠 Prioridade 2 Alta: Proteger bem de moradia assim que gerar caixa."),
        ("bill-003", "IPTU em Atraso", 12000.0, "2026-07-30", "pending", "🟡 Prioridade 3 Alta: Verificar execução fiscal no cartório/prefeitura e parcelar."),
        ("bill-004", "Serasa / Pendências Comerciais", 5000.0, "2026-08-30", "pending", "🟡 Prioridade 4 Média: Aguardar feirão Limpa Nome para negociar com até 90% desconto.")
    ]
    for bid, title, amt, ddate, stat, notes in bills_data:
        db.execute("""
            INSERT INTO bills (
                id, user_id, title, amount, due_date, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (bid, USER_ID, title, amt, ddate, stat, notes))
        
    # 9. Notes (Caderno Estratégico / Regras de Vida)
    notes_data = [
        ("note-001", "O Condutor — Princípios Operacionais", """### Os 7 Princípios Operacionais do Condutor:
1. **Movimento antes de clareza:** Age com 70% de certeza sem esperar 100%.
2. **Um foco por vez:** Uma missão concluída antes da próxima começar.
3. **Fricção é sinal de recalibração:** O desconforto faz parte da forja.
4. **Evidência antes de crença:** Ação primeiro; sentimento segue comportamento.
5. **Sobrevivência primeiro:** Base estável antes de otimizações complexas.
6. **Permuta é estratégia:** Sem vergonha de trocar valor técnico por soluções imediatas.
7. **Identidade segue ação:** Execute repetidamente até se tornar a identidade dominante.""", 1),
        ("note-002", "Regra dos 10 Minutos & Anti-Procrastinação", """### Quando surgir impulso de dopamina rápida:
1. Pare imediatamente e espere 10 minutos.
2. Pergunte a si mesmo: *"O que o Condutor faria agora?"*
3. Se após 10 minutos ainda quiser, quebrou o automatismo cego.
4. Fricção: Redes sociais e vídeos somente no computador após às 20h e após a missão principal terminada.""", 1),
        ("note-003", "God Pool 84 Keys & Infraestrutura", """### Infraestrutura Ativa de IA:
- 84 API keys distribuídas entre 6 provedores.
- Modelos prioritários: Llama 3.3 70B Versatile (Groq), Claude, OpenAI.
- Pipeline: N8N orchestrator + Evolution API para WhatsApp.""", 0)
    ]
    for nid, title, content, is_pinned in notes_data:
        db.execute("""
            INSERT INTO notes (
                id, user_id, title, content, is_pinned, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (nid, USER_ID, title, content, is_pinned, now_iso()))
        
    db.commit()
    db.close()
    print(f"[LifeOS Seed] Successfully seeded {db_path} with GABLAB OS context!")

if __name__ == '__main__':
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    # Seed 1: backend/lifeos.db
    lifeos_db = os.path.join(backend_dir, 'lifeos.db')
    seed_database(lifeos_db)
    
    # Seed 2: user home ~/.lifeos/data.db
    home_dir = os.path.expanduser('~')
    user_db = os.path.join(home_dir, '.lifeos', 'data.db')
    seed_database(user_db)
    print("\n[LifeOS Seed] Finished successfully! All databases seeded with GABLAB OS context.")
