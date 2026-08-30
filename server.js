const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

const PORT = process.env.PORT || 3000;

const carpetaBD = path.join(
    __dirname,
    "database"
);

if (!fs.existsSync(carpetaBD)) {
    fs.mkdirSync(carpetaBD, { recursive: true });
}

const rutaBD = path.join(
    carpetaBD,
    "actividades.db"
);


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());


// Permite servir los archivos HTML, CSS y JS
// que estarán dentro de public

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// =====================================================
// CONEXIÓN A SQLITE
// =====================================================

const db = new sqlite3.Database(
    rutaBD,
    (error) => {

        if (error) {

            console.error(
                "❌ Error conectando a SQLite:",
                error.message
            );

        } else {

            console.log(
                "✅ Conectado a SQLite."
            );
const rutaSQL = path.join(
    __dirname,
    "sql",
    "estructura.sql"
);

const estructuraSQL = fs.readFileSync(
    rutaSQL,
    "utf8"
);

db.exec(
    estructuraSQL,
    (error) => {

        if (error) {

            console.error(
                "❌ Error creando las tablas:",
                error.message
            );

        } else {

            console.log(
                "✅ Base de datos inicializada correctamente."
            );

        }

    }
);
        }

    }
);


// =====================================================
// RUTA PRINCIPAL
// =====================================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


// =====================================================
// GET /api/actividades
// CONSULTAR ACTIVIDADES
// =====================================================

app.get(
    "/api/actividades",
    (req, res) => {

        const fecha =
            req.query.fecha;

        const hora =
            req.query.hora;


        // La fecha es obligatoria

        if (!fecha) {

            return res.status(400).json({

                error:
                    "La fecha es obligatoria."

            });

        }


        let sql = `
            SELECT
                a.id_actividad,
                a.fecha,
                a.hora,
                a.actividad,
                a.duracion,

                c.id_clasificacion,
                c.nombre AS clasificacion,

                t.id_tipo,
                t.nombre AS tipo

            FROM actividades a

            INNER JOIN clasificaciones c
                ON a.id_clasificacion =
                   c.id_clasificacion

            LEFT JOIN tipos t
                ON a.id_tipo =
                   t.id_tipo

            WHERE a.fecha = ?
        `;


        const parametros = [
            fecha
        ];


        // La hora es opcional

        if (hora) {

            sql += `
                AND a.hora = ?
            `;

            parametros.push(hora);

        }


        sql += `
            ORDER BY a.hora ASC
        `;


        db.all(
            sql,
            parametros,
            (error, filas) => {

                if (error) {

                    console.error(
                        "❌ Error consultando:",
                        error.message
                    );


                    return res.status(500).json({

                        error:
                            "Error al consultar las actividades."

                    });

                }


                res.json(filas);

            }
        );

    }
);


// =====================================================
// POST /api/actividades
// REGISTRAR NUEVA ACTIVIDAD
// =====================================================

app.post(
    "/api/actividades",
    (req, res) => {

        const {
            fecha,
            hora,
            actividad,
            duracion,
            clasificacion,
            tipo
        } = req.body;


        // =============================================
        // VALIDACIONES
        // =============================================

        if (
            !fecha ||
            !hora ||
            !actividad ||
            !clasificacion
        ) {

            return res.status(400).json({

                error:
                    "Fecha, hora, actividad y clasificación son obligatorias."

            });

        }


        // =============================================
        // BUSCAR CLASIFICACIÓN
        // =============================================

        db.get(
            `
            SELECT id_clasificacion
            FROM clasificaciones
            WHERE UPPER(nombre) = UPPER(?)
            `,
            [clasificacion],

            (error, filaClasificacion) => {

                if (error) {

                    return res.status(500).json({

                        error:
                            "Error buscando la clasificación."

                    });

                }


                if (!filaClasificacion) {

                    return res.status(400).json({

                        error:
                            "La clasificación no existe."

                    });

                }


                // =====================================
                // BUSCAR TIPO
                // =====================================

                if (!tipo) {

                    insertarActividad(
                        null
                    );

                    return;

                }


                db.get(
                    `
                    SELECT id_tipo
                    FROM tipos
                    WHERE UPPER(nombre) = UPPER(?)
                    `,
                    [tipo],

                    (error, filaTipo) => {

                        if (error) {

                            return res.status(500).json({

                                error:
                                    "Error buscando el tipo."

                            });

                        }


                        if (!filaTipo) {

                            return res.status(400).json({

                                error:
                                    "El tipo no existe."

                            });

                        }


                        insertarActividad(
                            filaTipo.id_tipo
                        );

                    }
                );


                // =====================================
                // FUNCIÓN INSERTAR
                // =====================================

                function insertarActividad(
                    idTipo
                ) {

                    db.run(
                        `
                        INSERT INTO actividades
                        (
                            fecha,
                            hora,
                            actividad,
                            duracion,
                            id_clasificacion,
                            id_tipo
                        )
                        VALUES (?, ?, ?, ?, ?, ?)
                        `,
                        [
                            fecha,
                            hora,
                            actividad,
                            duracion || null,
                            filaClasificacion.id_clasificacion,
                            idTipo
                        ],

                        function(error) {

                            if (error) {

                                console.error(
                                    "❌ Error insertando:",
                                    error.message
                                );


                                return res.status(500).json({

                                    error:
                                        "No se pudo registrar la actividad."

                                });

                            }


                            res.status(201).json({

                                mensaje:
                                    "Actividad registrada correctamente.",

                                id:
                                    this.lastID

                            });

                        }
                    );

                }

            }
        );

    }
);


// =====================================================
// INICIAR SERVIDOR
// =====================================================

app.listen(
    PORT,
    () => {

        console.log(
            "======================================"
        );

        console.log(
            `🚀 Servidor ejecutándose en http://localhost:${PORT}`
        );

        console.log(
            "======================================"

        );

    }
);