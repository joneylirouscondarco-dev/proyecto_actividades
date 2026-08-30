const sqlite3 = require("sqlite3").verbose();
const XLSX = require("xlsx");

const rutaBD = "./database/actividades.db";

const db = new sqlite3.Database(
    rutaBD,
    (error) => {

        if (error) {

            console.error(
                "❌ Error conectando a SQLite:",
                error.message
            );

            return;
        }

        console.log(
            "✅ Conectado a la base de datos."
        );
    }
);


// ======================================================
// CONVERTIR FECHA DE EXCEL
// ======================================================

function convertirFecha(valor) {

    // Fecha almacenada como número de Excel

    if (typeof valor === "number") {

        const fecha =
            XLSX.SSF.parse_date_code(valor);

        if (!fecha) {
            return null;
        }

        const año =
            String(fecha.y).padStart(4, "0");

        const mes =
            String(fecha.m).padStart(2, "0");

        const dia =
            String(fecha.d).padStart(2, "0");

        return `${año}-${mes}-${dia}`;
    }


    // Fecha almacenada como texto

    if (typeof valor === "string") {

        const texto =
            valor.trim();


        // Detectar 14/08/0206 y corregirlo

        const partes =
            texto.split("/");


        if (partes.length === 3) {

            let dia = partes[0];
            let mes = partes[1];
            let año = partes[2];


            if (año.length === 4) {

                // Corrección específica:
                // 0206 → 2026

                if (año === "0206") {
                    año = "2026";
                }


                return `${año}-${mes.padStart(
                    2,
                    "0"
                )}-${dia.padStart(
                    2,
                    "0"
                )}`;
            }
        }


        // Si ya viene YYYY-MM-DD

        if (
            /^\d{4}-\d{2}-\d{2}$/.test(texto)
        ) {

            return texto;

        }

    }


    return null;
}


// ======================================================
// CONVERTIR HORA DE EXCEL
// ======================================================

function convertirHora(valor) {

    // Excel guarda la hora como fracción del día

    if (typeof valor === "number") {

        let segundos =
            Math.round(valor * 24 * 60 * 60);


        // Mantener dentro de 24 horas

        segundos =
            segundos % 86400;


        const horas =
            Math.floor(
                segundos / 3600
            );

        segundos %= 3600;


        const minutos =
            Math.floor(
                segundos / 60
            );

        segundos %=
            60;


        return `${String(horas).padStart(
            2,
            "0"
        )}:${String(minutos).padStart(
            2,
            "0"
        )}:${String(segundos).padStart(
            2,
            "0"
        )}`;
    }


    // Hora como texto

    if (typeof valor === "string") {

        const texto =
            valor.trim();


        // HH:MM:SS

        if (
            /^\d{2}:\d{2}:\d{2}$/.test(texto)
        ) {

            return texto;

        }


        // HH:MM

        if (
            /^\d{1,2}:\d{2}$/.test(texto)
        ) {

            const partes =
                texto.split(":");

            return `${String(
                partes[0]
            ).padStart(
                2,
                "0"
            )}:${partes[1]}:00`;
        }
    }


    return null;
}


// ======================================================
// OBTENER ID DE CLASIFICACIÓN
// ======================================================

function obtenerClasificacion(
    nombre
) {

    return new Promise(
        (resolve, reject) => {

            db.get(
                `
                SELECT id_clasificacion
                FROM clasificaciones
                WHERE nombre = ?
                `,
                [nombre],

                (error, fila) => {

                    if (error) {
                        reject(error);
                        return;
                    }

                    if (!fila) {

                        reject(
                            new Error(
                                `Clasificación no encontrada: ${nombre}`
                            )
                        );

                        return;
                    }

                    resolve(
                        fila.id_clasificacion
                    );
                }
            );

        }
    );
}


// ======================================================
// OBTENER ID DEL TIPO
// ======================================================

function obtenerTipo(
    nombre
) {

    return new Promise(
        (resolve, reject) => {

            if (!nombre) {
                resolve(null);
                return;
            }


            db.get(
                `
                SELECT id_tipo
                FROM tipos
                WHERE UPPER(nombre) = UPPER(?)
                `,
                [nombre],

                (error, fila) => {

                    if (error) {
                        reject(error);
                        return;
                    }

                    if (!fila) {
                        resolve(null);
                        return;
                    }

                    resolve(
                        fila.id_tipo
                    );
                }
            );

        }
    );
}


// ======================================================
// INSERTAR UNA ACTIVIDAD
// ======================================================

function insertarActividad(
    fecha,
    hora,
    actividad,
    duracion,
    clasificacion,
    tipo
) {

    return new Promise(
        async (resolve, reject) => {

            try {

                const idClasificacion =
                    await obtenerClasificacion(
                        clasificacion
                    );


                const idTipo =
                    await obtenerTipo(
                        tipo
                    );


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
                        duracion,
                        idClasificacion,
                        idTipo
                    ],

                    function(error) {

                        if (error) {

                            reject(error);

                        } else {

                            resolve(
                                this.lastID
                            );

                        }

                    }
                );

            } catch (error) {

                reject(error);

            }

        }
    );
}


// ======================================================
// IMPORTAR REGISTRO
// ======================================================

async function importarRegistro() {

    console.log(
        "\n📥 Importando REGISTRO..."
    );


    const archivo =
        "./data/Registro de actividades.xlsx";


    const libro =
        XLSX.readFile(archivo);


    const hoja =
        libro.Sheets[
            libro.SheetNames[0]
        ];


    const datos =
        XLSX.utils.sheet_to_json(
            hoja,
            {
                defval: null
            }
        );


    let importados = 0;
    let rechazados = 0;


    for (const fila of datos) {

        try {

            const fecha =
                convertirFecha(
                    fila["Fecha "] ??
                    fila["Fecha"]
                );


            const hora =
                convertirHora(
                    fila["Hora"]
                );


            const actividad =
                fila["Actividad"];


            const tipo =
                fila["Tipo"];


            if (
                !fecha ||
                !hora ||
                !actividad
            ) {

                rechazados++;

                continue;
            }


            await insertarActividad(
                fecha,
                hora,
                actividad,
                null,
                "REGISTRO",
                tipo
            );


            importados++;

        } catch (error) {

            console.log(
                "⚠️ Registro rechazado:",
                error.message
            );

            rechazados++;
        }

    }


    console.log(
        `✅ REGISTRO: ${importados} importados, ${rechazados} rechazados.`
    );
}


// ======================================================
// IMPORTAR HÁBITOS
// ======================================================

async function importarHabitos() {

    console.log(
        "\n📥 Importando HÁBITOS..."
    );


    const archivo =
        "./data/Habitos.xlsx";


    const libro =
        XLSX.readFile(archivo);


    const hoja =
        libro.Sheets[
            libro.SheetNames[0]
        ];


    const datos =
        XLSX.utils.sheet_to_json(
            hoja,
            {
                defval: null
            }
        );


    let importados = 0;
    let rechazados = 0;


    for (const fila of datos) {

        try {

            const fecha =
                convertirFecha(
                    fila["FECHA"]
                );


            const hora =
                convertirHora(
                    fila["HORA"]
                );


            const actividad =
                fila["ACTIVIDAD"];


            const duracion =
                fila["DURACION"];


            if (
                !fecha ||
                !hora ||
                !actividad
            ) {

                rechazados++;

                continue;
            }


            await insertarActividad(
                fecha,
                hora,
                actividad,
                duracion,
                "HABITO",
                null
            );


            importados++;

        } catch (error) {

            console.log(
                "⚠️ Hábito rechazado:",
                error.message
            );

            rechazados++;
        }

    }


    console.log(
        `✅ HÁBITOS: ${importados} importados, ${rechazados} rechazados.`
    );
}


// ======================================================
// IMPORTAR TO DO
// ======================================================

async function importarTodo() {

    console.log(
        "\n📥 Importando TO DO..."
    );


    const archivo =
        "./data/TABLA to do.xlsx";


    const libro =
        XLSX.readFile(archivo);


    const hoja =
        libro.Sheets[
            libro.SheetNames[0]
        ];


    const datos =
        XLSX.utils.sheet_to_json(
            hoja,
            {
                defval: null
            }
        );


    let importados = 0;
    let rechazados = 0;


    for (const fila of datos) {

        try {

            const fecha =
                convertirFecha(
                    fila["FECHA"]
                );


            const hora =
                convertirHora(
                    fila["HORA"]
                );


            const actividad =
                fila["ACTIVIDAD"];


            if (
                !fecha ||
                !hora ||
                !actividad
            ) {

                rechazados++;

                continue;
            }


            await insertarActividad(
                fecha,
                hora,
                actividad,
                null,
                "TO DO",
                null
            );


            importados++;

        } catch (error) {

            console.log(
                "⚠️ TO DO rechazado:",
                error.message
            );

            rechazados++;
        }

    }


    console.log(
        `✅ TO DO: ${importados} importados, ${rechazados} rechazados.`
    );
}


// ======================================================
// EJECUTAR TODO
// ======================================================

async function ejecutarImportacion() {

    try {

        await importarRegistro();

        await importarHabitos();

        await importarTodo();


        console.log(
            "\n=================================="
        );

        console.log(
            "🎉 IMPORTACIÓN TERMINADA"
        );

        console.log(
            "=================================="
        );


    } catch (error) {

        console.error(
            "\n❌ Error general:",
            error.message
        );

    } finally {

        db.close(() => {

            console.log(
                "🔒 Conexión SQLite cerrada."
            );

        });

    }

}


ejecutarImportacion();