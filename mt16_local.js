let connection;

function openDatabase() {
  if (!connection) {
    connection = new Promise((resolve, reject) => {
      const request = indexedDB.open('tmp-mt16-local', 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore('verificaciones', {keyPath: 'id'});
        store.createIndex('equipo_fecha', ['instrumento_id', 'fecha']);
      };
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => { database.close(); connection = null; };
        resolve(database);
      };
      request.onerror = () => reject(request.error);
    }).catch(error => { connection = null; throw error; });
  }
  return connection;
}

export async function saveLocalVerification(record) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('verificaciones', 'readwrite');
    transaction.objectStore('verificaciones').put(record);
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error || Error('Guardado interrumpido.'));
  });
}

export async function listLocalVerifications(instrumentId) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('verificaciones', 'readonly');
    const index = transaction.objectStore('verificaciones').index('equipo_fecha');
    const range = IDBKeyRange.bound([instrumentId, ''], [instrumentId, '\uffff']);
    const request = index.openCursor(range, 'prev');
    const records = [];
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        records.push(cursor.value);
        cursor.continue();
      }
    };
    transaction.oncomplete = () => resolve(records);
    transaction.onabort = () => reject(transaction.error || Error('Consulta interrumpida.'));
  });
}
