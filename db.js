const sql = require('mssql');

// Configuración del puente hacia SQL Server en tu Mac
const config = {
    user: 'sa',                     // Tu usuario de SQL Server (usualmente es 'sa')
    password: 'Summa2026',   // Tu contraseña de SQL Server
    server: '192.168.100.33',       // La IP de tu Mac
    database: 'mega_verificentro_db',
    options: {
        encrypt: false,             // Falso para redes locales sin certificado SSL
        trustServerCertificate: true // Fundamental para evitar errores de red local
    }
};

// Creamos la conexión
const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ Conexión exitosa a la Base de Datos SQL Server (192.168.100.33)');
        return pool;
    })
    .catch(err => {
        console.error('❌ Error conectando a SQL Server:', err.message);
    });

module.exports = { sql, poolPromise };