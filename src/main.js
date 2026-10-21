const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron'); 
const path = require('path');
const { autoUpdater } = require('electron-updater');
const getmac = require('getmac'); 

const envPath = app.isPackaged ? path.join(path.dirname(process.execPath), '.env') : path.join(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });

let centroActual = { id_centro: null, nombre_sucursal: "" };

ipcMain.handle('obtener-contexto', () => ({ ...centroActual, version: app.getVersion() }));

ipcMain.handle('obtener-cola-impresion', async () => {
    try {
        const { sql, poolPromise } = require('../db.js');
        const pool = await poolPromise;
        const resultado = await pool.request()
            .input('id_centro', sql.Int, centroActual.id_centro)
            .query(`
                SELECT TOP 50 c.id_captura, c.placa, c.marca, c.modelo, c.fecha_captura, u.username as capturista
                FROM capturas_vehiculares c
                LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
                WHERE c.id_centro = @id_centro ORDER BY c.fecha_captura DESC
            `);
        return { success: true, data: resultado.recordset };
    } catch (error) { return { success: false, message: error.message }; }
});

async function createWindow() { 
    const mainWindow = new BrowserWindow({ 
        width: 1100, height: 700, title: "MEGA | Impresión", 
        webPreferences: { nodeIntegration: true, contextIsolation: false } 
    });
    Menu.setApplicationMenu(null); 
    const macActual = getmac.default();

    try {
        const { sql, poolPromise } = require('../db.js');
        const pool = await poolPromise;
        const resultado = await pool.request()
            .input('mac', sql.VarChar, macActual)
            .query('SELECT * FROM verificentros WHERE mac_address = @mac AND estado_activo = 1');

        if (resultado.recordset.length > 0) {
            centroActual.id_centro = resultado.recordset[0].id_centro;
            centroActual.nombre_sucursal = resultado.recordset[0].nombre_sucursal;
            mainWindow.loadFile(path.join(__dirname, 'index.html')); 
        } else {
            dialog.showErrorBox('Equipo No Autorizado', 'Este equipo no está registrado en el Sistema de Captura principal.');
            app.quit();
        }
    } catch (error) { dialog.showErrorBox('Error', 'No hay conexión con la base de datos central.'); }
} 

app.whenReady().then(() => { 
autoUpdater.setFeedURL({
        provider: 'github', 
        owner: 'EduardoG0402', 
        repo: 'mega-impresion', 
        private: true,
        token: process.env.GH_TOKEN // <-- Cambiamos el texto fijo por esta variable
    });
    autoUpdater.checkForUpdatesAndNotify();
});