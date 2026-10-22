const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron'); 
const path = require('path');
const { autoUpdater } = require('electron-updater');

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
    mainWindow.loadFile(path.join(__dirname, 'index.html')); 
} 

app.whenReady().then(() => { 
    createWindow(); 
    
    // Configuración de Actualizaciones OTA
    autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'EduardoG0402',
        repo: 'mega-impresion',
        private: true,
        token: process.env.GH_TOKEN
    });
    autoUpdater.checkForUpdatesAndNotify();
});

// ==========================================
// EVENTOS DE ACTUALIZACIÓN (Las Leyendas)
// ==========================================
autoUpdater.on('update-available', () => {
    dialog.showMessageBox({ type: 'info', title: 'Actualización Disponible', message: 'Se encontró una nueva versión de impresión. Descargando en segundo plano...' });
});

autoUpdater.on('update-not-available', () => {
    dialog.showMessageBox({ type: 'info', title: 'Sistema Actualizado', message: 'Tienes la versión más reciente del Gestor de Impresión.' });
});

autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({ type: 'info', title: 'Actualización Lista', message: 'La actualización se ha descargado. El sistema se reiniciará automáticamente para instalarla.' }).then(() => {
        autoUpdater.quitAndInstall(true, true);
    });
});

autoUpdater.on('error', (err) => {
    dialog.showMessageBox({ type: 'error', title: 'Error de Actualización', message: 'No se pudo buscar actualizaciones. Revisa la conexión a internet.' });
});