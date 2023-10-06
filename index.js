#!/usr/bin/env node


import { Command } from 'commander';
const commander = new Command();
import fs from 'fs'
import { execSync, spawnSync } from "child_process"

import colors from 'colors'
import ora, { spinners } from 'ora'
commander
  .command("create <type> <appName>")
  .description("Create a new MERN stack app or Node.js app (mern/node)")
  .action((type, appName) => {
    if (type === "node") {
        const spinner = ora({
            text: `Creating a simple Node.js application: ${appName}`, spinner: "dots", color: "cyan"}).start();
      // Create backend app
      CreateServerSide(type, appName);
      spinner.succeed(`${appName} created!`.green);
    } else if (type === "mern") {
      const spinner = ora({
        text: `Creating a MERN stack application: ${appName}...`, spinner: "dots", color: "cyan"}).start();
      fs.mkdirSync(appName);
      process.chdir(appName);
      spinner.text = "Server Side Creation"
      CreateServerSide(type, appName);
      spinner.succeed(`Server Side created!`.green)
      // Create a React app using Create React App
      const npmCreateProcess = spawnSync(
        "npm",
        ["create", "vite@latest", appName],
        {
          stdio: "inherit", // Pipe the child process's stdio to the parent's stdio
          shell: true, // Use a shell to run the command
        }
      );

      if (npmCreateProcess.status === 0) {
        console.clear();
        fs.renameSync(appName, "client");
        spinner.succeed(`MERN stack app template created in "${appName}" directory.
Done. Now run:

  cd ${appName}/client
  npm install
  npm run dev`);
      } else {
        console.error(
          `Error creating Vite project: ${npmCreateProcess.stderr.toString()}`
        );
      }
    } else {
      console.error("Invalid app type. Use 'mern' or 'node'.");
    }
  });

commander.parse(process.argv);

function CreateServerSide(type, appName) {
  fs.mkdirSync(appName);
  process.chdir(appName);
  execSync(`npm init -y`);
  fs.writeFileSync(
    `server.js`,
    `import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import session from 'express-session';
// configure necessary modules
dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;
const uri = process.env.MONGO_URI || "";
        
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet(
  {
    crossOriginResourcePolicy: false,
  }
))
app.use(
    cors({
      origin: "http://localhost:5173",
      methods: "GET,POST,PUT,DELETE",
      credentials: true,
    })
  );
app.use(
    session({
      secret: "SECRET", // Replace with a more secure secret
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 24 * 60 * 60 * 1000 }, // Set maxAge to 24 hours in milliseconds
    })
  );

app.use(express.static('public'));


app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({ "error": err.name + ": " + err.message })
    } else if (err) {
        res.status(400).json({ "error": err.name + ": " + err.message })
        console.log(err)
    }
})

// connect to the database
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.log('Error: ' + err);
});

// create a mock routes
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(PORT, () => {
    console.log(\`Server is running on port: \${PORT}\`);
});
`
  );
  fs.writeFileSync(
    `.env`,
    `PORT=
MONGO_URI=`
  );

 
  if (type === "mern") {
    process.chdir("../");
    try {
        fs.renameSync(appName, "server");
      } catch (error) {
        console.error(`Error renaming directory: ${error.message}`);
      }
  }
}
