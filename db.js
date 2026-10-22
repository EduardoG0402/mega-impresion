const sql = require('mssql');

// 1. Credenciales de la Base de Datos
const config = {
    user: 'sa',                   
    password: 'Summar2026',   
    server: '192.168.100.30',      
    database: 'mega_verificentro_db',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const ID_CENTRO_LOCAL = 1;

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => pool)
    .catch(err => { console.error('Error en BD: ', err); throw err; });

module.exports = { sql, poolPromise, ID_CENTRO_LOCAL };