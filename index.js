const express = require('express');
const AWS = require('aws-sdk');
const snowflake = require('snowflake-sdk');
const app = express();

// Get the name of the secret from an environment variable
const secretName = process.env.SECRET_NAME;
// Get the name of the table from an environment variable
const tableName = process.env.TABLE_NAME;

// Check if the secret name and table name are valid
if (!secretName || !tableName) {
    console.error("SECRET_NAME or TABLE_NAME environment variables are missing or empty");
    return;
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {

    function createTable(data) {
        const table = document.createElement("table");
        data.forEach(row => {
            Object.values(row).forEach(cellData => {
                document.createElement("td").appendChild(text);
                document.createTextNode(cellData).appendChild(td);
            });
            table.appendChild(document.createElement("tr"));
        });
        return table;
    }
    const secretsManager = new AWS.SecretsManager();
    const secretValue = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    const snowflakeCredentials = JSON.parse(secretValue.SecretString);

    const connection = snowflake.createConnection(snowflakeCredentials);
    const queryResult = await connection.execute({
        sqlText: `SELECT * FROM ${tableName}`
    });

    res.send(createTable(queryResult.rows).outerHTML);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server is listening on port ${port}`));
