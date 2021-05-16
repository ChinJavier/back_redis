const express = require("express");
const redis = require("redis");

const PORT = process.env.PORT || 3000;
const REDIS_PORT = process.env.PORT || 6379;

// CLIENTE PARA LA CONEXIÓN CON REDIS
const client = redis.createClient({
  host: "34.70.185.180",
  port: 6379,
  auth_pass:
    "rZC8P/36pkIx24KRrDE7L8DeyFAqBK3MZ9F+SHqJpUQExLTvAfTZ0zeMDxkIDSp2UhdAwOJvCaebNY0S",
});

const app = express();
app.use(express.json({ extended: true }));


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

async function guardarRegistro(req, res) {

    let indice = 0;

    await getValueOfKey('indice').then((resp) => {
        if (resp !== null) {
            indice = resp;
        }else{
            indice = 0;
            client.setex('indice', 3600, '0', (err, resp) => {
                if (err) {
                  return res.send('NO SE CREÓ EL INDICE');
                }
                console.log('indice creado')
              });
        }
    });


    const { data } = req.body;
    console.log(data);

    //TODO agregar el valor de key 
    const data_json = JSON.stringify(data);
    client.setex(indice.toString(), 3600, data_json, (err, resp) => {
      if (err) {
        return res.send('NO SE PUDO INSERTAR');
      }
      client.incr('indice', (err,id)=>{
          if(err){
              console.log(err)
          }
      })
      return res.send(resp);
    });

  }

app.post("/almacenar", guardarRegistro);

app.listen(PORT, () => {
  console.log("Server listen on port ", PORT);
});
