-- ============================================
-- BASE DE DATOS DE ACTIVIDADES
-- ============================================

PRAGMA foreign_keys = ON;


-- ============================================
-- TABLA: CLASIFICACIONES
-- ============================================

CREATE TABLE IF NOT EXISTS clasificaciones (

    id_clasificacion INTEGER PRIMARY KEY AUTOINCREMENT,

    nombre TEXT NOT NULL UNIQUE

);


-- ============================================
-- TABLA: TIPOS
-- ============================================

CREATE TABLE IF NOT EXISTS tipos (

    id_tipo INTEGER PRIMARY KEY AUTOINCREMENT,

    nombre TEXT NOT NULL UNIQUE

);


-- ============================================
-- TABLA: ACTIVIDADES
-- ============================================

CREATE TABLE IF NOT EXISTS actividades (

    id_actividad INTEGER PRIMARY KEY AUTOINCREMENT,

    fecha TEXT NOT NULL,

    hora TEXT NOT NULL,

    actividad TEXT NOT NULL,

    duracion TEXT,

    id_clasificacion INTEGER NOT NULL,

    id_tipo INTEGER,

    FOREIGN KEY (
        id_clasificacion
    )
    REFERENCES clasificaciones (
        id_clasificacion
    ),

    FOREIGN KEY (
        id_tipo
    )
    REFERENCES tipos (
        id_tipo
    )

);


-- ============================================
-- CLASIFICACIONES INICIALES
-- ============================================

INSERT OR IGNORE INTO clasificaciones (nombre)
VALUES ('REGISTRO');

INSERT OR IGNORE INTO clasificaciones (nombre)
VALUES ('HABITO');

INSERT OR IGNORE INTO clasificaciones (nombre)
VALUES ('TO DO');


-- ============================================
-- TIPOS INICIALES
-- ============================================

INSERT OR IGNORE INTO tipos (nombre)
VALUES ('PRODUCTIVO');

INSERT OR IGNORE INTO tipos (nombre)
VALUES ('NO PRODUCTIVO');

INSERT OR IGNORE INTO tipos (nombre)
VALUES ('DORMIR');