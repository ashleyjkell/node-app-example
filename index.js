const express = require('express');
const AWS = require('aws-sdk');
const snowflake = require('snowflake-sdk');
const app = express();

// Create a new Secrets Manager client
const secretsManager = new AWS.SecretsManager();

// Get the name of the secret from an environment variable
const secretName = process.env.SECRET_NAME;
// Get the name of the table from an environment variable
const tableName = process.env.TABLE_NAME;

// Check if the secret name and table name are valid
if (!secretName || !tableName) {
    printError("SECRET_NAME or TABLE_NAME environment variables are missing or empty");
    return;
}

app.get('/', (req, res) => {
    // Call the Secrets Manager to retrieve the secret value
    secretsManager.getSecretValue({ SecretId: secretName }, (err, data) => {
        if (err) {
            res.send("Error while trying to retrieve the secret value: " + err);
            return;
        }
        // Parse the secret value from JSON
        const secret = JSON.parse(data.SecretString);
        // create a connection object
        let connection = snowflake.createConnection({
            account: secret.account,
            username: secret.username,
            password: secret.password,
            warehouse: secret.warehouse,
            database: secret.database,
            schema: secret.schema
        });
        // execute the query
        connection.execute({
            sqlText: `SELECT * FROM ${tableName}`
        }).then(function(results) {
            // Get the column names
            let columnNames = results.metadata.map(function(el) { return el.name });
            // Create an empty table
            let table = "<table>";
            // Create the table header
            table += "<tr>";
            columnNames.forEach(function(name) {
                table += "<th>" + name + "</th>";
            });
            table += "</tr>";
            // Add the rows to the table
            results.rows.forEach(function(row) {
                table += "<tr>";
                columnNames.forEach(function(name) {
                    table += "<td>" + row[name] + "</td>";
                });
                table += "</tr>";
            });
            // Close the table
            table += "</table>";
            // Send the table as the response
            res.send(table);
        }).catch(function(err) {
            res.send("Error while trying to execute the query: " + err);
        });
    });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});

function printError(error) {
    console.error(error);
}