const { ipcRenderer } = require('electron');

window.onload = async () => {
    // Traer el nombre del centro configurado
    const info = await ipcRenderer.invoke('obtener-info-centro');
    document.getElementById('badge-sucursal').innerText = `${info.nombre} | v${info.version}`;
    
    // Cargar tabla inicial y programar refresco cada 10 seg
    cargarColaImpresion();
    setInterval(cargarColaImpresion, 10000); 
};

async function cargarColaImpresion() {
    const resultado = await ipcRenderer.invoke('obtener-cola-impresion');
    const tbody = document.getElementById('cola-impresion');
    tbody.innerHTML = ''; 

    if (resultado.success && resultado.data.length > 0) {
        resultado.data.forEach(cap => {
            const fecha = new Date(cap.fecha_captura);
            const horaFormato = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            tbody.innerHTML += `
                <tr>
                    <td><b>#${cap.id_captura}</b></td>
                    <td class="placa-highlight">${cap.placa}</td>
                    <td>${cap.marca} ${cap.modelo}</td>
                    <td>${horaFormato}</td>
                    <td>${cap.capturista || 'SISTEMA'}</td>
                    <td>
                        <button class="btn-print" onclick="abrirCertificado(${cap.id_captura})">🖨️ Imprimir</button>
                    </td>
                </tr>
            `;
        });
    } else {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No hay certificados pendientes en la cola.</td></tr>`;
    }
}

function abrirCertificado(id_captura) {
    alert("Generando diseño del certificado para el Folio #" + id_captura + "...");
}