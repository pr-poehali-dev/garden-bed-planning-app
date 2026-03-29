"""API для участков и грядок: получение, создание, обновление позиций и растений, удаление."""
import json
import os
import psycopg2

SCHEMA = "t_p8600735_garden_bed_planning_"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

def resp(status, body):
    return {"statusCode": status, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps(body, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    body = json.loads(event.get("body") or "{}")
    action = qs.get("action", "")

    conn = get_conn()
    cur = conn.cursor()

    try:
        # GET — загрузить все участки с грядками
        if method == "GET":
            cur.execute(f"SELECT id, name FROM {SCHEMA}.plots ORDER BY created_at")
            plots = [{"id": r[0], "name": r[1], "beds": []} for r in cur.fetchall()]

            cur.execute(f"""
                SELECT id, plot_id, name, x, y, w, h, cols, rows, color, cells
                FROM {SCHEMA}.beds ORDER BY created_at
            """)
            beds_raw = cur.fetchall()
            plot_map = {p["id"]: p for p in plots}
            for row in beds_raw:
                bed = {
                    "id": row[0], "plot_id": row[1], "name": row[2],
                    "x": row[3], "y": row[4], "w": row[5], "h": row[6],
                    "cols": row[7], "rows": row[8], "color": row[9],
                    "cells": row[10],
                }
                if row[1] in plot_map:
                    plot_map[row[1]]["beds"].append(bed)

            return resp(200, plots)

        # POST action=add_plot — создать участок
        if method == "POST" and action == "add_plot":
            pid = body["id"]
            name = body["name"]
            cur.execute(f"INSERT INTO {SCHEMA}.plots (id, name) VALUES (%s, %s)", (pid, name))
            conn.commit()
            return resp(201, {"ok": True})

        # POST action=add_bed — создать грядку
        if method == "POST" and action == "add_bed":
            b = body
            cells_json = json.dumps(b.get("cells", []), ensure_ascii=False)
            cur.execute(f"""
                INSERT INTO {SCHEMA}.beds (id, plot_id, name, x, y, w, h, cols, rows, color, cells)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (b["id"], b["plot_id"], b["name"], b["x"], b["y"], b["w"], b["h"],
                  b["cols"], b["rows"], b["color"], cells_json))
            conn.commit()
            return resp(201, {"ok": True})

        # PUT action=update_bed — обновить позицию/размер/ячейки грядки
        if method == "PUT" and action == "update_bed":
            b = body
            cells_json = json.dumps(b.get("cells", []), ensure_ascii=False)
            cur.execute(f"""
                UPDATE {SCHEMA}.beds
                SET name=%s, x=%s, y=%s, w=%s, h=%s, cols=%s, rows=%s, color=%s, cells=%s
                WHERE id=%s
            """, (b["name"], b["x"], b["y"], b["w"], b["h"],
                  b["cols"], b["rows"], b["color"], cells_json, b["id"]))
            conn.commit()
            return resp(200, {"ok": True})

        # PUT action=rename_plot — переименовать участок
        if method == "PUT" and action == "rename_plot":
            cur.execute(f"UPDATE {SCHEMA}.plots SET name=%s WHERE id=%s", (body["name"], body["id"]))
            conn.commit()
            return resp(200, {"ok": True})

        # DELETE action=delete_bed
        if method == "DELETE" and action == "delete_bed":
            bed_id = qs.get("id")
            cur.execute(f"DELETE FROM {SCHEMA}.beds WHERE id=%s", (bed_id,))
            conn.commit()
            return resp(200, {"ok": True})

        # DELETE action=delete_plot
        if method == "DELETE" and action == "delete_plot":
            plot_id = qs.get("id")
            cur.execute(f"DELETE FROM {SCHEMA}.beds WHERE plot_id=%s", (plot_id,))
            cur.execute(f"DELETE FROM {SCHEMA}.plots WHERE id=%s", (plot_id,))
            conn.commit()
            return resp(200, {"ok": True})

        return resp(405, {"error": "Unknown action"})

    finally:
        cur.close()
        conn.close()