// =====================================================
// CONSULTAR ACTIVIDADES
// =====================================================

const formConsulta =
    document.getElementById("formConsulta");

const resultados =
    document.getElementById("resultados");


formConsulta.addEventListener(
    "submit",
    async function (evento) {

        evento.preventDefault();


        const fecha =
            document.getElementById(
                "fechaConsulta"
            ).value;


        const hora =
            document.getElementById(
                "horaConsulta"
            ).value;


        if (!fecha) {

            resultados.innerHTML =
                "<p>Debes seleccionar una fecha.</p>";

            return;
        }


        try {

            // Construir la dirección de consulta

            let url =
                `/api/actividades?fecha=${fecha}`;


            // La hora es opcional

            if (hora) {

                // input type="time" puede devolver HH:MM
                // y nuestra base utiliza HH:MM:SS

                const horaCompleta =
                    hora.length === 5
                        ? `${hora}:00`
                        : hora;


                url +=
                    `&hora=${horaCompleta}`;
            }


            const respuesta =
                await fetch(url);


            const datos =
                await respuesta.json();


            if (!respuesta.ok) {

                resultados.innerHTML =
                    `<p>${datos.error}</p>`;

                return;
            }


            mostrarResultados(datos);


        } catch (error) {

            console.error(error);

            resultados.innerHTML =
                "<p>❌ No se pudo conectar con el servidor.</p>";

        }

    }
);


// =====================================================
// MOSTRAR RESULTADOS
// =====================================================

function mostrarResultados(
    actividades
) {

    if (actividades.length === 0) {

        resultados.innerHTML =
            "<p>No hay actividades para esa búsqueda.</p>";

        return;
    }


    let html = `
        <table border="1" cellpadding="8">

            <thead>

                <tr>

                    <th>Fecha</th>

                    <th>Hora</th>

                    <th>Actividad</th>

                    <th>Duración</th>

                    <th>Clasificación</th>

                    <th>Tipo</th>

                </tr>

            </thead>

            <tbody>
    `;


    actividades.forEach(
        function (actividad) {

            html += `
                <tr>

                    <td>
                        ${actividad.fecha}
                    </td>

                    <td>
                        ${actividad.hora}
                    </td>

                    <td>
                        ${actividad.actividad}
                    </td>

                    <td>
                        ${actividad.duracion || ""}
                    </td>

                    <td>
                        ${actividad.clasificacion}
                    </td>

                    <td>
                        ${actividad.tipo || ""}
                    </td>

                </tr>
            `;

        }
    );


    html += `
            </tbody>

        </table>
    `;


    resultados.innerHTML =
        html;
}


// =====================================================
// REGISTRAR NUEVA ACTIVIDAD
// =====================================================

const formRegistro =
    document.getElementById(
        "formRegistro"
    );


formRegistro.addEventListener(
    "submit",
    async function (evento) {

        evento.preventDefault();


        const fecha =
            document.getElementById(
                "fecha"
            ).value;


        let hora =
            document.getElementById(
                "hora"
            ).value;


        const actividad =
            document.getElementById(
                "actividad"
            ).value;


        const duracion =
            document.getElementById(
                "duracion"
            ).value;


        const clasificacion =
            document.getElementById(
                "clasificacion"
            ).value;


        const tipo =
            document.getElementById(
                "tipo"
            ).value;


        // Convertir HH:MM a HH:MM:SS

        if (hora.length === 5) {

            hora += ":00";

        }

// =====================================================
// VALIDAR DATOS DEL REGISTRO
// =====================================================

if (!fecha) {

    alert("❌ Debes seleccionar una fecha.");

    return;
}


if (!hora) {

    alert("❌ Debes seleccionar una hora.");

    return;
}


if (!actividad.trim()) {

    alert("❌ Debes escribir una actividad.");

    return;
}


if (!clasificacion) {

    alert("❌ Debes seleccionar una clasificación.");

    return;
}


// =====================================================
// NORMALIZAR HORA
// =====================================================

if (hora.length === 5) {

    hora += ":00";

}
        const nuevaActividad = {

            fecha: fecha,

            hora: hora,

            actividad: actividad,

            duracion: duracion,

            clasificacion: clasificacion,

            tipo: tipo

        };


        try {

            const respuesta =
                await fetch(
                    "/api/actividades",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                nuevaActividad
                            )

                    }
                );


            const resultado =
                await respuesta.json();


            if (!respuesta.ok) {

                alert(
                    "❌ " +
                    resultado.error
                );

                return;
            }


            alert(
    "✅ Actividad registrada correctamente."
);


// Limpiar formulario

formRegistro.reset();


// Si había una fecha seleccionada en la consulta,
// actualizar automáticamente los resultados.

const fechaConsulta =
    document.getElementById(
        "fechaConsulta"
    ).value;


if (fechaConsulta) {

    document
        .getElementById(
            "formConsulta"
        )
        .dispatchEvent(
            new Event("submit")
        );

}


        } catch (error) {

            console.error(error);

            alert(
                "❌ No se pudo conectar con el servidor."
            );

        }

    }
);