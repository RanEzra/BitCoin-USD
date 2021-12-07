const args = process.argv.slice(2);
const time_quant = args[0];
const Airtable_key = args[1];

const Airtable = require('airtable'); 
const base = new Airtable({apiKey: Airtable_key}).base('appSBafNnZNpNV98e'); 
//Allows using Airtable server.
const XMLHttpRequest = require('xhr2'); 
//Allows reading the Json file.
var backup = [];
//In case the AirTable server fails, 
//the backup array is used to store all the data that haven't been loaded to the server yet.
var backup_is_not_empty = false; 
//Indicates that the backup buffer has 1 or more records.

//--------------------------Helpers---------------------
const loadJSON = (path, success, error) => {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          success(JSON.parse(xhr.responseText));
        }
        else {
          error(xhr);
        }
      }
    };
    xhr.open('GET', path, true);
    xhr.send();
}
//loading a JSON file to path, the 'success' function runs on success, error function otherwise. 
  
const Insert_backed_up_entries = () => {
    for (let i = 0; i < backup.length; i++) {
        base('Table 1').create([
            {
              "fields": {
                "Time": backup[i].date,
                "Rates": backup[i].rate
              }
            }
          ]);
      }
    backup = [];
    console.log("backup records updated at the Airtable and cleared!");
}
//Called when the server is up again to insert the backed-up entries to the Airtable and flush the backup list.

const Add_entry = (Data) => {  
        let entry = {
            "date" : new Date(),
            "rate" : Data["USD"]["last"]
        };
        base('Table 1').create([
            {
              "fields": {
                "Time": entry.date,
                "Rates": entry.rate
              }
            }
          ], function(err) {
            if (err) {
              console.error(err);
              backup.push(entry);
              backup_is_not_empty = true;
              return;
            }
            else {
                if (backup_is_not_empty) {
                    Insert_backed_up_entries();
                }
                backup_is_not_empty = false;
                console.log("new entry pushed!");
                console.log(entry);
            }
          });
}
//called as a continuation function from loadJSON function to insert to new entry to the Airtable.
// if the server is down, the readed entry is being backed-up.

const Start = () => loadJSON("https://blockchain.info/ticker", Add_entry,'error occured while loading JSON from the web!');
//starts the program from reading the JSON file.

setInterval(Start,time_quant); //60,000 is 1 minute, can be changed by the user.




