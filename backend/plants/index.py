"""API для каталога растений садовода: получение, добавление, обновление, удаление."""
import json
import os
import psycopg2

SCHEMA = "t_p8600735_garden_bed_planning_"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    method = event.get("httpMethod", "GET")
    query_params = event.get("queryStringParameters") or {}
    plant_id = query_params.get("id")
    headers = {**cors_headers(), "Content-Type": "application/json"}

    conn = get_conn()
    cur = conn.cursor()

    try:
        # GET /plants — список всех
        if method == "GET":
            cur.execute(f"SELECT id, emoji, name, category, season, watering, spacing, sunlight, maturity, tips, color FROM {SCHEMA}.plants ORDER BY id")
            rows = cur.fetchall()
            cols = ["id","emoji","name","category","season","watering","spacing","sunlight","maturity","tips","color"]
            plants = [dict(zip(cols, row)) for row in rows]
            return {"statusCode": 200, "headers": headers, "body": json.dumps(plants, ensure_ascii=False)}

        # POST /plants — создать
        if method == "POST":
            data = json.loads(event.get("body") or "{}")
            cur.execute(
                f"""INSERT INTO {SCHEMA}.plants (emoji, name, category, season, watering, spacing, sunlight, maturity, tips, color)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                (data.get("emoji","🌱"), data["name"], data.get("category","Овощи"),
                 data.get("season",""), data.get("watering",""), data.get("spacing",""),
                 data.get("sunlight",""), data.get("maturity",""), data.get("tips",""), data.get("color","#27ae60"))
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            return {"statusCode": 201, "headers": headers, "body": json.dumps({"id": new_id})}

        # PUT /plants/{id} — обновить
        if method == "PUT" and plant_id:
            data = json.loads(event.get("body") or "{}")
            cur.execute(
                f"""UPDATE {SCHEMA}.plants SET emoji=%s, name=%s, category=%s, season=%s,
                    watering=%s, spacing=%s, sunlight=%s, maturity=%s, tips=%s, color=%s
                    WHERE id=%s""",
                (data.get("emoji","🌱"), data["name"], data.get("category","Овощи"),
                 data.get("season",""), data.get("watering",""), data.get("spacing",""),
                 data.get("sunlight",""), data.get("maturity",""), data.get("tips",""),
                 data.get("color","#27ae60"), int(plant_id))
            )
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        # DELETE /plants/{id} — удалить
        if method == "DELETE" and plant_id:
            cur.execute(f"DELETE FROM {SCHEMA}.plants WHERE id=%s", (int(plant_id),))
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}

    finally:
        cur.close()
        conn.close()