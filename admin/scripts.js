import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://rqfqiaovgjaufuojfmsk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxZnFpYW92Z2phdWZ1b2pmbXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg3ODA5OTEsImV4cCI6MjA1NDM1Njk5MX0.05WXFwJg4JK77nEVxVUTohV-K0OCtPlcZ5yl7EiUxhk'; // Reemplaza con tu API Key
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', () => {
    initializeAdminFunctions();
});

function initializeAdminFunctions() {
    document.getElementById("saveButton").addEventListener("click", saveExchangeRate);
    document.getElementById("clearAllButton").addEventListener("click", clearAllRecords);
    displayExchangeRates();
}

async function saveExchangeRate() {
    const type = document.getElementById("type").value;
    const minAmount = parseInt(document.getElementById("minAmount").value);
    const maxAmount = parseInt(document.getElementById("maxAmount").value);
    const exchangeRate = document.getElementById("exchangeRate").value;
    const fechaTasa = document.getElementById("fechaTasa").value;

    // Validar que exchangeRate sea un número decimal en el formato deseado
    const decimalPattern = /^[0-9]*\.[0-9]+$/;
    if (isNaN(minAmount) || isNaN(maxAmount) || !decimalPattern.test(exchangeRate) || !fechaTasa) {
        alert("Por favor, complete todos los campos correctamente. La tasa de cambio debe ser un número decimal (por ejemplo, 0.001).");
        return;
    }

    // Validar que el monto mínimo no sea mayor que la cantidad máxima
    if (minAmount > maxAmount) {
        alert("El monto mínimo no puede ser mayor que la cantidad máxima.");
        return;
    }

    const exchangeRateFloat = parseFloat(exchangeRate);

    // Verificar si el rango ya existe para el tipo seleccionado
    const { data: existingRanges, error: fetchError } = await supabase
        .from('REGISTRO')
        .select('*')
        .eq('tipo', type);

    if (fetchError) {
        console.error('Error al verificar rangos existentes: ', fetchError);
        return;
    }

    const isOverlapping = existingRanges.some(range => 
        (minAmount < range.cantidad_maxima && maxAmount > range.monto_minimo)
    );

    if (isOverlapping) {
        alert(`El rango de montos ya existe para el tipo ${type}.`);
        return;
    }

    const { error } = await supabase
        .from('REGISTRO')
        .insert([
            { tipo: type, monto_minimo: minAmount, cantidad_maxima: maxAmount, tasa_cambio: exchangeRateFloat, fecha_tasa: fechaTasa }
        ]);

    if (error) {
        alert('Error al guardar tasa de cambio: ' + error.message);
    } else {
        alert('¡Tasa de cambio guardada!');
        displayExchangeRates();
    }
}

async function displayExchangeRates() {
    const exchangeRatesContainer = document.getElementById('exchangeRates');
    exchangeRatesContainer.innerHTML = '';

    const { data, error } = await supabase
        .from('REGISTRO')
        .select('*');

    if (error) {
        console.error('Error al mostrar tasas de cambio: ', error);
    } else {
        data.forEach((rate) => {
            const exchangeRateDiv = document.createElement('div');
            exchangeRateDiv.classList.add('exchange-rate');

            exchangeRateDiv.innerHTML = `
                <span>Tipo: ${rate.tipo}, Mínimo: ${rate.monto_minimo}, Máximo: ${rate.cantidad_maxima}, Tasa: ${rate.tasa_cambio}, Fecha: ${rate.fecha_tasa}</span>
                <button onclick="deleteExchangeRate(${rate.id})">Eliminar</button>
            `;

            exchangeRatesContainer.appendChild(exchangeRateDiv);
        });
    }
}

async function deleteExchangeRate(id) {
    const { error } = await supabase
        .from('REGISTRO')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Error al eliminar tasa de cambio: ' + error.message);
    } else {
        alert('¡Tasa de cambio eliminada!');
        displayExchangeRates();
    }
}

// Función para limpiar todos los registros
async function clearAllRecords() {
    // Obtener todos los registros
    const { data: allRecords, error: fetchError } = await supabase
        .from('REGISTRO')
        .select('*');

    if (fetchError) {
        console.error('Error al obtener registros: ', fetchError);
        return;
    }

    // Eliminar cada registro individualmente
    for (const record of allRecords) {
        const { error } = await supabase
            .from('REGISTRO')
            .delete()
            .eq('id', record.id);

        if (error) {
            console.error('Error al eliminar registro: ', error);
        }
    }

    alert('¡Todos los registros han sido limpiados!');
    displayExchangeRates();
}

// Hacer que deleteExchangeRate esté disponible globalmente
window.deleteExchangeRate = deleteExchangeRate;

// Ejecutar las funciones de mostrar tasas de cambio al cargar la página
window.onload = function() {
    displayExchangeRates();
}