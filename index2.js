const express = require("express");
const fetch = require("node-fetch");
const redis = require("redis");

const PORT = process.env.PORT || 3000;
const REDIS_PORT = process.env.PORT || 6379;

// CLIENTE PARA LA CONEXIÓN CON REDIS
const client = redis.createClient({
  host: "34.70.185.180",
  port: 6379,
  auth_pass: "rZC8P/36pkIx24KRrDE7L8DeyFAqBK3MZ9F+SHqJpUQExLTvAfTZ0zeMDxkIDSp2UhdAwOJvCaebNY0S",
});

const app = express();
app.use(express.json({ extended: true }));

// FORMATO DE RESPUESTA
function setResponse(username, repos) {
  return `<h2>${username} tiene ${repos} gitHub repositorios</h2>`;
}

// OBTENER DATOS DE REDIS
function cache(req, res, next) {
  const { id } = req.params;
  client.get("*", (err, data) => {
    if (err) throw err;

    if (data !== null) {
      console.log(data);
      res.send(setResponse(data, data));
    } else {
      next();
    }
  });
}

// BUSCA DATA EXTERNA Y LA GUARDA EN REDIS
async function getReporte(req, res, next) {
  try {
    console.log("Fetching data...");
    console.log(req.params);
    const username = req.params.id;

    const response = await fetch(`https://api.github.com/users/${username}`);

    const data = await response.json();

    const reps = data.public_repos;

    // guardamos en redis con key, tiempo expiración (3600 es una hora), value
    client.setex(username, 3600, reps);

    res.send(setResponse(username, reps));
  } catch (error) {
    console.error(error);
    res.status(500);
  }
}

// GUARDAMOS DIRECTAMENTE EN REDIS
/* Ejemplo de data a insertar
{
    "key": "persona1",
    "data": {
        "nombre": "Javier3",
        "edad": 21
    }
}
*/
function postReporte(req, res) {
  const { key, data } = req.body;
  console.log(key);
  console.log(data);
  const data_json = JSON.stringify(data);
  client.setex(key, 3600, data_json, (err, resp) => {
    if (err) {
      return res.status(500);
    }
    return res.send(resp);
  });
}

const getValueOfKey = (key) => {
  return new Promise((resolve, reject) => {
    client.get(key, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
};

// OBTENER TODAS LAS CLAVES DE REDIS
function getAllKeys(req, res) {
  let llaves = [];

  client.keys("*", async (err, keys) => {
    if (err) return res.send(err);

    if (keys.length < 1) {
      return res.send("No data found in redis");
    }

    try {
      for (var i = 0, len = keys.length; i < len; i++) {
        //console.log("La llave es: ", keys[i]);
        await getValueOfKey(keys[i]).then((resp) => {
          if (keys[i] !== 'indice') {
            console.log("La respuesta es: ", resp);
            llaves.push(JSON.parse(resp));
          }
        });
      }

      const locations = llaves.reduce((locations, item) => {
        const location = locations[item.location] || [];
        location.push(item);
        locations[item.location] = location;
        return locations;
      }, {});

      const paises_total = [];
      for (const property in locations) {
        console.log(`{"${property}": ${locations[property].length}}`);
        paises_total.push(
          JSON.parse(
            `{"pais":"${property}", "vacunados": ${locations[property].length}}`
          )
        );
      }

      paises_total.sort((a, b) =>
        a.vacunados < b.vacunados ? 1 : b.vacunados < a.vacunados ? -1 : 0
      );

      res.send(paises_total);
    } catch (error) {
      console.error("El error fue: " + error);
      res.send([]);
    }
  });
}

// OBTENER TODAS LAS CLAVES DE REDIS
function getAllKeys2(req, res) {
  let pais_a_buscar = "Guatemala";

  let llaves = [];

  client.keys("*", async (err, keys) => {
    if (err) return res.send(err);

    if (keys.length < 1) {
      return res.send([]);
    }

    try {
      for (var i = 0, len = keys.length; i < len; i++) {
        console.log("La llave es: ", keys[i]);
        await getValueOfKey(keys[i]).then((resp) => {
          console.log("La respuesta es: ", resp);
          llaves.push(JSON.parse(resp));
        });
      }

      const locations = llaves.reduce((locations, item) => {
        const location = locations[item.location] || [];
        location.push(item);
        locations[item.location] = location;
        return locations;
      }, {});

      res.send(locations[pais_a_buscar]);
    } catch (error) {
      console.error("ERROR:", error);
      res.send([]);
    }
  });
}

// OBTENER TODAS LAS CLAVES DE REDIS
function getAllKeys3(req, res) {
  let pais_a_buscar = "Brazil";

  let llaves = [];

  client.keys("*", async (err, keys) => {
    if (err) return res.send(err);

    if (keys.length < 1) {
      return res.send([]);
    }

    try {
      for (var i = 0, len = keys.length; i < len; i++) {
        console.log("La llave es: ", keys[i]);
        await getValueOfKey(keys[i]).then((resp) => {
          console.log("La respuesta es: ", resp);
          llaves.push(JSON.parse(resp));
        });
      }

      const locations = llaves.reduce((locations, item) => {
        const location = locations[item.location] || [];
        location.push(item);
        locations[item.location] = location;
        return locations;
      }, {});

      //return res.send(locations[pais_a_buscar]);

      const locations2 = locations[pais_a_buscar].reduce((edades, item) => {
        const location = edades[item.age] || [];
        location.push(item);
        edades[item.age] = location;
        return edades;
      }, {});

      const paises_total = [];
      for (const property in locations2) {
        console.log(`{"${property}": ${locations2[property].length}}`);
        paises_total.push(
          JSON.parse(
            `{"edad":"${property}", "count": ${locations2[property].length}}`
          )
        );
      }
      res.send(paises_total);
    } catch (error) {
      console.log("ERROR: ", error);
      res.send([]);
    }
  });
}

// RUTAS
//app.get("/reportes/:id", cache, getReporte);

app.post("/reportes", postReporte);
app.get("/pais-total-vacunados", getAllKeys);
app.get("/pais-vacunados", getAllKeys2);
app.get("/pais-edades", getAllKeys3);

app.listen(PORT, () => {
  console.log("Server listen on port ", PORT);
});


