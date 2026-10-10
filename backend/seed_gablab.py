import os
import sys
import sqlite3
import json
import uuid
from datetime import datetime

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def now_iso():
    return datetime.now().isoformat()

def new_id():
    return str(uuid.uuid4())

USER_ID = 'local-user-001'

def seed_database(db_path):
    print(f"\n[LifeOS Seed] Atualizando dados em: {db_path}")
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    
    db = sqlite3.connect(db_path)
    db.row_factory = sqlite3.Row
    
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    app_py_path = os.path.join(backend_dir, 'app.py')
    
    with open(app_py_path, 'r', encoding='utf-8') as f:
        content = f.read()
    import re
    match = re.search(r'SCHEMA_SQL\s*=\s*"""(.*?)"""', content, re.DOTALL)
    if not match:
        raise ValueError("SCHEMA_SQL not found in app.py")
    schema_sql = match.group(1)
    
    db.executescript(schema_sql)
    
    # 1. Usuário & Perfil
    db.execute("""
        INSERT OR REPLACE INTO users (id, email, display_name, created_at, updated_at)
        VALUES (?, NULL, ?, ?, ?)
    """, (USER_ID, 'GABE', now_iso(), now_iso()))
    
    profile_prefs = json.dumps({
        "motto": "Clareza sem execução é devaneio. Um passo por vez. Um dia por vez.",
        "apelido": "GABE",
        "alter_ego": "O Condutor",
        "principles": [
            "Movimento antes de clareza (agir com 70% de certeza)",
            "Um foco por vez",
            "Fricção é sinal de recalibração",
            "Evidência antes de crença",
            "Sobrevivência e caixa primeiro",
            "Identidade segue ação"
        ],
        "estrategia_financeira": "Reinvestir capital inicial em impulsionamento/tráfego para acelerar tração e receita antes de quitar dívidas.",
        "cidade": "Grande ABC, São Paulo"
    }, ensure_ascii=False)
    
    db.execute("""
        INSERT OR REPLACE INTO user_profiles (
            user_id, email, full_name, timezone, subscription_tier, preferences, onboarding_complete, updated_at
        ) VALUES (?, NULL, ?, ?, ?, ?, 1, ?)
    """, (USER_ID, 'Gabriel Lima (GABE)', 'America/Sao_Paulo', 'pro', profile_prefs, now_iso()))
    
    # 2. Reset da Árvore de Atributos & RPG Character
    # Removidos: crescimento, god pool
    rpg_char_id = "char-gabe-001"
    stats_json = json.dumps({
        "voz": {"level": 2, "description": "Voz grave, comunicação e demos"},
        "arquitetura": {"level": 2, "description": "Stacks, infraestrutura e automações"},
        "agentificacao": {"level": 2, "description": "Orquestração de sistemas e agentes de IA"},
        "vendas": {"level": 1, "description": "Comunicação assertiva e fechamento"},
        "execucao": {"level": 1, "description": "Foco e conclusão de entregas"},
        "hipnose": {"level": 1, "description": "Autohipnose, ancoragem e rituais matinais"}
    }, ensure_ascii=False)
    
    equipment_json = json.dumps([
        {"slot": "armor", "name": "Dragonborn Voice", "rarity": "rare", "stats": "+20 Comunicação"},
        {"slot": "accessory", "name": "Streak Shield (1x)", "rarity": "uncommon", "stats": "Protege streak de 1 falha"}
    ], ensure_ascii=False)
    
    position_json = json.dumps({"map": "grand_abc", "x": 500, "y": 300})
    
    db.execute("""
        INSERT OR REPLACE INTO rpg_characters (
            id, user_id, name, class, stats, equipment, position, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (rpg_char_id, USER_ID, 'GABE', 'AI Ops Solopreneur', stats_json, equipment_json, position_json, now_iso()))
    
    # User XP reset
    db.execute("""
        INSERT OR REPLACE INTO user_xp (
            user_id, total_xp, level, current_level_xp, next_level_xp, updated_at
        ) VALUES (?, 0, 1, 0, 100, ?)
    """, (USER_ID, now_iso()))
    
    # Limpeza de tabelas para garantir dados atualizados e sem lixo
    for tbl in [
        'xp_events', 'achievements', 'habits', 'goals', 'tasks',
        'businesses', 'clients', 'bills', 'notes'
    ]:
        db.execute(f"DELETE FROM {tbl} WHERE user_id = ?", (USER_ID,))
    db.execute("DELETE FROM rpg_quest_log WHERE character_id = ? OR character_id IS NULL", (rpg_char_id,))
    
    # Conquistas e XP Events zerados conforme solicitado
    
    # 3. Negócio: Experia Solutions
    business_id = "biz-experia-001"
    db.execute("""
        INSERT INTO businesses (
            id, user_id, name, type, description, industry, revenue_model, monthly_revenue, monthly_expenses, icon, color, status, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    """, (
        business_id, USER_ID, 'Experia Solutions', 'business',
        'AI Operations Solopreneur & Automações Inteligentes',
        'Inteligência Artificial & Operações',
        'Projetos e Recorrência',
        0.0, 0.0, '🚀', '#00D4FF', 'active'
    ))
    
    # 4. Clientes: Apenas Paulo e Letícia (em stand by)
    clients_data = [
        ("client-paulo", "Paulo (Tapeceiro)", "Grande ABC", 400.0, "monthly", "Status: Stand by. Bot de triagem de pedidos e status no WhatsApp.", "#10B981"),
        ("client-leticia", "Letícia (Estética)", "Grande ABC", 400.0, "monthly", "Status: Stand by. Agendamentos e atendimento automatizado.", "#EC4899")
    ]
    for cid, name, addr, rate, rtype, notes, color in clients_data:
        db.execute("""
            INSERT INTO clients (
                id, user_id, name, address, rate, rate_type, notes, color, business_id, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (cid, USER_ID, name, addr, rate, rtype, notes, color, business_id))
        
    # 5. Hábitos Ativos (Removido: cold calls / contato real)
    habits_data = [
        ("hab-001", "🧠 Ritual Matinal (Autohipnose 10min)", "Ancoragem do alter ego O Condutor e clareza mental antes de telas", "🧠", "#8B5CF6", "daily", 1, 0, 7, "mindset", "morning", 10),
        ("hab-002", "⚔️ Missão Principal Executada", "Executar a missão prioritária do dia sem interrupção", "⚔️", "#EF4444", "daily", 1, 0, 5, "execucao", "morning", 60),
        ("hab-003", "📵 Sem Tela Social antes da Missão", "Sem rolagem passiva no celular/YouTube antes de terminar a missão do dia", "📵", "#F59E0B", "daily", 1, 0, 5, "foco", "all_day", 0),
        ("hab-004", "🌙 Handoff Noturno Preenchido", "Preencher o resumo do dia e definir o foco prioritário de amanhã", "🌙", "#6366F1", "daily", 1, 0, 5, "governance", "evening", 10)
    ]
    for hid, title, desc, icon, color, freq, tcnt, scurr, sbest, cat, tod, dur in habits_data:
        db.execute("""
            INSERT INTO habits (
                id, user_id, title, description, icon, color, frequency, target_count, streak_current, streak_best, category, time_of_day, duration_minutes, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (hid, USER_ID, title, desc, icon, color, freq, tcnt, scurr, sbest, cat, tod, dur))
        
    # 6. Metas Estratégicas (Foco em tração e reinvestimento em impulsionamento)
    goals_data = [
        ("goal-001", "Geração de Caixa Inicial", "Gerar capital inicial de entrada com primeiros fechamentos", "active", "finance", "revenue", 1500.0, 0.0, "high", "🎯", "#10B981"),
        ("goal-002", "Reinvestimento em Impulsionamento / Tráfego", "Reinvestir capital inicial em tráfego pago para alavancar receita e escala", "active", "business", "growth", 3000.0, 0.0, "high", "🚀", "#3B82F6"),
        ("goal-003", "Quitação Estratégica da Fila de Dívidas", "Quitar passivos em aberto após multiplicar o ganho com as campanhas", "active", "finance", "debt", 25000.0, 0.0, "medium", "🏦", "#8B5CF6")
    ]
    for gid, title, desc, status, dom, cat, exp_ret, prog, prio, icon, color in goals_data:
        db.execute("""
            INSERT INTO goals (
                id, user_id, title, description, status, domain, category, expected_return, progress, priority, icon, color, business_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (gid, USER_ID, title, desc, status, dom, cat, exp_ret, prog, prio, icon, color, business_id))
        
    # 7. Quests: Zeradas conforme solicitado ("Apagar todas as quests")
    # tasks e rpg_quest_log ficam vazias
    
    # 8. Fila de Dívidas / Contas (com anotação da estratégia de reinvestimento prévio)
    bills_data = [
        ("bill-001", "Água + Luz", 3000.0, "2026-06-30", "pending", "Prioridade básica. Negociar entrada mínima; saldo condicionado à alavancagem de receita."),
        ("bill-002", "Financiamento do Apartamento", 5000.0, "2026-07-31", "pending", "Quitar após gerar escala com impulsionamento."),
        ("bill-003", "IPTU", 12000.0, "2026-08-31", "pending", "Verificar execução fiscal e negociar parcelamento longo."),
        ("bill-004", "Serasa / Pendências", 5000.0, "2026-09-30", "pending", "Negociar via Limpa Nome com abatimento de até 90%.")
    ]
    for bid, title, amt, ddate, stat, notes in bills_data:
        db.execute("""
            INSERT INTO bills (
                id, user_id, title, amount, due_date, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (bid, USER_ID, title, amt, ddate, stat, notes))
        
    # 9. Caderno Estratégico (Notes)
    notes_data = [
        ("note-001", "O Condutor — Princípios Operacionais", """### Os Princípios Operacionais do Condutor:
1. **Movimento antes de clareza:** Age com 70% de certeza sem esperar 100%.
2. **Um foco por vez:** Uma missão concluída antes da próxima começar.
3. **Fricção é sinal de recalibração:** O desconforto faz parte do crescimento.
4. **Evidência antes de crença:** Ação primeiro; sentimento segue comportamento.
5. **Sobrevivência e caixa primeiro:** Base sólida antes de firulas.
6. **Identidade segue ação:** Execute repetidamente até se tornar a identidade dominante.""", 1),
        ("note-002", "Regra dos 10 Minutos & Anti-Procrastinação", """### Quando surgir impulso de dopamina rápida:
1. Pare imediatamente e espere 10 minutos.
2. Pergunte a si mesmo: *"O que o Condutor faria agora?"*
3. Se após 10 minutos ainda quiser, o automatismo cego foi rompido.
4. Fricção: Redes sociais e consumo passivo somente após a missão prioritária cumprida.""", 1),
        ("note-003", "Estratégia Financeira — Reinvestimento & Alavancagem", """### Modelo de Alavancagem Financeira:
- **Fase 1:** Entrada de capital inicial dos primeiros contratos.
- **Fase 2:** Reinvestir essa entrada diretamente em impulsionamento/tráfego qualificado para multiplicar o fluxo de demanda e receita.
- **Fase 3:** Com a esteira de faturamento tracionada, iniciar a liquidação estratégica e parcelamento da fila de dívidas sem asfixiar o caixa da operação.""", 1)
    ]
    for nid, title, content, is_pinned in notes_data:
        db.execute("""
            INSERT INTO notes (
                id, user_id, title, content, is_pinned, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (nid, USER_ID, title, content, is_pinned, now_iso()))
        
    db.commit()
    db.close()
    print(f"[LifeOS Seed] Banco {db_path} atualizado com sucesso!")

if __name__ == '__main__':
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    lifeos_db = os.path.join(backend_dir, 'lifeos.db')
    seed_database(lifeos_db)
    
    home_dir = os.path.expanduser('~')
    user_db = os.path.join(home_dir, '.lifeos', 'data.db')
    seed_database(user_db)
    print("\n[LifeOS Seed] Concluido com sucesso!")
