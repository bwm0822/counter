
const dbName = 'db';
const _st_schedule = 'schedule'

const dbPromise = idb.openDB(dbName, 1, {
    upgrade(db) {
        console.log('create store');
        //db.createObjectStore(storeName, {keyPath: 'id', autoIncrement: true});
        if(!db.objectStoreNames.contains(_st_schedule))
        {
            db.createObjectStore(_st_schedule, {keyPath: 'pk', autoIncrement: true});
        }
    },
});

async function idb_put(store, val, key) 
{
    return (await dbPromise).put(store, val, key);
}

async function idb_delete(store, key) 
{
    return (await dbPromise).delete(store, key);
}

async function idb_get(store, key) 
{
    return (await dbPromise).get(store, key);
}

function idb_putAll(store, data)
{
    let p = [];
    data.forEach(element => {
        p.push(idb_put(store, element));
    });
    return Promise.all(p);
}

async function idb_getAll(store) 
{
    return (await dbPromise).getAll(store);
}

async function idb_clear(store) 
{
    return (await dbPromise).clear(store);
}

async function idb_count(store)
{
    return (await dbPromise).count(store);
}

// schedule
function scheGetAll()
{
    return idb_getAll(_st_schedule);
}

function schePutAll(data)
{
    return idb_putAll(_st_schedule, data);
}

function scheGet(key)
{
    return idb_get(_st_schedule, key);
}

function schePut(data)
{
    return idb_put(_st_schedule, data);
}

function scheDelete(data)
{
    return idb_delete(_st_schedule, data.pk);
}

function scheClear()
{
    return idb_clear(_st_schedule);
}
