"""Copia datos de prisma/dev.db (SQLite) a PostgreSQL (Neon)."""
from __future__ import annotations

import os
import sqlite3
from datetime import datetime, timezone
from urllib.parse import urlsplit, urlunsplit

import psycopg2


def load_env(path: str = ".env") -> None:
    if not os.path.exists(path):
        return
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip().strip('"').strip("'")
        if key not in os.environ:
            os.environ[key] = value


def direct_url(url: str) -> str:
    parts = urlsplit(url)
    host = parts.hostname or ""
    if "-pooler." in host:
        host = host.replace("-pooler.", ".", 1)
        userinfo = parts.username or ""
        if parts.password:
            userinfo = f"{userinfo}:{parts.password}"
        netloc = f"{userinfo}@{host}"
        if parts.port:
            netloc += f":{parts.port}"
        query = "&".join(
            p
            for p in parts.query.split("&")
            if p and not p.startswith("channel_binding=")
        )
        return urlunsplit((parts.scheme, netloc, parts.path, query, parts.fragment))
    return url.replace("channel_binding=require&", "").replace("&channel_binding=require", "")

SQLITE_PATH = os.path.join("prisma", "dev.db")
TABLES = [
    "User",
    "Product",
    "LegalDocument",
    "Address",
    "Order",
    "OrderItem",
    "Review",
    "ReviewPhoto",
]
BOOL_COLS = {"active", "isDefault"}
DT_COLS = {"createdAt", "updatedAt", "resetExpires", "paidAt"}


def as_dt(value):
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, (int, float)):
        seconds = value / 1000 if value > 1e11 else value
        return datetime.fromtimestamp(seconds, tz=timezone.utc)
    if isinstance(value, str):
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    return value


def as_bool(value):
    if value is None:
        return None
    return bool(value)


def main():
    load_env()
    url = os.environ.get("DATABASE_URL")
    if not url or url.startswith("file:"):
        raise SystemExit("DATABASE_URL de PostgreSQL no está definida")
    url = direct_url(url)

    sqlite = sqlite3.connect(SQLITE_PATH)
    sqlite.row_factory = sqlite3.Row
    pg = psycopg2.connect(url)
    pg.autocommit = False

    with pg.cursor() as cur:
        cur.execute(
            'TRUNCATE TABLE "ReviewPhoto", "Review", "OrderItem", "Order", "Address", "LegalDocument", "Product", "User" RESTART IDENTITY CASCADE'
        )

        for table in TABLES:
            rows = sqlite.execute(f'SELECT * FROM "{table}"').fetchall()
            if not rows:
                print(f"{table}: 0 filas")
                continue

            cols = list(rows[0].keys())
            quoted = ", ".join(f'"{c}"' for c in cols)
            placeholders = ", ".join(["%s"] * len(cols))
            sql = f'INSERT INTO "{table}" ({quoted}) VALUES ({placeholders})'

            values = []
            for row in rows:
                record = []
                for col in cols:
                    value = row[col]
                    if col in BOOL_COLS:
                        value = as_bool(value)
                    elif col in DT_COLS:
                        value = as_dt(value)
                    record.append(value)
                values.append(tuple(record))

            cur.executemany(sql, values)
            print(f"{table}: {len(values)} filas")

    pg.commit()
    pg.close()
    sqlite.close()
    print("Migración completada")


if __name__ == "__main__":
    main()
