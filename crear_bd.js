const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

const rutaBD = "./database/actividades.db";

const sql = fs.readFileSync(
    "./sql/estructura.sql",
    "utf8"
);

const db = new sqlite3.Database(
    rutaBD,
    (error) => {

        if (error) {

            console.error(
                "❌ Error al crear la base de datos:",
                error.message
            );

            return;

        }

        console.log(
            "✅ Base de datos SQLite conectada."
        );

    }
);


db.exec(sql, (error) => {

    if (error) {

        console.error(
            "❌ Error ejecutando estructura.sql:",
            error.message
        );

    } else {

        console.log(
            "✅ Tablas creadas correctamente."
        );

        console.log(
            "✅ Clasificaciones y tipos insertados."
        );

    }


    db.close(() => {

        console.log(
            "🔒 Base de datos cerrada."
        );

    });

});