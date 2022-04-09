let db;
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;

  // check if app is online
  if (navigator.onLine) {
    uploadbudget();
  }
};

request.onerror = function (event) {
  // logs error
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(["pending"], "readwrite");

  const budgetObjectStore = transaction.objectStore("pending");

  // adds record to user store
  budgetObjectStore.add(record);
}

function uploadbudget() {
  // open a transaction on pending db
  const transaction = db.transaction(["pending"], "readwrite");

  // access pending object store
  const budgetObjectStore = transaction.objectStore("pending");

  // get all records from store and set to a variable
  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function () {
    // if there was data in indexedDb's store, then send it to api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          const transaction = db.transaction(["pending"], "readwrite");
          const budgetObjectStore = transaction.objectStore("pending");
          // clear all items in user store
          budgetObjectStore.clear();
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}
// listen for app coming back online
window.addEventListener("online", uploadbudget);