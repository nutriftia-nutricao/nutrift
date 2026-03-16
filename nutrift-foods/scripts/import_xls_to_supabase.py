#!/usr/bin/env python3
"""
import_xls_to_supabase.py
Lê um arquivo XLS/XLSX de alimentos e faz o seed na tabela `foods` do Supabase.

Uso:
  python import_xls_to_supabase.py <caminho_do_arquivo.xls>

Exemplo:
  python nutrift-foods/scripts/import_xls_to_supabase.py C:/Users/FERNANDO/Downloads/taco.xls
"""

import sys
import os
import json
import re
import uuid

# ---------------------------------------------------------------------------
# CREDENCIAIS — lidas do .env do projeto (raiz do repositório)
# ---------------------------------------------------------------------------
SUPABASE_URL = "https://qwayegsfyzbqgdfoulet.supabase.co"

def _load_env_file() -> str:
    """Lê SUPABASE_SERVICE_ROLE_KEY do .env na raiz do projeto."""
    # Sobe até 3 níveis a partir deste script para encontrar o .env
    script_dir = os.path.dirname(os.path.abspath(__file__))
    for _ in range(4):
        candidate = os.path.join(script_dir, ".env")
        if os.path.exists(candidate):
            with open(candidate, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                        return line.split("=", 1)[1].strip().strip('"').strip("'")
        script_dir = os.path.dirname(script_dir)
    return ""

SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or _load_env_file()

# ---------------------------------------------------------------------------
# MAPEAMENTO DE CATEGORIAS (palavras-chave no nome → categoria ENUM)
# ---------------------------------------------------------------------------
CATEGORY_RULES = [
    (["frango", "carne", "boi", "suíno", "suino", "porco", "frango", "peru",
      "pato", "coelho", "cordeiro", "aves", "linguiça", "linguica",
      "salsicha", "bacon", "presunto", "mortadela", "salame", "hambúrguer",
      "hamburguer", "fraldinha", "alcatra", "contrafilé", "patinho",
      "maminha", "costela", "acém", "acem", "picanha", "fígado", "figado",
      "coração", "coracao", "miúdo", "miudo", "charque", "carne seca"],
     "carnes_aves"),

    (["peixe", "salmão", "salmao", "atum", "sardinha", "tilápia", "tilapia",
      "merluza", "bacalhau", "camarão", "camarao", "lagosta", "polvo",
      "lula", "mariscos", "ostra", "surubim", "tambaqui", "tucunaré",
      "tucunare", "pacu", "pintado", "tainha", "pescada", "robalo",
      "frutos do mar", "caranguejo", "siri"],
     "peixes_frutos_mar"),

    (["ovo", "leite", "queijo", "iogurte", "manteiga", "creme de leite",
      "requeijão", "requeijao", "mozzarella", "mussarela", "ricota",
      "cottage", "parmesão", "parmesao", "gruyère", "gruyere", "brie",
      "nata", "coalhada", "kefir", "whey"],
     "ovos_laticinios"),

    (["arroz", "milho", "aveia", "trigo", "cevada", "centeio", "painço",
      "panico", "quinoa", "amaranto", "sorgo", "cereal", "granola",
      "farinha", "farelo", "cuscuz", "polenta", "grão", "grao",
      "pipoca", "flocos"],
     "graos_cereais"),

    (["maçã", "maca", "banana", "laranja", "uva", "melão", "melao",
      "abacaxi", "manga", "mamão", "mamao", "papaia", "goiaba", "pêra",
      "pera", "pêssego", "pessego", "ameixa", "cereja", "morango",
      "framboesa", "mirtilo", "blueberry", "kiwi", "limão", "limao",
      "maracujá", "maracuja", "abacate", "caju", "coco", "fruta",
      "tamarindo", "jaca", "pitanga", "acerola", "graviola", "cupuaçu",
      "cupuacu", "açaí", "acai"],
     "frutas"),

    (["alface", "espinafre", "brócolis", "brocolis", "couve", "rúcula",
      "rucula", "agrião", "agriao", "salsa", "cebolinha", "tomate",
      "cenoura", "beterraba", "chuchu", "abobrinha", "pepino", "pimentão",
      "pimentao", "alho", "cebola", "batata", "mandioca", "inhame",
      "aipim", "macaxeira", "quiabo", "berinjela", "jiló", "jilo",
      "vagem", "ervilha torta", "acelga", "repolho", "couve-flor",
      "aspargo", "palmito", "milho verde", "verdura", "legume"],
     "vegetais_verduras"),

    (["feijão", "feijao", "lentilha", "grão-de-bico", "grao-de-bico",
      "ervilha", "soja", "amendoim", "lupino", "fava", "mungo",
      "azuki", "leguminosa"],
     "leguminosas"),

    (["pão", "pao", "macarrão", "macarrao", "massa", "lasanha", "espaguete",
      "fettuccine", "penne", "risoto", "biscoito", "bolacha", "cookie",
      "bolo", "torta", "croissant", "brioche", "bisnaguinha", "tapioca",
      "panqueca", "waffle", "panetone"],
     "paes_massas"),

    (["whey", "caseína", "caseina", "creatina", "bcaa", "suplemento",
      "hipercalórico", "hipercalorico", "termogênico", "termogenico",
      "pré-treino", "pre-treino", "maltodextrina", "dextrose"],
     "suplementos"),

    (["industrializado", "ultraprocessado", "biscoito recheado",
      "refrigerante", "suco de caixinha", "achocolatado", "chips",
      "salgadinho", "macarrão instantâneo", "macarrao instantaneo",
      "lácteos", "lacteos"],
     "industrializados"),

    (["acarajé", "acaraje", "cuscuz nordestino", "baião", "baiao",
      "vatapá", "vatapa", "moqueca", "tacacá", "tacaca", "tucumã",
      "tucuma", "regional", "típico", "tipico"],
     "regionais"),

    (["preparação", "preparacao", "preparado", "cozido", "assado",
      "grelhado", "frito", "refogado", "ensopado", "sopa",
      "caldinho", "caldo"],
     "preparacoes"),
]

def guess_category(name: str) -> str:
    """Infere a categoria ENUM a partir do nome do alimento."""
    n = name.lower()
    for keywords, cat in CATEGORY_RULES:
        for kw in keywords:
            if kw in n:
                return cat
    return "outros"


def clean_float(val, default=0.0):
    """Converte valor para float, retornando default se nulo/inválido."""
    if val is None:
        return default
    try:
        f = float(str(val).replace(",", ".").strip())
        return f if f >= 0 else default
    except (ValueError, TypeError):
        return default


def normalize_row(row: dict, source: str = "taco") -> dict | None:
    """
    Converte uma linha do XLS para o formato da tabela foods.
    Mapeado para as colunas do foods_dataset_v3.xlsx.
    """
    def get(row, *keys):
        for k in keys:
            for col in row:
                if str(col).strip().lower() == k.lower():
                    return row[col]
        return None

    # Nome canônico é o principal; nome popular vira search_terms
    name = get(row, "Nome Canônico", "Nome Canonico", "Nome Can?nico",
                "Descrição dos alimentos", "Alimento", "Nome", "name", "ALIMENTO")
    if not name or str(name).strip() == "" or str(name).strip().upper() == "NAN":
        return None
    name = str(name).strip()

    nome_popular_raw = get(row, "Nome Popular", "Nome popular")
    search_terms = None
    if nome_popular_raw and str(nome_popular_raw).strip().upper() != "NAN":
        search_terms = [t.strip() for t in str(nome_popular_raw).split(",") if t.strip()]

    # Macros principais — colunas exatas do foods_dataset_v3
    kcal  = clean_float(get(row, "kcal", "Energia (kcal)", "Energia(kcal)", "Calorias", "ENERGIA (kcal)"))
    prot  = clean_float(get(row, "Prot (g)", "Proteína (g)", "Proteina (g)", "Proteína(g)", "Proteína", "protein", "PROTEÍNA (g)"))
    carbo = clean_float(get(row, "Carbo (g)", "Carboidrato (g)", "Carboidratos (g)", "Carboidrato", "carbs", "CARBOIDRATO (g)"))
    fat   = clean_float(get(row, "Gordura (g)", "Lipídeos (g)", "Lipideos (g)", "Lipídio", "fat", "LIPÍDEOS (g)"))

    # Opcionais
    sodium = clean_float(get(row, "Sódio (mg)", "S?dio (mg)", "Sodio (mg)", "Sódio(mg)", "sodium"))

    # Categoria: já vem no formato ENUM no dataset (ex: "graos_cereais")
    category_raw = get(row, "Categoria", "categoria")
    if category_raw and str(category_raw).strip().upper() not in ("NAN", ""):
        category = str(category_raw).strip()
    else:
        category = guess_category(name)

    # Fonte: já vem no formato ENUM no dataset (ex: "taco")
    source_raw = get(row, "Fonte", "fonte")
    if source_raw and str(source_raw).strip().upper() not in ("NAN", ""):
        source_final = str(source_raw).strip()
    else:
        source_final = source

    # ID: formato "taco_001" → extrai o número inteiro
    id_raw = get(row, "ID", "id", "Número", "NÚMERO", "Nº")
    taco_id = None
    if id_raw is not None:
        id_str = str(id_raw).strip()
        # Extrai somente os dígitos finais: "taco_001" → 1
        digits = re.sub(r"[^0-9]", "", id_str)
        if digits:
            try:
                taco_id = int(digits)
            except ValueError:
                taco_id = None

    confidence = "high" if source_final == "taco" else "medium"

    return {
        "id": str(uuid.uuid4()),
        "name": name,
        "kcal": kcal,
        "protein_g": prot,
        "carbo_g": carbo,
        "fat_g": fat,
        "fiber_g": 0.0,
        "sodium_mg": sodium,
        "sugar_g": 0.0,
        "saturated_fat_g": 0.0,
        "portion_g": 100.0,
        "portion_label": "100g",
        "category": category,
        "source": source_final,
        "confidence": confidence,
        "taco_id": taco_id,
        "is_active": True,
        "search_terms": search_terms,
    }


def upload_to_supabase(records: list[dict]):
    """Faz upsert dos registros na tabela foods via API REST do Supabase."""
    try:
        import urllib.request
        import urllib.error
    except ImportError:
        print("❌ urllib não disponível")
        return

    if not SUPABASE_SERVICE_KEY:
        print("\n❌ SUPABASE_SERVICE_ROLE_KEY não configurada!")
        print("   Defina a variável de ambiente ou edite SUPABASE_SERVICE_KEY no script.")
        print("   Dashboard > Project Settings > API > service_role secret\n")
        sys.exit(1)

    url = f"{SUPABASE_URL}/rest/v1/foods"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }

    BATCH = 100
    total = len(records)
    inserted = 0

    for i in range(0, total, BATCH):
        batch = records[i:i + BATCH]
        data = json.dumps(batch).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                inserted += len(batch)
                print(f"  ✅ Lote {i//BATCH + 1}: {inserted}/{total} alimentos enviados")
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8")
            print(f"  ❌ Erro no lote {i//BATCH + 1}: HTTP {e.code}")
            print(f"     {body[:500]}")
            print("\n  Dica: verifique se a migration 011 foi executada no Supabase.")
            sys.exit(1)

    print(f"\n🎉 Seed concluído! {inserted} alimentos inseridos/atualizados.")


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print(__doc__)
        print("\nFlags opcionais:")
        print("  --preview    Mostra colunas do XLS e primeiras 5 linhas (sem subir)")
        print("  --source     taco | tbca | rotulo | custom (padrão: taco)")
        sys.exit(0)

    xls_path = sys.argv[1]
    preview = "--preview" in sys.argv
    source = "taco"
    for arg in sys.argv:
        if arg.startswith("--source="):
            source = arg.split("=")[1]

    if not os.path.exists(xls_path):
        print(f"❌ Arquivo não encontrado: {xls_path}")
        sys.exit(1)

    # Instala openpyxl/xlrd se necessário
    try:
        import pandas as pd
    except ImportError:
        print("📦 Instalando pandas e openpyxl...")
        os.system(f"{sys.executable} -m pip install pandas openpyxl xlrd")
        import pandas as pd

    print(f"\n📂 Lendo: {xls_path}")

    # Tenta ler o arquivo (suporte a .xls e .xlsx)
    ext = os.path.splitext(xls_path)[1].lower()
    try:
        if ext == ".xls":
            # xlrd suporta .xls antigo
            try:
                df = pd.read_excel(xls_path, engine="xlrd")
            except Exception:
                df = pd.read_excel(xls_path)
        else:
            df = pd.read_excel(xls_path, engine="openpyxl")
    except Exception as e:
        print(f"❌ Erro ao ler {xls_path}: {e}")
        print("   Tente converter para .xlsx e rode novamente.")
        sys.exit(1)

    # Mostra planilhas disponíveis
    try:
        xl = pd.ExcelFile(xls_path)
        if len(xl.sheet_names) > 1:
            print(f"📋 Planilhas encontradas: {xl.sheet_names}")
            print(f"   Usando a primeira: '{xl.sheet_names[0]}'")
            df = xl.parse(xl.sheet_names[0])
    except Exception:
        pass

    print(f"\n📊 Linhas encontradas: {len(df)}")
    print(f"📋 Colunas: {list(df.columns)}\n")

    if preview:
        print("--- PRÉVIA (primeiras 5 linhas) ---")
        print(df.head().to_string())
        print("\n✅ Modo --preview: nenhum dado foi enviado ao Supabase.")
        print("   Verifique os nomes das colunas e ajuste a função normalize_row() se necessário.")
        print("   Depois rode sem --preview para fazer o seed.")
        return

    # Converte linhas
    records = []
    skipped = 0
    for _, row in df.iterrows():
        record = normalize_row(row.to_dict(), source=source)
        if record:
            records.append(record)
        else:
            skipped += 1

    print(f"✅ {len(records)} alimentos prontos para inserção ({skipped} linhas ignoradas)\n")

    if len(records) == 0:
        print("❌ Nenhum registro válido encontrado.")
        print("   Rode com --preview para inspecionar as colunas do XLS.")
        sys.exit(1)

    # Categorias encontradas
    from collections import Counter
    cats = Counter(r["category"] for r in records)
    print("📂 Distribuição por categoria:")
    for cat, count in cats.most_common():
        print(f"   {cat}: {count}")
    print()

    upload_to_supabase(records)


if __name__ == "__main__":
    main()
