const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron'); 
const path = require('path');
const { autoUpdater } = require('electron-updater');
const getmac = require('getmac'); 

// Memoria dinámica que se llenará al leer la MAC
let centroActual = { id_centro: null, nombre_sucursal: "" };

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
                WHERE c.id_centro = @id_centro 
                ORDER BY c.fecha_captura DESC
            `);
        return { success: true, data: resultado.recordset };
    } catch (error) { return { success: false, message: error.message }; }
});

ipcMain.handle('obtener-info-centro', () => {
    // Mandamos el nombre que se detectó al arrancar
    return { nombre: centroActual.nombre_sucursal, version: app.getVersion() };
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

        // Validamos a qué centro pertenece esta MAC
        const resultado = await pool.request()
            .input('mac', sql.VarChar, macActual)
            .query('SELECT * FROM verificentros WHERE mac_address = @mac AND estado_activo = 1');

        if (resultado.recordset.length > 0) {
            // Guardamos los datos dinámicamente y abrimos la ventana
            centroActual.id_centro = resultado.recordset[0].id_centro;
            centroActual.nombre_sucursal = resultado.recordset[0].nombre_sucursal;
            mainWindow.loadFile(path.join(__dirname, 'index.html')); 
        } else {
            dialog.showErrorBox('Equipo No Autorizado', 'Esta computadora (' + macActual + ') no está registrada en el sistema de captura principal.');
            app.quit();
        }
    } catch (error) {
        dialog.showErrorBox('Error de Red', 'No se pudo conectar a la base de datos central.');
        app.quit();
    }
} 

app.whenReady().then(() => { 
    createWindow(); 
    
    autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'EduardoG0402',
        repo: 'mega-impresion',
        private: true,
        token: process.env.GH_TOKEN
    });
    autoUpdater.checkForUpdatesAndNotify();
});

// Eventos de Actualización
autoUpdater.on('update-available', () => { dialog.showMessageBox({ type: 'info', title: 'Actualización Disponible', message: 'Descargando nueva versión en segundo plano...' }); });
autoUpdater.on('update-not-available', () => { dialog.showMessageBox({ type: 'info', title: 'Sistema Actualizado', message: 'Tienes la versión más reciente del Gestor de Impresión.' }); });
autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({ type: 'info', title: 'Actualización Lista', message: 'El sistema se reiniciará automáticamente para instalarla.' }).then(() => { autoUpdater.quitAndInstall(true, true); });
});
autoUpdater.on('error', () => { dialog.showMessageBox({ type: 'error', title: 'Error', message: 'No se pudo buscar actualizaciones.' }); });