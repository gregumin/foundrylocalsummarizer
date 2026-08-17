Some prerequisites are needed before getting the files running, namely Node.js (Javascript runtime), Express (lets you spin up a server), multer (lets you upload files into said server), and the Foundry Local SDK.

First, visit https://nodejs.org to get Node.js working.

Visit https://foundrylocal.ai to download the Foundry Local SDK. Take note to download the Javascript version of the package.

Once everything is set up, copy or clone the files from this repository and put it into a local folder of your choice. 

When in PowerShell, cd (move) into said new folder run the following command to get Express and multer running:
[npm install express multer]

Then, spin up the server using the command:
[node server.js]

Now visit http://localhost:3000/ in your browser and you should be good to go!

Note: remember to keep the PowerShell terminal opened or your server will be shut down. 

Note 2: Foundry Local will need an active internet connection when first initializing the Qwen model to download the model into your local machine. It will be able to work fully offline on subsequent spin-ups.
