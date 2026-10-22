const { app, BrowserWindow, ipcMain, Menu } = require('electron'); 
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Consulta la cola de impresión usando el ID_CENTRO_LOCAL de db.js
ipcMain.handle('obtener-cola-impresion', async () => {
    try {
        const { sql, poolPromise, ID_CENTRO_LOCAL } = require('../db.js');
        const pool = await poolPromise;
        const resultado = await pool.request()
            .input('id_centro', sql.Int, ID_CENTRO_LOCAL)
            .query(`
                SELECT TOP 50 c.id_captura, c.placa, c.marca, c.modelo, c.fecha_captura, u.username as capturista
                FROM capturas_vehiculares c
                LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
                WHERE c.id_centro = @id_centro 
                ORDER BY c.fecha_captura DESC
            `);
        return { success: true, data: resultado.recordset };
    } catch (error) { return { success: false, message: error.message }; }
});

// Obtiene el nombre del centro para ponerlo en el título
ipcMain.handle('obtener-info-centro', async () => {
    try {
        const { sql, poolPromise, ID_CENTRO_LOCAL } = require('../db.js');
        const pool = await poolPromise;
        const resultado = await pool.request()
            .input('id_centro', sql.Int, ID_CENTRO_LOCAL)
            .query('SELECT nombre_sucursal FROM verificentros WHERE id_centro = @id_centro');
        
        const nombre = resultado.recordset.length > 0 ? resultado.recordset[0].nombre_sucursal : "Centro Desconocido";
        return { nombre, version: app.getVersion() };
    } catch (error) { return { nombre: "Error de conexión", version: app.getVersion() }; }
});

function createWindow() { 
    const mainWindow = new BrowserWindow({ 
        width: 1100, height: 700, title: "MEGA | Impresión", 
        webPreferences: { nodeIntegration: true, contextIsolation: false } 
    });
    Menu.setApplicationMenu(null); 
    
    // Carga directa de la interfaz limpia
    mainWindow.loadFile(path.join(__dirname, 'index.html')); 
} 

app.whenReady().then(() => { 
    createWindow(); 
});